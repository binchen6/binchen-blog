import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const slug = params.slug;
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const results = await db.prepare(
      "SELECT comments.*, users.display_name AS user_display_name, users.username AS username FROM comments LEFT JOIN users ON users.id = comments.user_id WHERE post_id = ? ORDER BY comments.created_at DESC"
    ).bind(post.id).all();
    return NextResponse.json({ comments: results.results });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json() as any;
    const { name, email, content, parentId } = body;
    const currentUser = await getCurrentUserFromRequest(request);
    const commentName = currentUser?.display_name || currentUser?.username || name;
    const commentEmail = currentUser?.email || email;
    if (!commentName || !commentEmail || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const slug = params.slug;
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const result = await db.prepare(
      "INSERT INTO comments (post_id, name, email, content, user_id, parent_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(post.id, commentName, commentEmail, content, currentUser?.id || null, parentId || null).first();
    return NextResponse.json({ comment: result }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
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
    console.error("Delete comment error:", error);
    return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
