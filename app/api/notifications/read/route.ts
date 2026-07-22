import { NextRequest } from "next/server";
import { json, noStoreHeaders, parsePositiveId } from "@/lib/security";
import { getDb, parseJsonBody, requireLogin } from "../../_shared";

export const runtime = "edge";

/**
 * POST /api/notifications/read { id? , all?, type? }
 * 标记已读：单条 / 全部 / 某类型全部
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await requireLogin(request);
    if (auth.error) return auth.error;
    const currentUser = auth.user;

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const db = getDb();

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
