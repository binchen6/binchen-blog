import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyPassword, createToken, serializeUser } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any;
    const { username, password } = body;
    if (!username || !password) {
      return NextResponse.json({ error: "Missing username or password" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const user = await db.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    if (Number(user.is_active ?? 1) !== 1) {
      return NextResponse.json({ error: "This account has been disabled" }, { status: 403 });
    }
    const validPassword = await verifyPassword(password, user.password_hash as string);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
    }
    const userWithoutPassword = serializeUser(user);
    const token = await createToken(userWithoutPassword as any);
    return NextResponse.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
