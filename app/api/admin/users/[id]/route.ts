import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission, OWNER_USERNAME } from "@/lib/auth";
import { UserRole } from "@/lib/types";

export const runtime = "edge";

const ROLES: UserRole[] = ["owner", "admin", "editor", "author", "member"];

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !hasPermission(currentUser, "users:manage")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json() as any;
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const target = await db.prepare("SELECT id, username, role, is_active FROM users WHERE id = ?").bind(params.id).first();
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const nextRole = (body.role || target.role || "author") as UserRole;
    const isActive = body.isActive === undefined ? Number(target.is_active ?? 1) : (body.isActive ? 1 : 0);

    if (!ROLES.includes(nextRole)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    if (target.username === OWNER_USERNAME && (nextRole !== "owner" || isActive !== 1)) {
      return NextResponse.json({ error: "Owner account cannot be downgraded or disabled" }, { status: 400 });
    }
    if (nextRole === "owner" && target.username !== OWNER_USERNAME) {
      return NextResponse.json({ error: "Only the site owner username can use owner role" }, { status: 400 });
    }

    const user = await db.prepare(
      `UPDATE users
       SET role = ?, is_active = ?
       WHERE id = ?
       RETURNING id, username, email, display_name, avatar, role, bio, is_active, created_at`
    ).bind(nextRole, isActive, params.id).first();

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Update admin user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}
