/** Fixed-repository streaming proxy; ranges allow interrupted downloads to resume.
 *  上游失败时自动切换 gh-proxy 国内镜像，最终兜底 302 到镜像地址。 */
export const runtime = 'edge';

const ROOT = 'https://github.com/binchen6/CryoClaw/releases/';
const API = 'https://api.github.com/repos/binchen6/CryoClaw/releases/';
const MIRROR = 'https://gh-proxy.com/';
const UA = 'CryoClaw-download';

async function download(request: Request, head = false) {
  const version = new URL(request.url).searchParams.get('v');
  if (version && !/^v?\d+(\.\d+){2}$/.test(version)) return new Response('Invalid version', { status: 400 });
  const releasePath = version ? 'tags/v' + version.replace(/^v/, '') : 'latest';
  const fallback = ROOT + (version ? 'tag/v' + version.replace(/^v/, '') : 'latest');
  try {
    const metaSources = [API + releasePath, MIRROR + API + releasePath];
    let release: { tag_name: string; assets: { name: string; browser_download_url: string }[] } | null = null;
    for (const url of metaSources) {
      try {
        const meta = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) });
        if (!meta.ok) continue;
        release = await meta.json() as typeof release;
        break;
      } catch { /* 尝试下一通道 */ }
    }
    if (!release) throw new Error('Metadata unavailable');
    const asset = (release.assets || []).find((a) => /^CryoClaw-Setup-.*-x64\.exe$/i.test(a.name));
    if (!asset || !asset.browser_download_url.startsWith(ROOT + 'download/')) throw new Error('Asset unavailable');
    const upstreamHeaders = new Headers({ 'User-Agent': UA });
    for (const key of ['range', 'if-range']) { const value = request.headers.get(key); if (value) upstreamHeaders.set(key, value); }
    // 直连优先，失败走国内镜像
    let upstream: Response | null = null;
    for (const url of [asset.browser_download_url, MIRROR + asset.browser_download_url]) {
      try {
        const res = await fetch(url, { method: head ? 'HEAD' : 'GET', headers: upstreamHeaders, redirect: 'follow' });
        if (res.status === 416 || res.ok) { upstream = res; break; }
      } catch { /* 尝试下一通道 */ }
    }
    if (!upstream) throw new Error('Download unavailable');
    const headers = new Headers({ 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${asset.name.replace(/[^\w.\-]/g, '_')}"`, 'Cache-Control': version ? 'public, max-age=86400' : 'no-cache', 'X-Dl-Version': release.tag_name });
    for (const key of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) { const value = upstream.headers.get(key); if (value) headers.set(key, value); }
    return new Response(head ? null : upstream.body, { status: upstream.status, headers });
  } catch {
    // 302 兜底顺序：国内镜像（latest 解析页）→ GitHub 官方
    return new Response(null, { status: 302, headers: { Location: MIRROR + fallback, 'Cache-Control': 'no-store' } });
  }
}

export const GET = (request: Request) => download(request);
export const HEAD = (request: Request) => download(request, true);
