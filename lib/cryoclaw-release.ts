import snapshot from '../public/CryoClaw/release.json';

export const RELEASE_ROOT = 'https://github.com/binchen6/CryoClaw/releases/';
export const RELEASE_API = 'https://api.github.com/repos/binchen6/CryoClaw/releases/';
export const MIRROR = 'https://gh-proxy.com/';
export const USER_AGENT = 'CryoClaw-website';

export interface ReleaseAsset { name: string; size: number; browser_download_url: string; digest?: string }
export interface Release { tag_name: string; published_at: string; html_url: string; assets: ReleaseAsset[]; stale: boolean }
export class ReleaseError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Exact filename and repository checks keep mirror responses out of link generation. */
export function normalizeRelease(value: unknown, version?: string): Release | null {
  if (!value || typeof value !== 'object') return null;
  const data = value as Record<string, unknown>;
  if (typeof data.tag_name !== 'string' || !/^v\d+(\.\d+){2}$/.test(data.tag_name) || data.draft || data.prerelease) return null;
  if (version && data.tag_name !== 'v' + version) return null;
  const name = `CryoClaw-Setup-${data.tag_name.slice(1)}-x64.exe`;
  const url = RELEASE_ROOT + `download/${data.tag_name}/${name}`;
  const asset = Array.isArray(data.assets) ? data.assets.find((a: ReleaseAsset) => a?.name === name && a.browser_download_url === url && Number.isSafeInteger(a.size) && a.size > 0) : null;
  if (!asset) return null;
  return {
    tag_name: data.tag_name,
    published_at: typeof data.published_at === 'string' && Number.isFinite(Date.parse(data.published_at)) ? data.published_at : '',
    html_url: RELEASE_ROOT + 'tag/' + data.tag_name,
    assets: [{ name, size: asset.size, browser_download_url: url, ...(/^sha256:[a-f0-9]{64}$/i.test(asset.digest || '') ? { digest: asset.digest } : {}) }],
    stale: false,
  };
}

export async function loadRelease(version?: string): Promise<Release> {
  // Version-pinned downloads need no metadata round trip for the bundled release.
  const pinned = normalizeRelease(snapshot, version);
  if (version && pinned) return { ...pinned, stale: true };
  const suffix = version ? 'tags/v' + version : 'latest';
  let missing = false;
  for (const source of [RELEASE_API + suffix, MIRROR + RELEASE_API + suffix]) {
    try {
      const response = await fetch(source, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(3500),
      });
      if (!response.ok) { missing ||= response.status === 404; await response.body?.cancel(); continue; }
      const release = normalizeRelease(await response.json(), version);
      if (release) return release;
    } catch { /* A bounded second source keeps a slow API off the download path. */ }
  }
  if (!version && pinned) return { ...pinned, stale: true };
  throw new ReleaseError(missing ? 'Release not found' : 'Release unavailable', missing ? 404 : 503);
}
