import { NextRequest } from "next/server";
import { json, noStoreHeaders, parseBoundedInt, parsePositiveId } from "@/lib/security";
import { getDb, requireLogin } from "../_shared";

export const runtime = "edge";

/**
 * GET /api/notifications — 我的消息列表（最多返回 30 条）+ 未读数
 * ?unread_announcement=1 时只返回未读公告（弹窗用）
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await requireLogin(request);
    if (auth.error) return auth.error;
    const currentUser = auth.user;

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 30, 1, 30);
    const unreadAnnouncement = searchParams.get("unread_announcement") === "1";

    const db = getDb();

    if (unreadAnnouncement) {
      const rows = await db.prepare(
        `SELECT id, content, created_at FROM notifications
         WHERE user_id = ? AND type = 'announcement' AND is_read = 0
         ORDER BY created_at DESC LIMIT 3`
      ).bind(currentUser.id).all();
      return json({ announcements: rows.results }, { headers: noStoreHeaders() });
    }

    const [rows, unreadRow] = await Promise.all([
      db.prepare(
        `SELECT id, type, actor_id, actor_name, target_type, target_id, link, content, is_read, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC LIMIT ?`
      ).bind(currentUser.id, limit).all(),
      db.prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0").bind(currentUser.id).first(),
    ]);

    return json(
      { notifications: rows.results, unreadCount: Number(unreadRow?.c ?? 0) },
      { headers: noStoreHeaders() }
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * DELETE /api/notifications?id= / ?ids=1,2,3 / ?all=1
 * 删除消息：单条 / 多条 / 全部（仅本人的）
 */
export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireLogin(request);
    if (auth.error) return auth.error;
    const currentUser = auth.user;

    const { searchParams } = new URL(request.url);
    const db = getDb();

    if (searchParams.get("all") === "1") {
      await db.prepare("DELETE FROM notifications WHERE user_id = ?").bind(currentUser.id).run();
      return json({ success: true });
    }

    const idsParam = searchParams.get("ids");
    if (idsParam) {
      const ids = idsParam.split(",").map(parsePositiveId).filter((id): id is number => id !== null).slice(0, 30);
      if (ids.length === 0) {
        return json({ error: "Invalid ids" }, { status: 400 });
      }
      const placeholders = ids.map(() => "?").join(",");
      await db.prepare(
        `DELETE FROM notifications WHERE user_id = ? AND id IN (${placeholders})`
      ).bind(currentUser.id, ...ids).run();
      return json({ success: true, deleted: ids.length });
    }

    const id = parsePositiveId(searchParams.get("id"));
    if (!id) {
      return json({ error: "Invalid id" }, { status: 400 });
    }
    await db.prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?").bind(id, currentUser.id).run();
    return json({ success: true });
  } catch (error) {
    console.error("Delete notification error:", error);
    return json({ error: "Failed to delete notification" }, { status: 500 });
  }
}
