import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { buildFeedXml, fetchFeedPosts } from "@/lib/feed";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const origin = new URL(request.url).origin;

  let xml: string;
  try {
    const db = (getRequestContext().env as any).DB;
    xml = buildFeedXml(await fetchFeedPosts(db), origin);
  } catch (error) {
    // D1 不可用时仍返回合法空 feed，而非 500
    console.error("RSS feed error:", error);
    xml = buildFeedXml([], origin);
  }

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
