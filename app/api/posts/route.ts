import { NextRequest } from "next/server";
import { canAccessAdmin, getCurrentUserFromRequest } from "@/lib/auth";
import { generateSlug, generateExcerpt } from "@/lib/utils";
import { cacheHeaders, isSafePublicUrl, json, noStoreHeaders, parseBoundedInt, rateLimit, requireText } from "@/lib/security";
import { getDb, parseJsonBody, PostWriteBody, requirePermission } from "../_shared";

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

    const db = getDb();
    const currentUser = await getCurrentUserFromRequest(request);

    // 列表查询不取 content 全文，显著减少传输量（性能优化）
    const selectClause = "SELECT posts.id, posts.title, posts.slug, posts.excerpt, posts.cover_image, posts.images, posts.mode, posts.author_id, posts.status, posts.created_at, posts.updated_at, posts.published_at, posts.tags, posts.view_count, posts.is_featured, posts.featured_rank, LENGTH(posts.content) AS content_length, users.display_name AS author_name, users.username AS author_username, (SELECT COUNT(*) FROM likes WHERE target_type = 'post' AND target_id = posts.id) AS like_count FROM posts LEFT JOIN users ON users.id = posts.author_id";
    const params: (string | number)[] = [];
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

    // 搜索/筛选（仅在公开列表场景生效，避免暴露草稿）
    const publicScope = !admin && !mine;
    if (publicScope && (q || tag || mode)) {
      if (q) {
        where.push("(posts.title LIKE ? OR posts.excerpt LIKE ? OR posts.tags LIKE ?)");
        const like = `%${q}%`;
        params.push(like, like, like);
      }
      if (tag) {
        where.push("posts.tags LIKE ?");
        params.push(`%${tag}%`);
      }
      if (mode) {
        where.push("posts.mode = ?");
        params.push(mode);
      }
    }

    // WHERE 子句独立组装（主查询 SELECT 内含子查询的 WHERE，不能截取主查询）
    const whereSql = where.length > 0 ? ` WHERE ${where.join(" AND ")}` : "";

    let total: number | undefined;
    if (withTotal && publicScope) {
      // WHERE 条件均为 posts 表字段，计数无需 JOIN；此时 limit/offset 尚未 push
      const countRow = await db.prepare(`SELECT COUNT(*) AS c FROM posts${whereSql}`).bind(...params).first();
      total = Number(countRow?.c ?? 0);
    }

    // 公开/精选场景走 posts(status, published_at) 复合索引（published 行必有 published_at）；
    // admin/mine 可能含草稿（published_at 为 NULL），保留 COALESCE 兜底
    const orderSql = featured
      ? " ORDER BY posts.featured_rank ASC, posts.published_at DESC LIMIT ? OFFSET ?"
      : publicScope
        ? " ORDER BY posts.published_at DESC LIMIT ? OFFSET ?"
        : " ORDER BY COALESCE(posts.published_at, posts.created_at) DESC LIMIT ? OFFSET ?";
    const query = selectClause + whereSql + orderSql;
    params.push(limit, offset);

    const results = await db.prepare(query).bind(...params).all();

    // 用 content_length 估算阅读时长，不再传输全文
    const postsWithTime = results.results.map((post) => {
      const { content_length, ...rest } = post;
      return {
        ...rest,
        reading_time_minutes: Math.max(1, Math.ceil(Number(content_length || 0) / 600)),
      };
    });

    return json({ posts: postsWithTime, ...(total !== undefined ? { total } : {}) }, { headers: admin || mine ? noStoreHeaders() : cacheHeaders(30, 120) });
  } catch (error) {
    console.error("Get posts error:", error);
    return json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requirePermission(request, "posts:create");
    if (auth.error) return auth.error;
    const currentUser = auth.user;
    const limited = rateLimit(request, { key: `post:${currentUser.id}`, limit: 20, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await parseJsonBody<PostWriteBody>(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
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

    const db = getDb();

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
    if (!result) {
      return json({ error: "Failed to save post" }, { status: 500 });
    }

    return json({ post: result }, { status: 201 });
  } catch (error) {
    console.error("Create post error:", error);
    return json({ error: "Failed to create post" }, { status: 500 });
  }
}
