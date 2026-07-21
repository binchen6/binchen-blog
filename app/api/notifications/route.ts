import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { json, parseBoundedInt, parsePositiveId } from "@/lib/security";

export const runtime = "edge";

/**
 * GET /api/notifications — 我的消息列表 + 未读数
 * ?unread_announcement=1 时只返回未读公告（弹窗用）
 */
export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 30, 1, 100);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
    const unreadAnnouncement = searchParams.get("unread_announcement") === "1";

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    if (unreadAnnouncement) {
      const rows = await db.prepare(
        `SELECT id, content, created_at FROM notifications
         WHERE user_id = ? AND type = 'announcement' AND is_read = 0
         ORDER BY created_at DESC LIMIT 3`
      ).bind(currentUser.id).all();
      return json({ announcements: rows.results }, { headers: { "Cache-Control": "no-store" } });
    }

    const [rows, unreadRow] = await Promise.all([
      db.prepare(
        `SELECT id, type, actor_id, actor_name, target_type, target_id, link, content, is_read, created_at
         FROM notifications WHERE user_id = ?
         ORDER BY created_at DESC LIMIT ? OFFSET ?`
      ).bind(currentUser.id, limit, offset).all(),
      db.prepare("SELECT COUNT(*) AS c FROM notifications WHERE user_id = ? AND is_read = 0").bind(currentUser.id).first(),
    ]);

    return json(
      { notifications: rows.results, unreadCount: Number((unreadRow as any)?.c ?? 0) },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Get notifications error:", error);
    return json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

/**
 * POST /api/notifications/read { id? , all?, type? }
 * 标记已读：单条 / 全部 / 某类型全部
 */
export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as any;
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    if (body.all === true) {
      await db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").bind(currentUser.id).run();
    } else if (body.type === "announcement") {
      await db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ? AND type = 'announcement'").bind(currentUser.id).run();
    } else {
      const id = parsePositiveId(body.id);
      if (!id) {
        return json({ error: "Invalid id" }, { status: 400 });
      }
      await db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").bind(id, currentUser.id).run();
    }

    return json({ success: true });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return json({ error: "Failed to mark read" }, { status: 500 });
  }
}
