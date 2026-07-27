import { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { cacheHeaders, json, parseBoundedInt, rateLimit } from "@/lib/security";
import { getDb, requireLogin } from "../../../_shared";

export const runtime = "edge";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

/** 关注/粉丝列表行（JOIN users 后的公开字段 + 关注时间） */
interface FollowListRow {
  username: string;
  display_name: string | null;
  avatar: string | null;
  bio: string | null;
  role: string;
  followed_at: string;
}

/**
 * GET /api/users/[username]/follows?type=followers|following&page=1&limit=20
 * 粉丝 / 关注列表（公开）。iFollow / followsMe 相对于当前登录用户。
 */
export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const username = String(params.username || "").slice(0, 24);
    if (!USERNAME_RE.test(username)) {
      return json({ error: "Invalid username" }, { status: 400 });
    }
    const url = new URL(request.url);
    const type = url.searchParams.get("type") === "following" ? "following" : "followers";
    const page = parseBoundedInt(url.searchParams.get("page"), 1, 1, 1000);
    const limit = parseBoundedInt(url.searchParams.get("limit"), 20, 1, 50);
    const offset = (page - 1) * limit;

    const db = getDb();

    const user = await db.prepare("SELECT id FROM users WHERE username = ? AND is_active = 1").bind(username).first();
    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }
    const uid = Number(user.id);

    // followers: 谁关注了 TA（f.author_id = uid，取 f.follower_id 的用户）
    // following: TA 关注了谁（f.follower_id = uid，取 f.author_id 的用户）
    const whereCol = type === "followers" ? "f.author_id" : "f.follower_id";
    const joinCol = type === "followers" ? "f.follower_id" : "f.author_id";

    const countRow = await db.prepare(`SELECT COUNT(*) AS c FROM follows f WHERE ${whereCol} = ?`).bind(uid).first();
    const total = Number(countRow?.c ?? 0);

    const rows = await db.prepare(
      `SELECT u.username, u.display_name, u.avatar, u.bio, u.role, f.created_at AS followed_at
       FROM follows f JOIN users u ON u.id = ${joinCol}
       WHERE ${whereCol} = ? AND u.is_active = 1
       ORDER BY f.created_at DESC, f.id DESC
       LIMIT ? OFFSET ?`
    ).bind(uid, limit, offset).all<FollowListRow>();

    const list = rows.results || [];

    // 当前登录用户与列表成员的相互关注关系（用于回关/互关标识）
    // 优化：使用单条 SQL + CASE 聚合替代两条查询
    const currentUser = await getCurrentUserFromRequest(request);
    let iFollowSet = new Set<string>();
    let followsMeSet = new Set<string>();
    if (currentUser && list.length > 0) {
      const names = list.map((r) => String(r.username));
      const ph = names.map(() => "?").join(",");
      // 单条查询：iFollow（我关注了谁）
      const followRows = await db.prepare(
        `SELECT u.username,
                MAX(CASE WHEN f.follower_id = ? THEN 1 ELSE 0 END) AS i_follow,
                MAX(CASE WHEN f.author_id = ? THEN 1 ELSE 0 END) AS follows_me
         FROM follows f
         JOIN users u ON u.id = CASE WHEN f.follower_id = ? THEN f.author_id ELSE f.follower_id END
         WHERE (f.follower_id = ? OR f.author_id = ?)
           AND u.username IN (${ph})
         GROUP BY u.username`
      ).bind(currentUser.id, currentUser.id, currentUser.id, currentUser.id, currentUser.id, ...names).all();
      for (const row of (followRows.results || []) as Record<string, unknown>[]) {
        if (row.i_follow) iFollowSet.add(String(row.username));
        if (row.follows_me) followsMeSet.add(String(row.username));
      }
    }

    return json(
      {
        type,
        page,
        limit,
        total,
        isOwner: !!currentUser && currentUser.username === username,
        users: list.map((r) => ({
          username: r.username,
          display_name: r.display_name || null,
          avatar: r.avatar || null,
          bio: r.bio || null,
          role: r.role,
          followed_at: r.followed_at,
          iFollow: iFollowSet.has(String(r.username)),
          followsMe: followsMeSet.has(String(r.username)),
        })),
      },
      { headers: cacheHeaders(15, 60) }
    );
  } catch (error) {
    console.error("Get follows list error:", error);
    return json({ error: "Failed to fetch follows" }, { status: 500 });
  }
}

/**
 * DELETE /api/users/[username]/follows?target=<username> — 移除粉丝（仅本人或 owner/admin）
 */
export async function DELETE(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "请先登录" }, { status: 401 });
    }
    const limited = rateLimit(request, { key: `follows-del:${currentUser.id}`, limit: 60, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const username = String(params.username || "").slice(0, 24);
    const isSelf = currentUser.username === username;
    const isAdmin = currentUser.role === "owner" || currentUser.role === "admin";
    if (!isSelf && !isAdmin) {
      return json({ error: "只能管理自己的粉丝列表" }, { status: 403 });
    }

    const url = new URL(request.url);
    const targetName = String(url.searchParams.get("target") || "").slice(0, 24);
    if (!USERNAME_RE.test(targetName)) {
      return json({ error: "Invalid target" }, { status: 400 });
    }

    const db = getDb();

    const owner = await db.prepare("SELECT id FROM users WHERE username = ? AND is_active = 1").bind(username).first();
    if (!owner) {
      return json({ error: "User not found" }, { status: 404 });
    }
    const target = await db.prepare("SELECT id FROM users WHERE username = ?").bind(targetName).first();
    if (!target) {
      return json({ error: "Target not found" }, { status: 404 });
    }

    await db.prepare("DELETE FROM follows WHERE follower_id = ? AND author_id = ?").bind(target.id, owner.id).run();
    const countRow = await db.prepare("SELECT COUNT(*) AS c FROM follows WHERE author_id = ?").bind(owner.id).first();
    return json({ removed: true, followerCount: Number(countRow?.c ?? 0) });
  } catch (error) {
    console.error("Remove follower error:", error);
    return json({ error: "Failed to remove follower" }, { status: 500 });
  }
}
