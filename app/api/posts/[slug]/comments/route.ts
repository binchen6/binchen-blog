import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { createNotification, notifyMentions } from "@/lib/notifications";
import { json, parsePositiveId, rateLimit, requireText } from "@/lib/security";
import { validateEmail } from "@/lib/utils";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const slug = params.slug;
    const currentUser = await getCurrentUserFromRequest(request);
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return json({ error: "Post not found" }, { status: 404 });
    }
    const results = await db.prepare(
      `SELECT comments.id, comments.post_id, comments.name, comments.content, comments.created_at, comments.user_id, comments.parent_id,
              users.display_name AS user_display_name, users.username AS username, users.avatar AS user_avatar,
              (SELECT COUNT(*) FROM likes WHERE target_type = 'comment' AND target_id = comments.id) AS like_count
       FROM comments
       LEFT JOIN users ON users.id = comments.user_id
       WHERE post_id = ?
       ORDER BY comments.created_at DESC`
    ).bind(post.id).all();

    // 当前用户已赞过的评论 id 列表
    let likedIds: number[] = [];
    if (currentUser) {
      const liked = await db.prepare(
        "SELECT target_id FROM likes WHERE user_id = ? AND target_type = 'comment'"
      ).bind(currentUser.id).all();
      likedIds = (liked.results || []).map((row: any) => Number(row.target_id));
    }

    return json({ comments: results.results, likedIds });
  } catch (error) {
    console.error("Get comments error:", error);
    return json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const body = await request.json() as any;
    const parentId = parsePositiveId(body.parentId);
    const currentUser = await getCurrentUserFromRequest(request);
    const limited = rateLimit(request, { key: currentUser ? `comment:${currentUser.id}` : "comment", limit: 12, windowMs: 10 * 60 * 1000 });
    if (limited) return limited;

    const commentName = currentUser?.display_name || currentUser?.username || requireText(body.name, 40);
    const commentEmail = currentUser?.email || requireText(body.email, 254);
    const content = requireText(body.content, 1000);
    if (!commentName || !commentEmail || !content || !validateEmail(commentEmail)) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const slug = params.slug;
    const post = await db.prepare("SELECT id, title, author_id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return json({ error: "Post not found" }, { status: 404 });
    }
    const result = await db.prepare(
      "INSERT INTO comments (post_id, name, email, content, user_id, parent_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(post.id, commentName, commentEmail, content, currentUser?.id || null, parentId || null).first();

    const postLink = `/blog/${slug}`;
    // 1. 通知文章作者（新评论）
    await createNotification(db, {
      userId: Number(post.author_id),
      type: "comment",
      actorId: currentUser?.id,
      actorName: commentName,
      targetType: "post",
      targetId: Number(post.id),
      link: postLink,
      content: `评论了你的文章《${String(post.title).slice(0, 50)}》：${content.slice(0, 60)}`,
    });
    // 2. 回复时通知被回复者
    if (parentId) {
      const parent = await db.prepare("SELECT user_id, name FROM comments WHERE id = ?").bind(parentId).first();
      if (parent?.user_id) {
        await createNotification(db, {
          userId: Number(parent.user_id),
          type: "reply",
          actorId: currentUser?.id,
          actorName: commentName,
          targetType: "comment",
          targetId: parentId,
          link: postLink,
          content: `回复了你的评论：${content.slice(0, 60)}`,
        });
      }
    }
    // 3. @提及通知
    await notifyMentions(db, content, { id: currentUser?.id, name: commentName }, postLink);

    return json({ comment: result }, { status: 201 });
  } catch (error) {
    console.error("Create comment error:", error);
    return json({ error: "Failed to create comment" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const id = parsePositiveId(searchParams.get("id"));
    if (!id) {
      return json({ error: "Invalid id" }, { status: 400 });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const comment = await db.prepare("SELECT id, user_id FROM comments WHERE id = ?").bind(id).first();
    if (!comment) {
      return json({ error: "Comment not found" }, { status: 404 });
    }
    if (!hasPermission(currentUser, "comments:manage_all") && Number(comment.user_id) !== currentUser.id) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    await db.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(id, id).run();
    return json({ success: true });
  } catch (error) {
    console.error("Delete comment error:", error);
    return json({ error: "Failed to delete comment" }, { status: 500 });
  }
}
