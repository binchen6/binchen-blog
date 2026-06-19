import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canManagePost, getCurrentUserFromRequest } from "@/lib/auth";
import { generateExcerpt } from "@/lib/utils";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const slug = params.slug;
    const currentUser = await getCurrentUserFromRequest(request);
    const post = await db.prepare(
      "SELECT posts.*, users.display_name AS author_name, users.username AS author_username FROM posts LEFT JOIN users ON users.id = posts.author_id WHERE posts.slug = ?"
    ).bind(slug).first();
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (post.status !== "published" && (!currentUser || !canManagePost(currentUser, Number(post.author_id)))) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    await db.prepare("UPDATE posts SET view_count = view_count + 1 WHERE slug = ?").bind(slug).run();
    return NextResponse.json({ post });
  } catch (error) {
    console.error("Get post error:", error);
    return NextResponse.json({ error: "Failed to fetch post" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const existing = await db.prepare("SELECT * FROM posts WHERE slug = ?").bind(params.slug).first();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (!canManagePost(currentUser, Number(existing.author_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as any;
    let existingImages: string[] = [];
    try {
      existingImages = existing.images ? JSON.parse(existing.images) : [];
    } catch {
      existingImages = [];
    }
    const {
      title = existing.title,
      content = existing.content,
      coverImage = existing.cover_image,
      tags = existing.tags,
      status = existing.status,
      mode = existing.mode || "article",
      images = existingImages,
    } = body;

    if (!title || !content || !["published", "draft"].includes(status) || !["article", "moment"].includes(mode)) {
      return NextResponse.json({ error: "Invalid post data" }, { status: 400 });
    }

    const wasDraft = existing.status !== "published";
    const publishedAt = status === "published"
      ? (existing.published_at || new Date().toISOString())
      : null;

    const updated = await db.prepare(
      `UPDATE posts
       SET title = ?, content = ?, excerpt = ?, cover_image = ?, images = ?, mode = ?, status = ?, updated_at = ?, published_at = ?, tags = ?
       WHERE slug = ?
       RETURNING *`
    ).bind(
      String(title).trim(),
      String(content).trim(),
      generateExcerpt(String(content)),
      coverImage || null,
      JSON.stringify(Array.isArray(images) ? images : []),
      mode,
      status,
      new Date().toISOString(),
      publishedAt,
      tags || null,
      params.slug
    ).first();

    return NextResponse.json({ post: updated });
  } catch (error) {
    console.error("Update post error:", error);
    return NextResponse.json({ error: "Failed to update post" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const existing = await db.prepare("SELECT id, author_id FROM posts WHERE slug = ?").bind(params.slug).first();
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (!canManagePost(currentUser, Number(existing.author_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.batch([
      db.prepare("DELETE FROM comments WHERE post_id = ?").bind(existing.id),
      db.prepare("DELETE FROM posts WHERE id = ?").bind(existing.id),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete post error:", error);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
