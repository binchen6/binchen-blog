import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest } from "@/lib/auth";
import { json, parsePositiveId } from "@/lib/security";

export const runtime = "edge";

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
