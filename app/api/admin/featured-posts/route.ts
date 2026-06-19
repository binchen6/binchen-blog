import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest } from "@/lib/auth";
import { json, noStoreHeaders, parseBoundedInt } from "@/lib/security";

export const runtime = "edge";

export async function PATCH(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canAccessAdmin(currentUser)) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const body = await request.json() as any;
    const slug = String(body.slug || "").trim();
    const isFeatured = Boolean(body.isFeatured);
    const featuredRank = parseBoundedInt(body.featuredRank, 0, 0, 999);

    if (!slug) {
      return json({ error: "Missing post slug" }, { status: 400, headers: noStoreHeaders() });
    }

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const post = await db.prepare("SELECT id, status FROM posts WHERE slug = ?").bind(slug).first();

    if (!post) {
      return json({ error: "Post not found" }, { status: 404, headers: noStoreHeaders() });
    }
    if (isFeatured && post.status !== "published") {
      return json({ error: "Only published posts can be featured" }, { status: 400, headers: noStoreHeaders() });
    }

    const updated = await db.prepare(
      `UPDATE posts
       SET is_featured = ?, featured_rank = ?
       WHERE slug = ?
       RETURNING id, title, slug, status, mode, is_featured, featured_rank, created_at, published_at`
    ).bind(isFeatured ? 1 : 0, isFeatured ? featuredRank : 0, slug).first();

    return json({ post: updated }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("Update featured post error:", error);
    return json({ error: "Failed to update featured post" }, { status: 500, headers: noStoreHeaders() });
  }
}
