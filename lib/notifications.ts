/**
 * 统一消息系统：通知创建 + @提及解析。
 * 所有提醒（点赞/回复/评论/关注/提及/公告）都汇入 notifications 表。
 */

export type NotificationType = "mention" | "reply" | "comment" | "guestbook" | "like" | "follow" | "announcement";

export interface NotificationInput {
  userId: number;          // 接收者
  type: NotificationType;
  actorId?: number | null; // 触发者（注册用户）
  actorName?: string;      // 触发者显示名（含匿名）
  targetType?: string;
  targetId?: number;
  link?: string;
  content?: string;
}

/** 创建通知；接收者=触发者时静默跳过 */
export async function createNotification(db: any, input: NotificationInput): Promise<void> {
  if (input.actorId && Number(input.userId) === Number(input.actorId)) return;
  await db.prepare(
    `INSERT INTO notifications (user_id, type, actor_id, actor_name, target_type, target_id, link, content)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    input.userId,
    input.type,
    input.actorId ?? null,
    (input.actorName || "有人").slice(0, 40),
    input.targetType ?? null,
    input.targetId ?? null,
    (input.link || "").slice(0, 500),
    (input.content || "").slice(0, 300)
  ).run();
}

const MENTION_RE = /@([a-zA-Z0-9_-]{3,24})/g;

/**
 * 解析内容中的 @用户名，给存在的用户发 mention 通知（去重、排除触发者本人）。
 */
export async function notifyMentions(
  db: any,
  content: string,
  from: { id?: number | null; name: string },
  link: string
): Promise<void> {
  const usernames = Array.from(new Set(
    Array.from(content.matchAll(MENTION_RE)).map((m) => m[1])
  )).slice(0, 5);
  if (usernames.length === 0) return;

  const placeholders = usernames.map(() => "?").join(",");
  const rows = await db.prepare(
    `SELECT id, username FROM users WHERE username IN (${placeholders}) AND is_active = 1`
  ).bind(...usernames).all();

  for (const user of rows.results || []) {
    await createNotification(db, {
      userId: Number(user.id),
      type: "mention",
      actorId: from.id,
      actorName: from.name,
      link,
      content: content.slice(0, 120),
    });
  }
}

/** 公告广播：给所有活跃用户发 announcement 通知 */
export async function broadcastAnnouncement(db: any, announcement: { id: number; title: string; content: string }): Promise<number> {
  const users = await db.prepare("SELECT id FROM users WHERE is_active = 1").all();
  let count = 0;
  for (const user of users.results || []) {
    await db.prepare(
      `INSERT INTO notifications (user_id, type, actor_name, target_type, target_id, link, content)
       VALUES (?, 'announcement', '公告', 'announcement', ?, '', ?)`
    ).bind(Number(user.id), announcement.id, `${announcement.title}\n${announcement.content}`.slice(0, 300)).run();
    count += 1;
  }
  return count;
}
