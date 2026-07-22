import { NextRequest } from "next/server";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { createNotification } from "@/lib/notifications";
import { json, parsePositiveId, rateLimit } from "@/lib/security";
import { getDb, parseJsonBody } from "../_shared";

export const runtime = "edge";

/**
 * POST /api/likes { targetType: 'post'|'comment', targetId }
 * 点赞/取消点赞（toggle）。返回最新状态与计数。
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "请先登录后再点赞" }, { status: 401 });
    }
    const limited = rateLimit(request, { key: `like:${currentUser.id}`, limit: 120, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const targetType = String(body.targetType || "");
    const targetId = parsePositiveId(body.targetId);
    if (!["post", "comment"].includes(targetType) || !targetId) {
      return json({ error: "Invalid target" }, { status: 400 });
    }

    const db = getDb();

    // 确认目标存在并拿到归属（用于通知）
    let ownerId: number | null = null;
    let link = "";
    let preview = "";
    if (targetType === "post") {
      const post = await db.prepare("SELECT id, slug, title, author_id FROM posts WHERE id = ? AND status = 'published'").bind(targetId).first();
      if (!post) return json({ error: "Target not found" }, { status: 404 });
      ownerId = Number(post.author_id);
      link = `/blog/${post.slug}`;
      preview = String(post.title || "").slice(0, 60);
    } else {
      const comment = await db.prepare(
        "SELECT comments.id, comments.content, comments.user_id, posts.slug AS post_slug FROM comments JOIN posts ON posts.id = comments.post_id WHERE comments.id = ?"
      ).bind(targetId).first();
      if (!comment) return json({ error: "Target not found" }, { status: 404 });
      ownerId = comment.user_id !== null ? Number(comment.user_id) : null;
      link = `/blog/${comment.post_slug}`;
      preview = String(comment.content || "").slice(0, 60);
    }

    const existing = await db.prepare(
      "SELECT id FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?"
    ).bind(currentUser.id, targetType, targetId).first();

    let liked: boolean;
    if (existing) {
      await db.prepare("DELETE FROM likes WHERE id = ?").bind(existing.id).run();
      liked = false;
    } else {
      await db.prepare("INSERT INTO likes (user_id, target_type, target_id) VALUES (?, ?, ?)")
        .bind(currentUser.id, targetType, targetId).run();
      liked = true;

      // 点赞通知（不通知匿名目标/自己）
      if (ownerId) {
        await createNotification(db, {
          userId: ownerId,
          type: "like",
          actorId: currentUser.id,
          actorName: currentUser.display_name || currentUser.username,
          targetType,
          targetId,
          link,
          content: targetType === "post" ? `赞了你的文章《${preview}》` : `赞了你的评论：${preview}`,
        });
      }
    }

    const countRow = await db.prepare(
      "SELECT COUNT(*) AS c FROM likes WHERE target_type = ? AND target_id = ?"
    ).bind(targetType, targetId).first();

    return json({ liked, likeCount: Number((countRow as any)?.c ?? 0) });
  } catch (error) {
    console.error("Like toggle error:", error);
    return json({ error: "Failed to toggle like" }, { status: 500 });
  }
}
