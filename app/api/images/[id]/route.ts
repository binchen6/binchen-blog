import { NextRequest, NextResponse } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canManageImage, getCurrentUserFromRequest } from "@/lib/auth";

export const runtime = "edge";

function encodePath(path: string): string {
  return path.split("/").map(encodeURIComponent).join("/");
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const ctx = getRequestContext();
    const env = ctx.env as any;
    const db = env.DB;
    const image = await db.prepare("SELECT * FROM images WHERE id = ?").bind(params.id).first();
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    if (!canManageImage(currentUser, Number(image.user_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (image.sha && env.GITHUB_TOKEN && env.GITHUB_OWNER && env.GITHUB_REPO) {
      const branch = env.GITHUB_BRANCH || "main";
      const githubRes = await fetch(
        `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodePath(image.storage_key)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "Content-Type": "application/json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "binchen-blog",
          },
          body: JSON.stringify({
            message: `delete image: ${image.storage_key}`,
            sha: image.sha,
            branch,
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
        return NextResponse.json({ error: "GitHub delete failed" }, { status: 502 });
      }
    }

    await db.prepare("DELETE FROM images WHERE id = ?").bind(params.id).run();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete image error:", error);
    return NextResponse.json({ error: "Failed to delete image" }, { status: 500 });
  }
}
