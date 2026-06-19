import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";

export const runtime = "edge";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as any;
    const action = String(body.action || "");
    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const requestRow = await db.prepare("SELECT * FROM username_change_requests WHERE id = ?").bind(params.id).first();
    if (!requestRow) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (requestRow.status !== "pending") {
      return NextResponse.json({ error: "Request has already been reviewed" }, { status: 409 });
    }

    if (action === "approve") {
      const existingUser = await db.prepare("SELECT id FROM users WHERE username = ? AND id != ?").bind(requestRow.requested_username, requestRow.user_id).first();
      if (existingUser) {
        return NextResponse.json({ error: "Username already exists" }, { status: 409 });
      }
      await db.batch([
        db.prepare("UPDATE users SET username = ? WHERE id = ?").bind(requestRow.requested_username, requestRow.user_id),
        db.prepare(
          "UPDATE username_change_requests SET status = 'approved', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
        ).bind(currentUser.id, new Date().toISOString(), params.id),
      ]);
    } else {
      await db.prepare(
        "UPDATE username_change_requests SET status = 'rejected', reviewed_by = ?, reviewed_at = ? WHERE id = ?"
      ).bind(currentUser.id, new Date().toISOString(), params.id).run();
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Review username request error:", error);
    return NextResponse.json({ error: "Failed to review username request" }, { status: 500 });
  }
}
