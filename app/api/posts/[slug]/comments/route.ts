import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const slug = params.slug;
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const results = await db.prepare("SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC").bind(post.id).all();
    return NextResponse.json({ comments: results.results });
  } catch (error) {
    console.error("Get comments error:", error);
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json();
    const { name, email, content, parentId } = body;
    if (!name || !email || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = ctx.env.DB;
    const slug = params.slug;
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const result = await db.prepare(
      "INSERT INTO comments (post_id, name, email, content, parent_id) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(post.id, name, email, content, parentId || null).first();
    return NextResponse.json({ comment: result }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json({ error: "Failed to create comment" }, { status: 500 });
  }
}
