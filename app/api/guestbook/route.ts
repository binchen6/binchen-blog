import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { createNotification, notifyMentions } from "@/lib/notifications";
import { json, parsePositiveId, rateLimit, requireText } from "@/lib/security";
import { validateEmail } from "@/lib/utils";

export const runtime = "edge";

export async function GET() {
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare(
      `SELECT guestbook.id, guestbook.name, guestbook.content, guestbook.created_at, guestbook.user_id, guestbook.reply_to,
              users.display_name AS user_display_name, users.username AS username, users.avatar AS user_avatar
       FROM guestbook
       LEFT JOIN users ON users.id = guestbook.user_id
       ORDER BY guestbook.created_at DESC
       LIMIT 50`
    ).all();
    return json({ entries: results.results });
  } catch (error) {
    console.error("Get guestbook error:", error);
    return json({ error: "Failed to fetch entries" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as any;
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

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const result = await db.prepare(
      "INSERT INTO guestbook (name, email, content, user_id, reply_to) VALUES (?, ?, ?, ?, ?) RETURNING *"
    ).bind(entryName, entryEmail, content, currentUser?.id || null, replyTo || null).first();

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
    const entry = await db.prepare("SELECT id, user_id FROM guestbook WHERE id = ?").bind(id).first();
    if (!entry) {
      return json({ error: "Entry not found" }, { status: 404 });
    }
    if (!hasPermission(currentUser, "guestbook:manage_all") && Number(entry.user_id) !== currentUser.id) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    await db.prepare("DELETE FROM guestbook WHERE id = ? OR reply_to = ?").bind(id, id).run();
    return json({ success: true });
  } catch (error) {
    console.error("Delete guestbook entry error:", error);
    return json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
