import { NextRequest } from "next/server";
import { getRequestContext } from "@cloudflare/next-on-pages";
import { canAccessAdmin, getCurrentUserFromRequest } from "@/lib/auth";
import { getGithubBuildEnvPresence, getGithubImageConfig, getGithubRuntimeEnvPresence, getRelatedRuntimeEnvKeys } from "@/lib/github-config";
import { json, noStoreHeaders } from "@/lib/security";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(request);
    if (!currentUser || !canAccessAdmin(currentUser)) {
      return json({ error: "Forbidden" }, { status: 403, headers: noStoreHeaders() });
    }

    const ctx = getRequestContext();
    const env = ctx.env as any;
    const github = getGithubImageConfig(env);
    let repoStatus: number | null = null;
    let repoOk = false;
    let repoMessage = "";

    if (github.missing.length === 0) {
      const res = await fetch(`https://api.github.com/repos/${github.owner}/${github.repo}`, {
        headers: {
          Authorization: `Bearer ${github.token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "binchen-blog",
        },
      });
      repoStatus = res.status;
      repoOk = res.ok;
      if (!res.ok) {
        try {
          const data = await res.json() as { message?: string };
          repoMessage = data.message || "";
        } catch {
          repoMessage = await res.text();
        }
      }
    }

    return json({
      configured: github.missing.length === 0,
      missing: github.missing,
      owner: github.owner || null,
      repo: github.repo || null,
      branch: github.branch,
      uploadDir: github.uploadDir,
      sources: github.sources,
      runtimeEnvPresence: getGithubRuntimeEnvPresence(env),
      buildEnvPresence: getGithubBuildEnvPresence(),
      relatedRuntimeEnvKeys: getRelatedRuntimeEnvKeys(env),
      tokenPresent: Boolean(github.token),
      tokenLength: github.token.length,
      repoCheck: {
        ok: repoOk,
        status: repoStatus,
        message: repoMessage.slice(0, 200),
      },
    }, { headers: noStoreHeaders() });
  } catch (error) {
    console.error("GitHub storage diagnostic error:", error);
    return json({ error: "Failed to inspect GitHub storage" }, { status: 500, headers: noStoreHeaders() });
  }
}
