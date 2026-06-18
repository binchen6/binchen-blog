import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { verifyToken } from "@/lib/auth";

export const runtime = "edge";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    let chunkString = "";
    for (let j = 0; j < chunk.length; j += 1) {
      chunkString += String.fromCharCode(chunk[j]);
    }
    binary += chunkString;
  }

  return btoa(binary);
}

function sanitizeName(name: string): string {
  const base = name
    .replace(/\.[^/.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);

  return base || "image";
}

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!MIME_TO_EXT[file.type]) {
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const env = ctx.env as any;
    const githubToken = env.GITHUB_TOKEN;
    const owner = env.GITHUB_OWNER;
    const repo = env.GITHUB_REPO;
    const branch = env.GITHUB_BRANCH || "main";
    const uploadDir = (env.GITHUB_UPLOAD_DIR || "uploads").replace(/^\/+|\/+$/g, "");

    if (!githubToken || !owner || !repo) {
      return NextResponse.json(
        { error: "GitHub image storage is not configured" },
        { status: 500 }
      );
    }

    const now = new Date();
    const datePath = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0"),
    ].join("/");
    const ext = MIME_TO_EXT[file.type];
    const randomId = crypto.randomUUID().slice(0, 8);
    const key = `${uploadDir}/${datePath}/${Date.now()}-${randomId}-${sanitizeName(file.name)}.${ext}`;
    const content = arrayBufferToBase64(await file.arrayBuffer());

    const githubRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(key)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "binchen-blog",
        },
        body: JSON.stringify({
          message: `upload image: ${key}`,
          content,
          branch,
          committer: {
            name: "binchen-blog",
            email: "noreply@binchen-blog.pages.dev",
          },
        }),
      }
    );

    if (!githubRes.ok) {
      const errorText = await githubRes.text();
      console.error("GitHub upload error:", githubRes.status, errorText);
      return NextResponse.json({ error: "GitHub upload failed" }, { status: 502 });
    }

    const publicUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${encodePath(key)}`;

    return NextResponse.json({ url: publicUrl, key });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
