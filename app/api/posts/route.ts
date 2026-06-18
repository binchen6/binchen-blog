import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyToken } from "@/lib/auth";
import { generateSlug, generateExcerpt } from "@/lib/utils";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");
    const status = searchParams.get("status");

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    let query = "SELECT * FROM posts";
    const params: any[] = [];

    if (status) {
      query += " WHERE status = ?";
      params.push(status);
    } else {
      query += " WHERE status = 'published'";
    }

    query += " ORDER BY published_at DESC LIMIT ? OFFSET ?";
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
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await request.json() as any;
    const { title, content, coverImage, tags, status = "published" } = body;

    if (!title || !content) {
      return NextResponse.json({ error: "Title and content are required" }, { status: 400 });
    }

    const slug = generateSlug(title) + "-" + Date.now().toString(36);
    const excerpt = generateExcerpt(content);

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    const publishedAt = status === "published" ? new Date().toISOString() : null;
    const result = await db.prepare(
      `INSERT INTO posts (title, slug, content, excerpt, cover_image, author_id, status, published_at, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(title, slug, content, excerpt, coverImage || null, payload.userId, status, publishedAt, tags || null).first();

    return NextResponse.json({ post: result }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
