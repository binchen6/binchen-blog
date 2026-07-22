import { NextRequest } from "next/server";
import { UserRole } from "@/lib/types";
import { json, noStoreHeaders, parsePositiveId } from "@/lib/security";
import { getDb, parseJsonBody, requireAdmin } from "../../../_shared";

export const runtime = "edge";

const ROLES: UserRole[] = ["owner", "admin", "editor", "author", "member"];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin(request, "users:manage");
    if (auth.error) return auth.error;
    const currentUser = auth.user;
    const targetId = parsePositiveId(params.id);
    if (!targetId) {
      return json({ error: "Invalid user id" }, { status: 400, headers: noStoreHeaders() });
    }

    const body = await parseJsonBody(request);
    if (!body) {
      return json({ error: "Invalid JSON body" }, { status: 400, headers: noStoreHeaders() });
    }
    const db = getDb();
    const target = await db.prepare("SELECT id, username, role, is_active FROM users WHERE id = ?").bind(targetId).first();
    if (!target) {
      return json({ error: "User not found" }, { status: 404, headers: noStoreHeaders() });
    }

    const nextRole = (body.role || target.role || "author") as UserRole;
    const isActive = body.isActive === undefined ? Number(target.is_active ?? 1) : (body.isActive ? 1 : 0);

    if (!ROLES.includes(nextRole)) {
      return json({ error: "Invalid role" }, { status: 400, headers: noStoreHeaders() });
    }
    if (target.role === "owner" && (nextRole !== "owner" || isActive !== 1)) {
      const otherOwner = await db.prepare(
        "SELECT id FROM users WHERE role = 'owner' AND is_active = 1 AND id != ? LIMIT 1"
      ).bind(targetId).first();
      if (!otherOwner) {
        return json({ error: "At least one active owner account is required" }, { status: 400, headers: noStoreHeaders() });
      }
    }
    if (nextRole === "owner" && currentUser.role !== "owner") {
      return json({ error: "Only owners can grant owner role" }, { status: 403, headers: noStoreHeaders() });
    }

    const user = await db.prepare(
      `UPDATE users
       SET role = ?, is_active = ?
       WHERE id = ?
       RETURNING id, username, email, display_name, avatar, role, bio, is_active, created_at`
    ).bind(nextRole, isActive, targetId).first();

    return json({ user }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Update admin user error:", error);
    return json({ error: "Failed to update user" }, { status: 500, headers: noStoreHeaders() });
  }
}
