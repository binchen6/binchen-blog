import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { json, noStoreHeaders, parsePositiveId } from "@/lib/security";

export const runtime = "edge";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }
    const requestId = parsePositiveId(params.id);
    if (!requestId) {
      return json({ error: "Invalid request id" }, { status: 400, headers: noStoreHeaders() });
    }

    const body = await request.json() as any;
    const action = String(body.action || "");
    if (!["approve", "reject"].includes(action)) {
      return json({ error: "Invalid action" }, { status: 400, headers: noStoreHeaders() });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const requestRow = await db.prepare("SELECT * FROM username_change_requests WHERE id = ?").bind(requestId).first();
    if (!requestRow) {
      return json({ error: "Request not found" }, { status: 404, headers: noStoreHeaders() });
    }
    if (requestRow.status !== "pending") {
      return json({ error: "Request has already been reviewed" }, { status: 409, headers: noStoreHeaders() });
    }

    if (action === "approve") {
      const existingUser = await db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").bind(requestRow.requested_username, requestRow.user_id).first();
      if (existingUser) {
        return json({ error: "Username already exists" }, { status: 409, headers: noStoreHeaders() });
      }
      await db.batch([
        db.prepare("UPDATE users SET username = ? WHERE id = ?").bind(requestRow.requested_username, requestRow.user_id),
        db.prepare(
          "UPDATE username_change_requests SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
        ).bind(currentUser.id, new Date().toISOString(), requestId),
      ]);
    } else {
      await db.prepare(
        "UPDATE username_change_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
      ).bind(currentUser.id, new Date().toISOString(), requestId).run();
    }

    return json({ success: true }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Review username request error:", error);
    return json({ error: "Failed to review username request" }, { status: 500, headers: noStoreHeaders() });
  }
}
