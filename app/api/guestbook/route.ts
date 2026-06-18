import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare("SELECT * FROM guestbook ORDER BY created_at DESC LIMIT 50").all();
    return NextResponse.json({ entries: results.results });
  } catch (error) {
    console.error("Get guestbook error:", error);
    return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any;
    const { name, email, content, replyTo } = body;

    if (!name || !email || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const result = await db.prepare(
      "INSERT INTO guestbook (name, email, content, reply_to) VALUES (?, ?, ?, ?) RETURNING *"
    ).bind(name, email, content, replyTo || null).first();

    return NextResponse.json({ entry: result }, { status: 201 });
  } catch (error) {
    console.error("Create guestbook entry error:", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}
