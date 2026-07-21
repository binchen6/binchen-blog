import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { generateSlug, generateExcerpt } from "@/lib/utils";
import { cacheHeaders, isSafePublicUrl, json, parseBoundedInt, rateLimit, requireText } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 10, 1, 100);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
    const status = searchParams.get("status");
    const mine = searchParams.get("mine") === "1";
    const admin = searchParams.get("admin") === "1";
    const featured = searchParams.get("featured") === "1";
    const q = (searchParams.get("q") || "").trim().slice(0, 80);
    const tag = (searchParams.get("tag") || "").trim().slice(0, 50);
    const mode = searchParams.get("mode");
    const withTotal = searchParams.get("total") === "1";

    if (mode && !["article", "moment"].includes(mode)) {
      return json({ error: "Invalid mode" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const currentUser = await getCurrentUserFromRequest(request);

    let query = "SELECT posts.*, users.display_name AS author_name, users.username AS author_username FROM posts LEFT JOIN users ON users.id = posts.author_id";
    const params: any[] = [];
    const where: string[] = [];

    if (featured) {
      where.push("posts.status = 'published'");
      where.push("posts.is_featured = 1");
    } else if (admin) {
      if (!currentUser || !canAccessAdmin(currentUser)) {
        return json({ error: "Forbidden" }, { status: 403 });
      }
    } else if (mine) {
      if (!currentUser) {
        return json({ error: "Unauthorized" }, { status: 401 });
      }
      where.push("posts.author_id = ?");
      params.push(currentUser.id);
    } else {
      where.push("posts.status = 'published'");
    }

    if (status && !["published", "draft"].includes(status)) {
      return json({ error: "Invalid status" }, { status: 400 });
    }

    if (status && (admin || mine)) {
      where.push("posts.status = ?");
      params.push(status);
    }

    if (where.length > 0) {
      query += ` WHERE ${where.join(" AND ")}`;
    }

    // 搜索/筛选（仅在公开列表场景生效，避免暴露草稿）
    const publicScope = !admin && !mine;
    if (publicScope && (q || tag || mode)) {
      const extra: string[] = [];
      if (q) {
        extra.push("(posts.title LIKE ? OR posts.excerpt LIKE ? OR posts.tags LIKE ?)");
        const like = `%${q}%`;
        params.push(like, like, like);
      }
      if (tag) {
        extra.push("posts.tags LIKE ?");
        params.push(`%${tag}%`);
      }
      if (mode) {
        extra.push("posts.mode = ?");
        params.push(mode);
      }
      query += (where.length > 0 ? " AND " : " WHERE ") + extra.join(" AND ");
    }

    let total: number | undefined;
    if (withTotal && publicScope) {
      const countQuery = "SELECT COUNT(*) AS c FROM posts" + (query.includes(" WHERE ") ? query.slice(query.indexOf(" WHERE ")) : "");
      const countParams = params.slice(); // 此时 limit/offset 尚未 push
      const countRow = await db.prepare(countQuery).bind(...countParams).first();
      total = Number((countRow as any)?.c ?? 0);
    }

    query += featured
      ? " ORDER BY posts.featured_rank ASC, COALESCE(posts.published_at, posts.created_at) DESC LIMIT ? OFFSET ?"
      : " ORDER BY COALESCE(posts.published_at, posts.created_at) DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const results = await db.prepare(query).bind(...params).all();

    return json({ posts: results.results, ...(total !== undefined ? { total } : {}) }, { headers: admin || mine ? { "Cache-Control": "no-store" } : cacheHeaders(30, 120) });
  } catch (error) {
    console.error("Get posts error:", error);
    return json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(currentUser, "posts:create")) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    const limited = rateLimit(request, { key: `post:${currentUser.id}`, limit: 20, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await request.json() as any;
    const title = requireText(body.title, 120);
    const content = requireText(body.content, 50000);
    const tags = requireText(body.tags, 300) || "";
    const coverImage = body.coverImage ? String(body.coverImage).trim() : "";
    const { status = "published", mode = "article", images = [] } = body;

    if (!title || !content) {
      return json({ error: "Title and content are required" }, { status: 400 });
    }
    if (!["published", "draft"].includes(status) || !["article", "moment"].includes(mode)) {
      return json({ error: "Invalid post status or mode" }, { status: 400 });
    }
    if (!isSafePublicUrl(coverImage) || !Array.isArray(images) || images.length > 30 || images.some((url) => !isSafePublicUrl(url))) {
      return json({ error: "Invalid image data" }, { status: 400 });
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

    return json({ post: result }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return json({ error: "Failed to create post" }, { status: 500 });
  }
}
