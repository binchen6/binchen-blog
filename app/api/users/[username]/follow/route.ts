import { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { json, rateLimit } from "@/lib/security";
import { getDb } from "../../../_shared";

export const runtime = "edge";

/**
 * POST /api/users/[username]/follow — 关注/取关 toggle
 */
export async function POST(request: NextRequest, { params }: { params: { username: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "请先登录后再关注" }, { status: 401 });
    }
    const limited = rateLimit(request, { key: `follow:${currentUser.id}`, limit: 60, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const username = String(params.username || "").slice(0, 24);
    const db = getDb();

    const author = await db.prepare("SELECT id, username FROM users WHERE username = ? AND is_active = 1").bind(username).first();
    if (!author) {
      return json({ error: "User not found" }, { status: 404 });
    }
    if (Number(author.id) === currentUser.id) {
      return json({ error: "不能关注自己" }, { status: 400 });
    }

    const existing = await db.prepare(
      "SELECT id FROM follows WHERE follower_id = ? AND author_id = ?"
    ).bind(currentUser.id, author.id).first();

    let following: boolean;
    if (existing) {
      await db.prepare("DELETE FROM follows WHERE id = ?").bind(existing.id).run();
      following = false;
    } else {
      await db.prepare("INSERT INTO follows (follower_id, author_id) VALUES (?, ?)")
        .bind(currentUser.id, author.id).run();
      following = true;
      await createNotification(db, {
        userId: Number(author.id),
        type: "follow",
        actorId: currentUser.id,
        actorName: currentUser.display_name || currentUser.username,
        targetType: "user",
        targetId: currentUser.id,
        link: `/users/${encodeURIComponent(currentUser.username)}`,
        content: "关注了你",
      });
    }

    const countRow = await db.prepare("SELECT COUNT(*) AS c FROM follows WHERE author_id = ?").bind(author.id).first();
    return json({ following, followerCount: Number(countRow?.c ?? 0) });
  } catch (error) {
    console.error("Follow toggle error:", error);
    return json({ error: "Failed to toggle follow" }, { status: 500 });
  }
}
