import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { json, noStoreHeaders, parseBoundedInt, parsePositiveId } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "comments:manage_all")) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 100, 1, 200);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
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
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "comments:manage_all")) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const id = parsePositiveId(searchParams.get("id"));
    if (!id) {
      return json({ error: "Invalid id" }, { status: 400, headers: noStoreHeaders() });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    await db.prepare("DELETE FROM comments WHERE id = ? OR parent_id = ?").bind(id, id).run();
    return json({ success: true }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Delete admin comment error:", error);
    return json({ error: "Failed to delete comment" }, { status: 500, headers: noStoreHeaders() });
  }
}
