import { NextRequest } from "next/server";
import { ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth";
import { json, noStoreHeaders, parseBoundedInt } from "@/lib/security";
import { getDb, requireAdmin } from "../../_shared";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin(request, "users:manage");
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 100, 1, 200);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
    const db = getDb();
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
