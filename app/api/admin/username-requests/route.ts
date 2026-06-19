import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { json, noStoreHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "pending";
    if (!["pending", "approved", "rejected"].includes(status)) {
      return json({ error: "Invalid status" }, { status: 400, headers: noStoreHeaders() });
    }
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db.prepare(
      `SELECT username_change_requests.*, users.email, users.display_name
       FROM username_change_requests
       LEFT JOIN users ON users.id = username_change_requests.user_id
       WHERE username_change_requests.status = ?
       ORDER BY username_change_requests.created_at DESC
       LIMIT 100`
    ).bind(status).all();

    return json({ requests: results.results }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Get username requests error:", error);
    return json({ error: "Failed to fetch username requests" }, { status: 500, headers: noStoreHeaders() });
  }
}
