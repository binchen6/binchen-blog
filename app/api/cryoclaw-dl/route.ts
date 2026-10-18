/** Fixed-repository streaming proxy; ranges allow interrupted downloads to resume. */
export const runtime = 'edge';
const ROOT = 'https://github.com/binchen6/CryoClaw/releases/';
const API = 'https://api.github.com/repos/binchen6/CryoClaw/releases/';
const UA = 'CryoClaw-download';
async function download(request: Request, head = false) {
  const version = new URL(request.url).searchParams.get('v');
  if (version && !/^v?\d+(\.\d+){2}$/.test(version)) return new Response('Invalid version', { status: 400 });
  const releasePath = version ? 'tags/v' + version.replace(/^v/, '') : 'latest';
  let fallback = ROOT + (version ? 'tag/v' + version.replace(/^v/, '') : 'latest');
  try {
    const meta = await fetch(API + releasePath, { headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(8000) });
    if (!meta.ok) throw new Error('Metadata unavailable');
    const release = await meta.json() as { tag_name: string; assets: { name: string; browser_download_url: string }[] };
    const asset = (release.assets || []).find((a: { name: string }) => /^CryoClaw-Setup-.*-x64\.exe$/i.test(a.name));
    if (!asset || !asset.browser_download_url.startsWith(ROOT + 'download/')) throw new Error('Asset unavailable');
    fallback = asset.browser_download_url;
    const upstreamHeaders = new Headers({ 'User-Agent': UA });
    for (const key of ['range', 'if-range']) { const value = request.headers.get(key); if (value) upstreamHeaders.set(key, value); }
    const upstream = await fetch(fallback, { method: head ? 'HEAD' : 'GET', headers: upstreamHeaders, redirect: 'follow' });
    if (upstream.status !== 416 && !upstream.ok) throw new Error('Download unavailable');
    const headers = new Headers({ 'Content-Type': 'application/octet-stream', 'Content-Disposition': `attachment; filename="${asset.name.replace(/[^\w.\-]/g, '_')}"`, 'Cache-Control': version ? 'public, max-age=86400' : 'no-cache', 'X-Dl-Version': release.tag_name });
    for (const key of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) { const value = upstream.headers.get(key); if (value) headers.set(key, value); }
    return new Response(head ? null : upstream.body, { status: upstream.status, headers });
  } catch {
    return new Response(null, { status: 302, headers: { Location: fallback, 'Cache-Control': 'no-store' } });
  }
}
export const GET = (request: Request) => download(request);
export const HEAD = (request: Request) => download(request, true);
