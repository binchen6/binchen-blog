import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { getCurrentUserFromRequest, hasPermission } from "@/lib/auth";
import { getGithubImageConfig } from "@/lib/github-config";
import { json, parseBoundedInt, rateLimit } from "@/lib/security";

export const runtime = "edge";

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

const DEFAULT_MAX_UPLOAD_MB = 25;

function getMaxUploadBytes(env: any): number {
  const configuredMb = Number(env.MAX_UPLOAD_MB || DEFAULT_MAX_UPLOAD_MB);
  const safeMb = Number.isFinite(configuredMb) ? Math.min(Math.max(configuredMb, 1), 50) : DEFAULT_MAX_UPLOAD_MB;
  return safeMb * 1024 * 1024;
}

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

function hasValidImageSignature(type: string, bytes: Uint8Array): boolean {
  if (type === "image/png") return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/gif") return bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46;
  if (type === "image/webp") return bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50;
  return false;
}

export async function POST(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!hasPermission(currentUser, "images:upload")) {
      return json({ error: "Forbidden" }, { status: 403 });
    }
    const limited = rateLimit(request, { key: `upload:${currentUser.id}`, limit: 30, windowMs: 60 * 60 * 1000 });
    if (limited) return limited;

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!MIME_TO_EXT[file.type]) {
      return json({ error: "Invalid file type" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const env = ctx.env as any;
    const db = env.DB;
    const github = getGithubImageConfig(env);

    if (github.missing.length > 0) {
      return json(
        { error: `GitHub image storage is not configured. Missing: ${github.missing.join(", ")}` },
        { status: 500 }
      );
    }

    const maxUploadBytes = getMaxUploadBytes(env);
    if (file.size > maxUploadBytes) {
      return json(
        { error: `File too large. Maximum image size is ${Math.round(maxUploadBytes / 1024 / 1024)}MB.` },
        { status: 400 }
      );
    }
    const buffer = await file.arrayBuffer();
    if (!hasValidImageSignature(file.type, new Uint8Array(buffer.slice(0, 16)))) {
      return json({ error: "Invalid image content" }, { status: 400 });
    }

    const now = new Date();
    const datePath = [
      now.getUTCFullYear(),
      String(now.getUTCMonth() + 1).padStart(2, "0"),
      String(now.getUTCDate()).padStart(2, "0"),
    ].join("/");
    const ext = MIME_TO_EXT[file.type];
    const randomId = crypto.randomUUID().slice(0, 8);
    const key = `${github.uploadDir}/${datePath}/${Date.now()}-${randomId}-${sanitizeName(file.name)}.${ext}`;
    const content = arrayBufferToBase64(buffer);

    const githubRes = await fetch(
      `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${encodePath(key)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "binchen-blog",
        },
        body: JSON.stringify({
          message: `upload image: ${key}`,
          content,
          branch: github.branch,
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
      return json({ error: "GitHub upload failed" }, { status: 502 });
    }

    const githubData = await githubRes.json() as any;
    const image = await db.prepare(
      `INSERT INTO images (user_id, url, storage_key, filename, mime_type, size, sha)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`
    ).bind(currentUser.id, "", key, file.name, file.type, file.size, githubData?.content?.sha || null).first();
    const publicUrl = `/api/images/${image.id}`;
    const updatedImage = await db.prepare("UPDATE images SET url = ? WHERE id = ? RETURNING *").bind(publicUrl, image.id).first();

    return json({ url: publicUrl, key, image: updatedImage });
  } catch (error) {
    console.error("Upload error:", error);
    return json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseBoundedInt(searchParams.get("limit"), 50, 1, 100);
    const offset = parseBoundedInt(searchParams.get("offset"), 0, 0, 10000);
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

    return json({ images: results.results }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Get images error:", error);
    return json({ error: "Failed to fetch images" }, { status: 500 });
  }
}
