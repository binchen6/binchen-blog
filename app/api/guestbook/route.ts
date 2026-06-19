import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";

export const runtime = "edge";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare(
      "SELECT guestbook.*, users.display_name AS user_display_name, users.username AS username FROM guestbook LEFT JOIN users ON users.id = guestbook.user_id ORDER BY guestbook.created_at DESC LIMIT 50"
    ).all();
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
    const currentUser = await getCurrentUserFromRequest(request);

    const entryName = currentUser?.display_name || currentUser?.username || name;
    const entryEmail = currentUser?.email || email;

    if (!entryName || !entryEmail || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const result = await db.prepare(
      "INSERT INTO guestbook (name, email, content, user_id, reply_to) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(entryName, entryEmail, content, currentUser?.id || null, replyTo || null).first();

    return NextResponse.json({ entry: result }, { status: 201 });
  } catch (error) {
    console.error("Create guestbook entry error:", error);
    return NextResponse.json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "guestbook:manage_all")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    await db.prepare("DELETE FROM guestbook WHERE id = ? OR reply_to = ?").bind(id, id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete guestbook entry error:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
