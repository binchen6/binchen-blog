import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest } from "@/lib/auth";
import { broadcastAnnouncement } from "@/lib/notifications";
import { cacheHeaders, json, requireText } from "@/lib/security";

export const runtime = "edge";

/** GET /api/announcements — 最新公告（公开，访客横幅用）；?all=1 管理员看历史 */
export async function GET(request: NextRequest) {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;

    const { searchParams } = new URL(request.url);
    if (searchParams.get("all") === "1") {
      const currentUser = await getCurrentUserFromRequest(request);
      if (!currentUser || !canAccessAdmin(currentUser)) {
        return json({ error: "Forbidden" }, { status: 403 });
      }
      const rows = await db.prepare(
        `SELECT announcements.id, announcements.title, announcements.content, announcements.created_at,
                users.display_name AS created_by_name, users.username AS created_by_username
         FROM announcements LEFT JOIN users ON users.id = announcements.created_by
         ORDER BY announcements.created_at DESC LIMIT 50`
      ).all();
      return json({ announcements: rows.results }, { headers: { "Cache-Control": "no-store" } });
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
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canAccessAdmin(currentUser)) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    const body = (await request.json()) as any;
    const title = requireText(body.title, 80);
    const content = requireText(body.content, 2000);
    if (!title || !content) {
      return json({ error: "Title and content are required" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const announcement = await db.prepare(
      "INSERT INTO announcements (title, content, created_by) VALUES (?, ?, ?) RETURNING *"
    ).bind(title, content, currentUser.id).first();

    const notified = await broadcastAnnouncement(db, { id: Number(announcement.id), title, content });

    return json({ announcement, notified }, { status: 201 });
  } catch (error) {
    console.error("Create announcement error:", error);
    return json({ error: "Failed to create announcement" }, { status: 500 });
  }
}
