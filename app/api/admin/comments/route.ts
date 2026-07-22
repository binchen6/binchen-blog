import { NextRequest } from "next/server";
import { json, noStoreHeaders, parseBoundedInt, parsePositiveId } from "@/lib/security";
import { getDb, requireAdmin } from "../../_shared";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "comments:manage_all");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 100, 1, 200);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
    const db = getDb();
    const results = await db.prepare(
      `SELECT comments.*, posts.title AS post_title, posts.slug AS post_slug, users.username, users.display_name AS user_display_name
       FROM comments
       LEFT JOIN posts ON posts.id = comments.post_id
       LEFT JOIN users ON users.id = comments.user_id
       ORDER BY comments.created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return json({ comments: results.results }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Get admin comments error:", error);
    return json({ error: "Failed to fetch comments" }, { status: 500, headers: noStoreHeaders() });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "comments:manage_all");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const id = parsePositiveId(searchParams.get("id"));
    if (!id) {
      return json({ error: "Invalid id" }, { status: 400, headers: noStoreHeaders() });
    }

    const db = getDb();
    // 级联清理被删评论（含子回复）的点赞，避免孤儿数据
    await db.batch([
      db.prepare("DELETE FROM likes WHERE target_type = 'comment' AND (target_id = ? OR target_id IN (SELECT id FROM comments WHERE parent_id = ?))").bind(id, id),
      db.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(id, id),
    ]);
    return json({ success: true }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Delete admin comment error:", error);
    return json({ error: "Failed to delete comment" }, { status: 500, headers: noStoreHeaders() });
  }
}
