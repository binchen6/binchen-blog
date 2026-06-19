import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "comments:manage_all")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare(
      `SELECT comments.*, posts.title AS post_title, posts.slug AS post_slug, users.username, users.display_name AS user_display_name
       FROM comments
       LEFT JOIN posts ON posts.id = comments.post_id
       LEFT JOIN users ON users.id = comments.user_id
       ORDER BY comments.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return NextResponse.json({ comments: results.results });
  } catch (error) {
    console.error("Get admin comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "comments:manage_all")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    await db.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(id, id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete admin comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
