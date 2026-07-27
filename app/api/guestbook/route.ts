import { NextRequest } from "next/server";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { createNotification, notifyMentions } from "@/lib/notifications";
import type { GuestbookEntry } from "@/lib/types";
import { cacheHeaders, json, parsePositiveId, rateLimit, requireText } from "@/lib/security";
import { validateEmail } from "@/lib/utils";
import { getDb, parseJsonBody, requireLogin } from "../_shared";

export const runtime = "edge";

export async function GET() {
  try {
    const db = getDb();
    const results = await db.prepare(
      `SELECT guestbook.id, guestbook.name, guestbook.content, guestbook.created_at, guestbook.user_id, guestbook.reply_to,
              users.display_name AS user_display_name, users.username AS username, users.avatar AS user_avatar
       FROM guestbook
       LEFT JOIN users ON users.id = guestbook.user_id
       ORDER BY guestbook.created_at DESC
       LIMIT 50`
    ).all();
    return json({ entries: results.results }, { headers: cacheHeaders(30, 120) });
  } catch (error) {
    console.error("Get guestbook error:", error);
    return json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const replyTo = parsePositiveId(body.replyTo);
    const currentUser = await getCurrentUserFromRequest(request);

    const limited = rateLimit(request, { key: currentUser ? `guestbook:${currentUser.id}` : "guestbook", limit: 8, windowMs: 10 * 60 * 1000 });
    if (limited) return limited;

    const entryName = currentUser?.display_name || currentUser?.username || requireText(body.name, 40);
    const entryEmail = currentUser?.email || requireText(body.email, 254);
    const content = requireText(body.content, 1000);

    if (!entryName || !entryEmail || !content || !validateEmail(entryEmail)) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = getDb();
    const result = await db.prepare(
      "INSERT INTO guestbook (name, email, content, user_id, reply_to) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(entryName, entryEmail, content, currentUser?.id || null, replyTo || null).first<GuestbookEntry>();
    if (!result) {
      return json({ error: "Failed to save entry" }, { status: 500 });
    }

    // 1. 通知站主（新留言）
    const owner = await db.prepare("SELECT id FROM users WHERE role = 'owner' AND is_active = 1 LIMIT 1").first();
    if (owner) {
      await createNotification(db, {
        userId: Number(owner.id),
        type: "guestbook",
        actorId: currentUser?.id,
        actorName: entryName,
        targetType: "guestbook",
        targetId: Number(result.id),
        link: "/guestbook",
        content: `在留言板留下了新留言：${content.slice(0, 60)}`,
      });
    }
    // 2. 回复时通知被回复者
    if (replyTo) {
      const parent = await db.prepare("SELECT user_id FROM guestbook WHERE id = ?").bind(replyTo).first();
      if (parent?.user_id) {
        await createNotification(db, {
          userId: Number(parent.user_id),
          type: "reply",
          actorId: currentUser?.id,
          actorName: entryName,
          targetType: "guestbook",
          targetId: replyTo,
          link: "/guestbook",
          content: `回复了你的留言：${content.slice(0, 60)}`,
        });
      }
    }
    // 3. @提及通知
    await notifyMentions(db, content, { id: currentUser?.id, name: entryName }, "/guestbook");

    return json({ entry: result }, { status: 201 });
  } catch (error) {
    console.error("Create guestbook entry error:", error);
    return json({ error: "Failed to create entry" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireLogin(request);
    if (auth.error) return auth.error;
    const currentUser = auth.user;
    const { searchParams } = new URL(request.url);
    const id = parsePositiveId(searchParams.get("id"));
    if (!id) {
      return json({ error: "Invalid id" }, { status: 400 });
    }
    const db = getDb();
    const entry = await db.prepare("SELECT id, user_id FROM guestbook WHERE id = ?").bind(id).first();
    if (!entry) {
      return json({ error: "Entry not found" }, { status: 404 });
    }
    if (!hasPermission(currentUser, "guestbook:manage_all") && Number(entry.user_id) !== currentUser.id) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    await db.batch([
      db.prepare("DELETE FROM guestbook WHERE id = ? OR reply_to = ?").bind(id, id),
    ]);
    return json({ success: true });
  } catch (error) {
    console.error("Delete guestbook entry error:", error);
    return json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
