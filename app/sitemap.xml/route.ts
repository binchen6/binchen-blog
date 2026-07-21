import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  const staticPages = [
    { path: "/", priority: "1.0", changefreq: "weekly" },
    { path: "/blog", priority: "0.9", changefreq: "daily" },
    { path: "/guestbook", priority: "0.6", changefreq: "weekly" },
  ];

  let postUrls = "";
  try {
    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const results = await db
      .prepare(
        "SELECT slug, updated_at, published_at, created_at FROM posts WHERE status = 'published' ORDER BY COALESCE(published_at, created_at) DESC LIMIT 500"
      )
      .all();

    postUrls = (results.results as any[])
      .map((post) => {
        const lastmod = new Date(post.updated_at || post.published_at || post.created_at).toISOString().slice(0, 10);
        return `  <url>
    <loc>${origin}/blog/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join("\n");
  } catch (error) {
    console.error("Sitemap error:", error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages
  .map(
    (page) => `  <url>
    <loc>${origin}${page.path}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
${postUrls}
</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=600, stale-while-revalidate=1200",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
