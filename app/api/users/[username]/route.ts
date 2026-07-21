import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { ROLE_LABELS } from "@/lib/auth";
import { cacheHeaders, json } from "@/lib/security";
import { UserRole } from "@/lib/types";

export const runtime = "edge";

/**
 * GET /api/users/[username]
 * 公开主页数据：公开资料字段 + 已发布文章（不含邮箱等隐私字段）
 */
export async function GET(_request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = String(params.username || "").slice(0, 24);
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(username)) {
      return json({ error: "Invalid username" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    const user = await db.prepare(
      `SELECT id, username, display_name, avatar, role, bio, created_at
       FROM users WHERE username = ? AND is_active = 1`
    ).bind(username).first();

    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    const posts = await db.prepare(
      `SELECT id, title, slug, excerpt, cover_image, mode, published_at, created_at, tags, view_count
       FROM posts
       WHERE author_id = ? AND status = 'published'
       ORDER BY COALESCE(published_at, created_at) DESC
       LIMIT 50`
    ).bind(user.id).all();

    return json(
      {
        user: {
          username: user.username,
          display_name: user.display_name || null,
          avatar: user.avatar || null,
          role: user.role,
          roleLabel: ROLE_LABELS[(user.role as UserRole) || "author"] || "成员",
          bio: user.bio || null,
          created_at: user.created_at,
        },
        posts: posts.results,
      },
      { headers: cacheHeaders(30, 120) }
    );
  } catch (error) {
    console.error("Get public profile error:", error);
    return json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
