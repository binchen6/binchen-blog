import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;
  let items = "";

  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db
      .prepare(
        "SELECT title, slug, excerpt, published_at, created_at FROM posts WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 50"
      )
      .all();

    items = (results.results as any[])
      .map((post) => {
        const date = new Date(post.published_at || post.created_at).toUTCString();
        return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${origin}/blog/${escapeXml(post.slug)}</link>
      <guid isPermaLink="true">${origin}/blog/${escapeXml(post.slug)}</guid>
      <pubDate>${date}</pubDate>
      <description>${escapeXml(post.excerpt || "")}</description>
    </item>`;
      })
      .join("\n");
  } catch (error) {
    console.error("RSS feed error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>尘墨 | binchen</title>
    <link>${origin}</link>
    <description>喜欢自由与宁静地生活旅行者 —— 记录山海、片刻安宁与古今技术。</description>
    <language>zh-CN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
