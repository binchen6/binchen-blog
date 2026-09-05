/**
 * CryoClaw 下载加速 —— 本站 Cloudflare 边缘节点中转 GitHub Releases 安装包。
 *
 * 官方链路：github.com/.../releases/download → 302 → objects.githubusercontent.com，
 * 部分网络下慢或不稳定。本路由在边缘拉取最新版 Setup 安装包并流式回传，
 * 文件字节与 GitHub 完全一致（用户可对照 latest.yml 的 sha512 校验）。
 *
 * 仅允许转发本仓库 Release 的 Setup-*-x64.exe 资产，不做通用代理。
 */

export const runtime = "edge";

const RELEASE_API =
  "https://api.github.com/repos/binchen6/CryoClaw/releases/latest";
const ASSET_PATTERN = /Setup.*x64\.exe$/i;
const UA = "cryoconite-dl-proxy (+https://cryoconite.cn/CryoClaw)";

interface GithubAsset {
  name: string;
  size: number;
  browser_download_url: string;
}

interface GithubRelease {
  tag_name: string;
  assets: GithubAsset[];
}

function noStoreHeaders(): HeadersInit {
  return { "Cache-Control": "no-store" };
}

export async function GET(request: Request) {
  try {
    // 1. 取最新 Release 元数据（跟随 ?v= 指定版本，默认 latest）
    const wantTag = new URL(request.url).searchParams.get("v");
    const apiUrl = wantTag
      ? `https://api.github.com/repos/binchen6/CryoClaw/releases/tags/v${wantTag.replace(/^v/, "")}`
      : RELEASE_API;

    const metaResp = await fetch(apiUrl, {
      headers: { "User-Agent": UA, Accept: "application/vnd.github+json" },
    });
    if (!metaResp.ok) {
      return fallback("GitHub Release 元数据获取失败", metaResp.status);
    }
    const release = (await metaResp.json()) as GithubRelease;
    const asset = (release.assets || []).find((a) => ASSET_PATTERN.test(a.name));
    if (!asset) {
      return fallback("未找到 Windows 安装包资产", 404);
    }

    // 2. 流式中转安装包（不缓冲，直接透传 body）
    const upstream = await fetch(asset.browser_download_url, {
      headers: { "User-Agent": UA },
      redirect: "follow",
    });
    if (!upstream.ok || !upstream.body) {
      return fallback("安装包拉取失败", upstream.status || 502);
    }

    const headers = new Headers();
    headers.set("Content-Type", "application/octet-stream");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${asset.name}"`
    );
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    headers.set("Cache-Control", "public, max-age=300");
    headers.set("X-Dl-Source", "github-releases-via-cryoconite-edge");
    headers.set("X-Dl-Version", release.tag_name || "");

    return new Response(upstream.body, { status: 200, headers });
  } catch (error) {
    console.error("cryoclaw-dl proxy error:", error);
    return fallback("加速节点内部错误", 500);
  }
}

/** 出错时 302 回退到 GitHub 官方下载页，保证用户总能下载 */
function fallback(reason: string, status: number) {
  console.warn(`cryoclaw-dl fallback: ${reason} (${status})`);
  return Response.redirect(
    "https://github.com/binchen6/CryoClaw/releases/latest",
    302
  );
}
