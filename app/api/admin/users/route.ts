import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission, ROLE_LABELS, ROLE_PERMISSIONS } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 200);
    const offset = parseInt(searchParams.get("offset") || "0");
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare(
      `SELECT id, username, email, display_name, avatar, role, bio, is_active, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`
    ).bind(limit, offset).all();

    return NextResponse.json({
      users: results.results,
      groups: Object.entries(ROLE_PERMISSIONS).map(([name, permissions]) => ({
        name,
        label: ROLE_LABELS[name as keyof typeof ROLE_LABELS],
        permissions,
      })),
    });
  } catch (error) {
    console.error("Get admin users error:", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
