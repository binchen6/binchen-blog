import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { hashPassword, createToken, serializeUser } from "@/lib/auth";
import { clampText, json, rateLimit } from "@/lib/security";
import { validateEmail } from "@/lib/utils";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { key: "register", limit: 5, windowMs: 10 * 60 * 1000 });
    if (limited) return limited;

    const body = await request.json() as any;
    const username = clampText(body.username, 24);
    const email = clampText(body.email, 254).toLowerCase();
    const password = String(body.password || "");
    const displayName = clampText(body.displayName, 40);
    if (!username || !email || !password) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username) || !validateEmail(email) || password.length < 8 || password.length > 128) {
      return json({ error: "Invalid registration data" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const existingUser = await db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").bind(username, email).first();
    if (existingUser) {
      return json({ error: "Username or email already exists" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    // 新注册用户默认 member（社交成员）：可评论/留言/点赞/关注，
    // 发表文章需站主在控制台提升为 author/editor。
    const result = await db.prepare(
      "INSERT INTO users (username, email, password_hash, display_name, role) VALUES (?, ?, ?, ?, ?) RETURNING id, username, email, display_name, avatar, role, bio, is_active, created_at"
    ).bind(username, email, passwordHash, displayName || null, "member").first();
    const user = serializeUser(result);
    const token = await createToken(user as any);
    return json({ user, token }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return json({ error: "Registration failed" }, { status: 500 });
  }
}
