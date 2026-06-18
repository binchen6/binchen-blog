import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const bucket = (ctx.env as any).BUCKET;

    const key = `uploads/${Date.now()}-${file.name}`;
    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    const publicUrl = `${(ctx.env as any).NEXT_PUBLIC_SITE_URL || ""}/api/upload/${key}`;

    return NextResponse.json({ url: publicUrl, key });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
