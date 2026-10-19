import { loadRelease, ReleaseError, MIRROR, USER_AGENT } from '../../../lib/cryoclaw-release';

export const runtime = 'edge';

/** Clear the timeout after headers: aborting later would truncate large downloads. */
async function fetchHeaders(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 7000);
  try { return await fetch(url, { ...init, signal: controller.signal }); }
  finally { clearTimeout(timeout); }
}

async function download(request: Request, head = false): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const rawVersion = params.get('v');
  const source = params.get('source') || 'auto';
  if (rawVersion !== null && !/^v?\d+(\.\d+){2}$/.test(rawVersion)) return new Response('Invalid version', { status: 400 });
  if (!['auto', 'github', 'mirror'].includes(source)) return new Response('Invalid source', { status: 400 });
  const range = request.headers.get('range');
  // One range is sufficient for resume; multipart responses need a different MIME type.
  if (range && !/^bytes=(?:\d+-\d*|-\d+)$/.test(range)) return new Response('Invalid range', { status: 400 });
  let release;
  try { release = await loadRelease(rawVersion?.replace(/^v/, '')); }
  catch (error) { return new Response(error instanceof Error ? error.message : 'Release unavailable', { status: error instanceof ReleaseError ? error.status : 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } }); }
  const asset = release.assets[0];
  const headers = new Headers({ 'User-Agent': USER_AGENT, 'Accept-Encoding': 'identity' });
  for (const key of ['range', 'if-range']) { const value = request.headers.get(key); if (value) headers.set(key, value); }
  const sources: [string, string][] = source === 'mirror' ? [[MIRROR + asset.browser_download_url, 'mirror']] : source === 'github' ? [[asset.browser_download_url, 'github']] : [[asset.browser_download_url, 'github'], [MIRROR + asset.browser_download_url, 'mirror']];
  for (const [url, channel] of sources) {
    try {
      const upstream = await fetchHeaders(url, { method: head ? 'HEAD' : 'GET', headers, redirect: 'follow' });
      if (upstream.status === 416) {
        await upstream.body?.cancel();
        const result = new Headers({ 'Cache-Control': 'no-store' });
        const contentRange = upstream.headers.get('content-range');
        if (contentRange) result.set('Content-Range', contentRange);
        return new Response(null, { status: 416, headers: result });
      }
      const type = upstream.headers.get('content-type') || '';
      // Proxy error/landing pages must never be delivered under an .exe filename.
      if (![200, 206].includes(upstream.status) || !/^(?:application\/(?:octet-stream|x-msdownload|x-msdos-program|vnd\.microsoft\.portable-executable|exe|x-executable)|binary\/octet-stream)(?:;|$)/i.test(type) || (upstream.status === 206 && !upstream.headers.has('content-range'))) {
        await upstream.body?.cancel(); continue;
      }
      const result = new Headers({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${asset.name}"`,
        'Cache-Control': upstream.status === 206 ? 'no-store' : 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
        'X-Dl-Version': release.tag_name,
        'X-Dl-Source': channel,
      });
      for (const key of ['content-length', 'content-range', 'accept-ranges', 'etag', 'last-modified']) { const value = upstream.headers.get(key); if (value) result.set(key, value); }
      return new Response(head ? null : upstream.body, { status: upstream.status, headers: result });
    } catch { /* The next source is independent and gets its own header deadline. */ }
  }
  // Redirect to the actual official asset, never a mirror's HTML release page.
  return new Response(null, { status: 302, headers: { Location: asset.browser_download_url, 'Cache-Control': 'no-store' } });
}

export const GET = (request: Request) => download(request);
export const HEAD = (request: Request) => download(request, true);
