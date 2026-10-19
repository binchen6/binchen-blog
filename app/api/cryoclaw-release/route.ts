import { loadRelease } from '../../../lib/cryoclaw-release';

export const runtime = 'edge';

export async function GET(): Promise<Response> {
  const release = await loadRelease();
  return Response.json(release, { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } });
}
