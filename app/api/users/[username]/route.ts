import { NextRequest } from "next/server";
import { getCurrentUserFromRequest, ROLE_LABELS } from "@/lib/auth";
import { cacheHeaders, json } from "@/lib/security";
import { UserRole } from "@/lib/types";
import { getDb } from "../../_shared";

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

    const db = getDb();

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
       ORDER BY published_at DESC
       LIMIT 50`
    ).bind(user.id).all();

    // 关注数据
    const [followerRow, followingRow] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS c FROM follows WHERE author_id = ?").bind(user.id).first(),
      db.prepare("SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?").bind(user.id).first(),
    ]);

    // 当前登录用户是否已关注
    let isFollowing = false;
    const currentUser = await getCurrentUserFromRequest(_request);
    if (currentUser && currentUser.id !== Number(user.id)) {
      const followRow = await db.prepare(
        "SELECT id FROM follows WHERE follower_id = ? AND author_id = ?"
      ).bind(currentUser.id, user.id).first();
      isFollowing = !!followRow;
    }

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
          follower_count: Number((followerRow as any)?.c ?? 0),
          following_count: Number((followingRow as any)?.c ?? 0),
        },
        posts: posts.results,
        isFollowing,
      },
      { headers: cacheHeaders(30, 120) }
    );
  } catch (error) {
    console.error("Get public profile error:", error);
    return json({ error: "Failed to fetch user" }, { status: 500 });
  }
}
