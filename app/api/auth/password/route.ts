import { NextRequest } from "next/server";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { json, rateLimit } from "@/lib/security";
import { getDb, parseJsonBody, requireLogin } from "../../_shared";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const auth = await requireLogin(request);
    if (auth.error) return auth.error;
    const currentUser = auth.user;
    const limited = rateLimit(request, { key: `password:${currentUser.id}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid request body" }, { status: 400 });
    }
    const currentPassword = String(body.currentPassword || "");
    const newPassword = String(body.newPassword || "");

    if (!currentPassword || !newPassword) {
      return json({ error: "Missing required fields" }, { status: 400 });
    }
    if (newPassword.length < 8 || newPassword.length > 128) {
      return json({ error: "New password must be 8-128 characters" }, { status: 400 });
    }
    if (newPassword === currentPassword) {
      return json({ error: "New password must be different" }, { status: 400 });
    }

    const db = getDb();
    const user = await db.prepare("SELECT password_hash FROM users WHERE id = ?").bind(currentUser.id).first();
    if (!user) {
      return json({ error: "User not found" }, { status: 404 });
    }

    const valid = await verifyPassword(currentPassword, user.password_hash as string);
    if (!valid) {
      return json({ error: "Current password is incorrect" }, { status: 403 });
    }

    const newHash = await hashPassword(newPassword);
    await db.prepare("UPDATE users SET password_hash = ? WHERE id = ?").bind(newHash, currentUser.id).run();

    return json({ success: true });
  } catch (error) {
    console.error("Change password error:", error);
    return json({ error: "Failed to change password" }, { status: 500 });
  }
}
