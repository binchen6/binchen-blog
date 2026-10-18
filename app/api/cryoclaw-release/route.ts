export const runtime = 'edge';
export async function GET() {
  try {
    const response = await fetch('https://api.github.com/repos/binchen6/CryoClaw/releases/latest', {
      headers: { 'User-Agent': 'CryoClaw-website', Accept: 'application/vnd.github+json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error('Release unavailable');
    const data = await response.json() as { tag_name: string; published_at: string; assets: { name: string; size: number; browser_download_url: string }[] };
    return Response.json({ tag_name: data.tag_name, published_at: data.published_at,
      assets: (data.assets || []).map((a: { name: string; size: number; browser_download_url: string }) => ({ name: a.name, size: a.size, browser_download_url: a.browser_download_url }))
    }, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } });
  } catch {
    return Response.json({ error: 'Release unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
