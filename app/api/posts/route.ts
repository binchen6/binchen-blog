import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { generateSlug, generateExcerpt } from "@/lib/utils";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");
    const mine = searchParams.get("mine") === "1";
    const admin = searchParams.get("admin") === "1";

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const currentUser = await getCurrentUserFromRequest(request);

    let query = "SELECT posts.*, users.display_name AS author_name, users.username AS author_username FROM posts LEFT JOIN users ON users.id = posts.author_id";
    const params: any[] = [];
    const where: string[] = [];

    if (admin) {
      if (!currentUser || !canAccessAdmin(currentUser)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (mine) {
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      where.push("posts.author_id = ?");
      params.push(currentUser.id);
    } else {
      where.push("posts.status = 'published'");
    }

    if (status && (admin || mine)) {
      where.push("posts.status = ?");
      params.push(status);
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    query += " ORDER BY COALESCE(posts.published_at, posts.created_at) DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const results = await db.prepare(query).bind(...params).all();

    return NextResponse.json({ posts: results.results });
  } catch (error) {
    console.error("Get posts error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(currentUser, "posts:create")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as any;
    const { title, content, coverImage, tags, status = "published", mode = "article", images = [] } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }
    if (!["published", "draft"].includes(status) || !["article", "moment"].includes(mode)) {
      return NextResponse.json({ error: "Invalid post status or mode" }, { status: 400 });
    }

    const slug = generateSlug(title) + "-" + Date.now().toString(36);
    const excerpt = generateExcerpt(content);

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    const publishedAt = status === "published" ? new Date().toISOString() : null;
    const result = await db.prepare(
      `INSERT INTO posts (title, slug, content, excerpt, cover_image, images, mode, author_id, status, published_at, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(
      title.trim(),
      slug,
      content.trim(),
      excerpt,
      coverImage || null,
      JSON.stringify(Array.isArray(images) ? images : []),
      mode,
      currentUser.id,
      status,
      publishedAt,
      tags || null
    ).first();

    return NextResponse.json({ post: result }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
