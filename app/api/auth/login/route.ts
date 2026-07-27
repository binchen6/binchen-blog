import { NextRequest } from "next/server";
import { verifyPassword, createToken, serializeUser } from "@/lib/auth";
import { clampText, json, rateLimit } from "@/lib/security";
import { getDb, parseJsonBody } from "../../_shared";

export const runtime = "edge";

// 虚拟哈希用于时序均衡（未知用户不提前返回，防止用户名字典枚举）
const DUMMY_USER_HASH = "0000000000000000000000000000000000000000000000000000000000000000:00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { key: "login", limit: 10, windowMs: 10 * 60 * 1000 });
    if (limited) return limited;

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid request body" }, { status: 400 });
    }
    const username = clampText(body.username, 24);
    const password = String(body.password || "");
    if (!username || !password) {
      return json({ error: "Missing username or password" }, { status: 400 });
    }
    const db = getDb();
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (!user) {
      // 时序均衡：对未知用户也执行一次 verifyPassword（花销均衡），返回统一错误
      await verifyPassword(password, DUMMY_USER_HASH);
      return json({ error: "Invalid username or password" }, { status: 401 });
    }
    if (Number(user.is_active ?? 1) !== 1) {
      return json({ error: "This account has been disabled" }, { status: 403 });
    }
    const validPassword = await verifyPassword(password, user.password_hash as string);
    if (!validPassword) {
      return json({ error: "Invalid username or password" }, { status: 401 });
    }
    const userWithoutPassword = serializeUser(user);
    const token = await createToken(userWithoutPassword);
    return json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    return json({ error: "Login failed" }, { status: 500 });
  }
}
