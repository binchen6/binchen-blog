import { NextRequest } from "next/server";
import { serializeUser } from "@/lib/auth";
import { clampText, isSafePublicUrl, json, rateLimit } from "@/lib/security";
import { getDb, parseJsonBody, requireLogin } from "../../_shared";

export const runtime = "edge";

const MAX_HISTORY = 3;

/**
 * PUT /api/profile/avatar
 * 更新头像：旧头像压入历史（最多保留 3 次），新头像设为当前。
 * 恢复历史头像也走这个接口（传入历史 URL 即可）。
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireLogin(request);
    if (auth.error) return auth.error;
    const currentUser = auth.user;
    const limited = rateLimit(request, { key: `avatar:${currentUser.id}`, limit: 20, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400 });
    }
    const newAvatar = clampText(body.url, 2048);
    if (!newAvatar || !isSafePublicUrl(newAvatar)) {
      return json({ error: "Invalid avatar URL" }, { status: 400 });
    }
    if (newAvatar === currentUser.avatar) {
      return json({ error: "Avatar unchanged" }, { status: 400 });
    }

    const db = getDb();

    // 读取现有历史
    const row = await db.prepare("SELECT avatar, avatar_history FROM users WHERE id = ?").bind(currentUser.id).first();
    if (!row) {
      return json({ error: "User not found" }, { status: 404 });
    }

    let history: string[] = [];
    try {
      history = row.avatar_history ? JSON.parse(row.avatar_history as string) : [];
      if (!Array.isArray(history)) history = [];
    } catch {
      history = [];
    }

    // 旧头像压入历史头部，去重，截断到 3 个
    const previous = String(row.avatar || "");
    const nextHistory = [previous, ...history.filter((url) => url !== previous && url !== newAvatar)]
      .filter(Boolean)
      .slice(0, MAX_HISTORY);

    const updated = await db.prepare(
      `UPDATE users SET avatar = ?, avatar_history = ? WHERE id = ?
       RETURNING id, username, email, display_name, avatar, avatar_history, role, bio, is_active, created_at`
    ).bind(newAvatar, JSON.stringify(nextHistory), currentUser.id).first();

    return json({ user: serializeUser(updated), avatarHistory: nextHistory });
  } catch (error) {
    console.error("Update avatar error:", error);
    return json({ error: "Failed to update avatar" }, { status: 500 });
  }
}
