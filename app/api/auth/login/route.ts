import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyPassword, createToken, serializeUser } from "@/lib/auth";
import { clampText, json, rateLimit } from "@/lib/security";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const limited = rateLimit(request, { key: "login", limit: 10, windowMs: 10 * 60 * 1000 });
    if (limited) return limited;

    const body = await request.json() as any;
    const username = clampText(body.username, 24);
    const password = String(body.password || "");
    if (!username || !password) {
      return json({ error: "Missing username or password" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (!user) {
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
    const token = await createToken(userWithoutPassword as any);
    return json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    return json({ error: "Login failed" }, { status: 500 });
  }
}
