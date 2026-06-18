import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { hashPassword, createToken } from "@/lib/auth";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, email, password, displayName } = body;
    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const existingUser = await db.prepare("SELECT id FROM users WHERE username = ? OR email = ?").bind(username, email).first();
    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 });
    }
    const passwordHash = await hashPassword(password);
    const result = await db.prepare(
      "INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?) RETURNING id, username, email, display_name, created_at"
    ).bind(username, email, passwordHash, displayName || null).first();
    const token = await createToken(result as any);
    return NextResponse.json({ user: result, token }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
