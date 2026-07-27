import { NextRequest } from "next/server";
import { broadcastAnnouncement } from "@/lib/notifications";
import { cacheHeaders, json, noStoreHeaders, parsePositiveId, requireText } from "@/lib/security";
import { getDb, parseJsonBody, requireAdmin } from "../_shared";

export const runtime = "edge";

/** GET /api/announcements — 最新公告（公开，访客横幅用）；?all=1 管理员看历史 */
export async function GET(request: NextRequest) {
  try {
    const db = getDb();

    const { searchParams } = new URL(request.url);
    if (searchParams.get("all") === "1") {
      const auth = await requireAdmin(request, "admin:access");
      if (auth.error) return auth.error;
      const rows = await db.prepare(
        `SELECT announcements.id, announcements.title, announcements.content, announcements.created_at,
                users.display_name AS created_by_name, users.username AS created_by_username
         FROM announcements LEFT JOIN users ON users.id = announcements.created_by
         ORDER BY announcements.created_at DESC LIMIT 50`
      ).all();
      return json({ announcements: rows.results }, { headers: noStoreHeaders() });
    }

    const row = await db.prepare(
      "SELECT id, title, content, created_at FROM announcements ORDER BY created_at DESC LIMIT 1"
    ).first();
    return json({ announcement: row || null }, { headers: cacheHeaders(60, 300) });
  } catch (error) {
    console.error("Get announcement error:", error);
    return json({ error: "Failed to fetch announcement" }, { status: 500 });
  }
}

/** POST /api/announcements — 管理员发布公告（广播通知所有用户） */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "admin:access");
    if (auth.error) return auth.error;
    const currentUser = auth.user;

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const title = requireText(body.title, 80);
    const content = requireText(body.content, 2000);
    if (!title || !content) {
      return json({ error: "Title and content are required" }, { status: 400 });
    }

    const db = getDb();
    const announcement = await db.prepare(
      "INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?) RETURNING *"
    ).bind(title, content, currentUser.id).first<{ id: number }>();
    if (!announcement) {
      return json({ error: "Failed to create announcement" }, { status: 500 });
    }

    const notified = await broadcastAnnouncement(db, { id: Number(announcement.id), title, content });

    return json({ announcement, notified }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return json({ error: "Failed to create announcement" }, { status: 500 });
  }
}

/** DELETE /api/announcements?id= — 管理员删除公告（历史公告与对应通知一并移除） */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "admin:access");
    if (auth.error) return auth.error;

    const id = parsePositiveId(new URL(request.url).searchParams.get("id"));
    if (!id) {
      return json({ error: "Invalid id" }, { status: 400 });
    }
    const db = getDb();
    await db.batch([
      db.prepare("DELETE FROM announcements WHERE id = ?").bind(id),
      db.prepare("DELETE FROM notifications WHERE type = 'announcement' AND target_id = ?").bind(id),
    ]);
    return json({ success: true });
  } catch (error) {
    console.error("Delete announcement error:", error);
    return json({ error: "Failed to delete announcement" }, { status: 500 });
  }
}
