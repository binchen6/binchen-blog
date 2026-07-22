import { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { cacheHeaders, json, parseBoundedInt, rateLimit } from "@/lib/security";
import { getDb, requireLogin } from "../../../_shared";

export const runtime = "edge";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

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
    const total = Number((countRow as any)?.c ?? 0);

    const rows = await db.prepare(
      `SELECT u.username, u.display_name, u.avatar, u.bio, u.role, f.created_at AS followed_at
       FROM follows f JOIN users u ON u.id = ${joinCol}
       WHERE ${whereCol} = ? AND u.is_active = 1
       ORDER BY f.created_at DESC, f.id DESC
       LIMIT ? OFFSET ?`
    ).bind(uid, limit, offset).all();

    const list = (rows.results || []) as any[];

    // 当前登录用户与列表成员的相互关注关系（用于回关/互关标识）
    const currentUser = await getCurrentUserFromRequest(request);
    let iFollowSet = new Set<string>();
    let followsMeSet = new Set<string>();
    if (currentUser && list.length > 0) {
      const names = list.map((r) => String(r.username));
      const ph = names.map(() => "?").join(",");
      const [a, b] = await Promise.all([
        db.prepare(
          `SELECT u.username FROM follows f JOIN users u ON u.id = f.author_id WHERE f.follower_id = ? AND u.username IN (${ph})`
        ).bind(currentUser.id, ...names).all(),
        db.prepare(
          `SELECT u.username FROM follows f JOIN users u ON u.id = f.follower_id WHERE f.author_id = ? AND u.username IN (${ph})`
        ).bind(currentUser.id, ...names).all(),
      ]);
      iFollowSet = new Set((a.results || []).map((r: any) => String(r.username)));
      followsMeSet = new Set((b.results || []).map((r: any) => String(r.username)));
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
    return json({ removed: true, followerCount: Number((countRow as any)?.c ?? 0) });
  } catch (error) {
    console.error("Remove follower error:", error);
    return json({ error: "Failed to remove follower" }, { status: 500 });
  }
}
