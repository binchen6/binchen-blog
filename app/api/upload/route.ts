import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";

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
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(currentUser, "images:upload")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    const db = env.DB;
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

    const githubData = await githubRes.json() as any;
    const publicUrl = `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${branch}/${encodePath(key)}`;
    const image = await db.prepare(
      `INSERT INTO images (user_id, url, storage_key, filename, mime_type, size, sha)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(currentUser.id, publicUrl, key, file.name, file.type, file.size, githubData?.content?.sha || null).first();

    return NextResponse.json({ url: publicUrl, key, image });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const all = searchParams.get("all") === "1";

    const ctx = getRequestContext();
    const db = (ctx.env as any).DB;
    const canSeeAll = all && hasPermission(currentUser, "images:manage_all");
    const results = canSeeAll
      ? await db.prepare(
          "SELECT images.*, users.username, users.display_name FROM images LEFT JOIN users ON users.id = images.user_id ORDER BY images.created_at DESC LIMIT ? OFFSET ?"
        ).bind(limit, offset).all()
      : await db.prepare(
          "SELECT * FROM images WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?"
        ).bind(currentUser.id, limit, offset).all();

    return NextResponse.json({ images: results.results });
  } catch (error) {
    console.error("Get images error:", error);
    return NextResponse.json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
