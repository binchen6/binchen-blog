/** Release 元信息代理：本站缓存 → GitHub API → gh-proxy 国内镜像兜底。
 *  解决部分地区 api.github.com 不稳定导致的 503。 */
export const runtime = 'edge';

const API = 'https://api.github.com/repos/binchen6/CryoClaw/releases/latest';
const MIRROR = 'https://gh-proxy.com/';
const UA = 'CryoClaw-website';

export async function GET() {
  const sources = [API, MIRROR + API];
  for (const url of sources) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) throw new Error('Release unavailable');
      const data = await response.json() as { tag_name: string; published_at: string; assets: { name: string; size: number; browser_download_url: string }[] };
      return Response.json(
        {
          tag_name: data.tag_name,
          published_at: data.published_at,
          assets: (data.assets || []).map((a) => ({ name: a.name, size: a.size, browser_download_url: a.browser_download_url })),
        },
        { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } },
      );
    } catch { /* 尝试下一通道 */ }
  }
  return Response.json({ error: 'Release unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
}
