import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth";
import { json, noStoreHeaders, parseBoundedInt } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 100, 1, 200);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare(
      `SELECT id, username, email, display_name, avatar, role, bio, is_active, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return json({
      users: results.results,
      groups: Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
        name,
        label: ROLE_LABELS[name as keyof typeof ROLE_LABELS],
        permissions,
      })),
    }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Get admin users error:", error);
    return json({ error: "Failed to fetch users" }, { status: 500, headers: noStoreHeaders() });
  }
}
