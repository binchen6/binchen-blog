import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function GET(request: NextRequest, { params }: { params: { key: string } }) {
  try {
    const ctx = getRequestContext();
    const bucket = ctx.env.BUCKET;
    const key = params.key;
    const object = await bucket.get(key);
    if (!object) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("cache-control", "public, max-age=31536000");
    return new NextResponse(object.body as any, { headers });
  } catch (error) {
    console.error("Get image error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
