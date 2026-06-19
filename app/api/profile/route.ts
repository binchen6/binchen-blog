import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, ROLE_LABELS, ROLE_PERMISSIONS, serializeUser } from "@/lib/auth";
import { validateEmail } from "@/lib/utils";
import { UserRole } from "@/lib/types";
import { clampText, isSafePublicUrl, json, rateLimit } from "@/lib/security";

export const runtime = "edge";

const USERNAME_RE = /^[a-zA-Z0-9_-]{3,24}$/;

function roleGroups() {
  return Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
    name,
    label: ROLE_LABELS[name as UserRole],
    permissions,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const pendingRequest = await db.prepare(
      `SELECT * FROM username_change_requests
       WHERE user_id = ? AND status = 'pending'
       ORDER BY created_at DESC
       LIMIT 1`
    ).bind(currentUser.id).first();

    return json({
      user: currentUser,
      groups: roleGroups(),
      pendingUsernameRequest: pendingRequest || null,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json() as any;
    const displayName = clampText(body.displayName, 40) || null;
    const email = clampText(body.email, 254).toLowerCase();
    const avatar = clampText(body.avatar, 2048) || null;
    const bio = clampText(body.bio, 240) || null;

    if (!email || !validateEmail(email)) {
      return json({ error: "Invalid email" }, { status: 400 });
    }
    if (!isSafePublicUrl(avatar)) {
      return json({ error: "Invalid avatar URL" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const duplicateEmail = await db.prepare("SELECT id FROM users WHERE email = ? AND id != ?").bind(email, currentUser.id).first();
    if (duplicateEmail) {
      return json({ error: "Email already exists" }, { status: 409 });
    }

    const updated = await db.prepare(
      `UPDATE users
       SET display_name = ?, email = ?, avatar = ?, bio = ?
       WHERE id = ?
       RETURNING id, username, email, display_name, avatar, role, bio, is_active, created_at`
    ).bind(displayName, email, avatar, bio, currentUser.id).first();

    return json({ user: serializeUser(updated) });
  } catch (error) {
    console.error("Update profile error:", error);
    return json({ error: "Failed to update profile" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    const limited = rateLimit(request, { key: `username-request:${currentUser.id}`, limit: 3, windowMs: 24 * 60 * 60 * 1000 });
    if (limited) return limited;

    const body = await request.json() as any;
    const requestedUsername = clampText(body.requestedUsername, 24);
    if (!USERNAME_RE.test(requestedUsername)) {
      return json({ error: "Username must be 3-24 letters, numbers, underscores or hyphens" }, { status: 400 });
    }
    if (requestedUsername === currentUser.username) {
      return json({ error: "New username must be different" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const [existingUser, pending] = await Promise.all([
      db.prepare("SELECT id FROM users WHERE username = ?").bind(requestedUsername).first(),
      db.prepare("SELECT id FROM username_change_requests WHERE user_id = ? AND status = 'pending'").bind(currentUser.id).first(),
    ]);
    if (existingUser) {
      return json({ error: "Username already exists" }, { status: 409 });
    }
    if (pending) {
      return json({ error: "You already have a pending username request" }, { status: 409 });
    }

    const requestRow = await db.prepare(
      `INSERT INTO username_change_requests (user_id, current_username, requested_username)
       VALUES (?, ?, ?)
       RETURNING *`
    ).bind(currentUser.id, currentUser.username, requestedUsername).first();

    return json({ request: requestRow }, { status: 201 });
  } catch (error) {
    console.error("Create username request error:", error);
    return json({ error: "Failed to submit username request" }, { status: 500 });
  }
}
