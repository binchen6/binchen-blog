import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canManageImage, getCurrentUserFromRequest } from "@/lib/auth";
import { getGithubImageConfig } from "@/lib/github-config";
import { json, parsePositiveId, securityHeaders } from "@/lib/security";

export const runtime = "edge";

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const imageId = parsePositiveId(params.id);
    if (!imageId) {
      return json({ error: "Invalid image id" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const env = ctx.env as any;
    const db = env.DB;
    const image = await db.prepare("SELECT * FROM images WHERE id = ?").bind(imageId).first();
    if (!image) {
      return json({ error: "Image not found" }, { status: 404 });
    }
    const github = getGithubImageConfig(env);
    if (github.missing.length > 0) {
      return json(
        { error: `GitHub image storage is not configured. Missing: ${github.missing.join(", ")}` },
        { status: 500 }
      );
    }

    const githubRes = await fetch(
      `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${encodePath(image.storage_key)}?ref=${encodeURIComponent(github.branch)}`,
      {
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "binchen-blog",
        },
      }
    );

    if (!githubRes.ok) {
      return json({ error: "Image not found" }, { status: githubRes.status === 404 ? 404 : 502 });
    }

    const githubData = await githubRes.json() as any;
    if (!githubData?.content || githubData.encoding !== "base64") {
      return json({ error: "Invalid image content" }, { status: 502 });
    }

    const bytes = base64ToBytes(githubData.content);
    const body = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(body).set(bytes);
    return new Response(body, {
      headers: {
        ...securityHeaders(),
        "Content-Type": image.mime_type || "application/octet-stream",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "Content-Length": String(bytes.byteLength),
      },
    });
  } catch (error) {
    console.error("Get proxied image error:", error);
    return json({ error: "Failed to fetch image" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }
    const imageId = parsePositiveId(params.id);
    if (!imageId) {
      return json({ error: "Invalid image id" }, { status: 400 });
    }

    const ctx = getRequestContext();
    const env = ctx.env as any;
    const db = env.DB;
    const image = await db.prepare("SELECT * FROM images WHERE id = ?").bind(imageId).first();
    if (!image) {
      return json({ error: "Image not found" }, { status: 404 });
    }
    if (!canManageImage(currentUser, Number(image.user_id))) {
      return json({ error: "Forbidden" }, { status: 403 });
    }

    const github = getGithubImageConfig(env);
    if (image.sha && github.missing.length === 0) {
      const githubRes = await fetch(
        `https://api.github.com/repos/${github.owner}/${github.repo}/contents/${encodePath(image.storage_key)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${github.token}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "binchen-blog",
          },
          body: JSON.stringify({
            message: `delete image: ${image.storage_key}`,
            sha: image.sha,
            branch: github.branch,
            committer: {
              name: "binchen-blog",
              email: "noreply@binchen-blog.pages.dev",
            },
          }),
        }
      );

      if (!githubRes.ok && githubRes.status !== 404) {
        const errorText = await githubRes.text();
        console.error("GitHub delete error:", githubRes.status, errorText);
        return json({ error: "GitHub delete failed" }, { status: 502 });
      }
    }

    await db.prepare("DELETE FROM images WHERE id = ?").bind(imageId).run();
    return json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    return json({ error: "Failed to delete image" }, { status: 500 });
  }
}
