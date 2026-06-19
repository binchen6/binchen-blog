import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canAccessAdmin(currentUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const [users, posts, comments, guestbook, images] = await Promise.all([
      db.prepare("SELECT COUNT(*) AS count FROM users").first(),
      db.prepare("SELECT COUNT(*) AS count FROM posts").first(),
      db.prepare("SELECT COUNT(*) AS count FROM comments").first(),
      db.prepare("SELECT COUNT(*) AS count FROM guestbook").first(),
      db.prepare("SELECT COUNT(*) AS count FROM images").first(),
    ]);

    return NextResponse.json({
      stats: {
        users: Number(users?.count || 0),
        posts: Number(posts?.count || 0),
        comments: Number(comments?.count || 0),
        guestbook: Number(guestbook?.count || 0),
        images: Number(images?.count || 0),
      },
    });
  } catch (error) {
    console.error("Get admin stats error:", error);
    return NextResponse.json({ error: "Failed to fetch admin stats" }, { status: 500 });
  }
}
