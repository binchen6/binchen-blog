import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { json, parsePositiveId, rateLimit, requireText } from "@/lib/security";
import { validateEmail } from "@/lib/utils";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { slug: string } }) {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const slug = params.slug;
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return json({ error: "Post not found" }, { status: 404 });
    }
    const results = await db.prepare(
      `SELECT comments.id, comments.post_id, comments.name, comments.content, comments.created_at, comments.user_id, comments.parent_id,
              users.display_name AS user_display_name, users.username AS username
       FROM comments
       LEFT JOIN users ON users.id = comments.user_id
       WHERE post_id = ?
       ORDER BY comments.created_at DESC`
    ).bind(post.id).all();
    return json({ comments: results.results });
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
    const post = await db.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
    if (!post) {
      return json({ error: "Post not found" }, { status: 404 });
    }
    const result = await db.prepare(
      "INSERT INTO comments (post_id, name, email, content, user_id, parent_id) VALUES (?, ?, ?, ?, ?, ?) RETURNING *"
    ).bind(post.id, commentName, commentEmail, content, currentUser?.id || null, parentId || null).first();
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
