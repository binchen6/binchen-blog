const fs = require('node:fs');
const ts = require('typescript');
const assert = require('node:assert/strict');
const { test } = require('node:test');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
const { GET, HEAD } = require('../app/api/cryoclaw-dl/route.ts');
const { GET: metadata } = require('../app/api/cryoclaw-release/route.ts');
const { normalizeRelease } = require('../lib/cryoclaw-release.ts');
const snapshot = require('../public/CryoClaw/release.json');
const asset = snapshot.assets[0];
const request = (query = '?v=2026.1019.0', headers = {}) => new Request('https://example.com/api/cryoclaw-dl' + query, { headers });
const mockFetch = (t, handler) => t.mock.method(globalThis, 'fetch', handler);
const binary = (body = 'MZbinary', extra = {}) => new Response(body, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(body.length), 'Accept-Ranges': 'bytes', ETag: '"installer"', ...extra } });

test('pinned download bypasses metadata and streams original bytes', async t => {
  const calls = []; mockFetch(t, async (url, init) => { calls.push([url, init]); return binary(); });
  const result = await GET(request());
  assert.equal(result.status, 200); assert.equal(await result.text(), 'MZbinary');
  assert.equal(calls.length, 1); assert.equal(calls[0][0], asset.browser_download_url);
  assert.equal(result.headers.get('X-Dl-Source'), 'github');
  assert.match(result.headers.get('content-disposition'), /CryoClaw-Setup-2026\.1019\.0-x64\.exe/);
});
test('Range and If-Range reach upstream, 206 and headers survive', async t => {
  mockFetch(t, async (url, init) => {
    assert.equal(init.headers.get('range'), 'bytes=2-5'); assert.equal(init.headers.get('if-range'), '"installer"');
    return new Response('bina', { status: 206, headers: { 'Content-Type': 'application/octet-stream', 'Content-Range': 'bytes 2-5/8', 'Content-Length': '4', 'Accept-Ranges': 'bytes' } });
  });
  const result = await GET(request('?v=2026.1019.0', { Range: 'bytes=2-5', 'If-Range': '"installer"' }));
  assert.equal(result.status, 206); assert.equal(result.headers.get('Content-Range'), 'bytes 2-5/8');
  assert.equal(result.headers.get('Content-Length'), '4'); assert.equal(result.headers.get('Cache-Control'), 'no-store');
  assert.equal(await result.text(), 'bina');
});
test('HEAD preserves download headers without sending a body', async t => {
  mockFetch(t, async (url, init) => { assert.equal(init.method, 'HEAD'); return new Response(null, { headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': String(asset.size) } }); });
  const result = await HEAD(request()); assert.equal(result.status, 200); assert.equal(result.body, null); assert.equal(result.headers.get('Content-Length'), String(asset.size));
});
test('HTML response from direct source falls back to binary mirror', async t => {
  const calls = []; mockFetch(t, async url => { calls.push(url); return calls.length === 1 ? new Response('<html>proxy error</html>', { headers: { 'Content-Type': 'text/html' } }) : binary(); });
  const result = await GET(request()); assert.equal(result.headers.get('X-Dl-Source'), 'mirror'); assert.equal(await result.text(), 'MZbinary');
  assert.equal(calls[1], 'https://gh-proxy.com/' + asset.browser_download_url);
});
test('all failed sources redirect to the actual official exe', async t => {
  mockFetch(t, async () => new Response('<html>unavailable</html>', { status: 502, headers: { 'Content-Type': 'text/html' } }));
  const result = await GET(request()); assert.equal(result.status, 302); assert.equal(result.headers.get('location'), asset.browser_download_url); assert.ok(result.headers.get('location').endsWith('.exe'));
});
test('416 preserves the total size without inventing an attachment', async t => {
  mockFetch(t, async () => new Response(null, { status: 416, headers: { 'Content-Range': 'bytes */8' } }));
  const result = await GET(request('?v=2026.1019.0', { Range: 'bytes=999-' }));
  assert.equal(result.status, 416); assert.equal(result.headers.get('Content-Range'), 'bytes */8'); assert.equal(result.headers.get('Content-Disposition'), null);
});
test('invalid versions, sources, empty v and multipart ranges never fetch', async t => {
  const fetch = mockFetch(t, async () => { throw new Error('Must not fetch'); });
  for (const query of ['?v=', '?v=../../../secret', '?source=https://evil.test']) assert.equal((await GET(request(query))).status, 400);
  assert.equal((await GET(request('?v=2026.1019.0', { Range: 'bytes=0-1,3-4' }))).status, 400);
  assert.equal(fetch.mock.calls.length, 0);
});
test('explicit mirror selection skips the direct source', async t => {
  mockFetch(t, async url => { assert.equal(url, 'https://gh-proxy.com/' + asset.browser_download_url); return binary(); });
  assert.equal((await GET(request('?v=v2026.1019.0&source=mirror'))).headers.get('X-Dl-Source'), 'mirror');
});
test('header timeout is cleared so a slow body is not aborted', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); let signal;
  mockFetch(t, async (url, init) => { signal = init.signal; return binary(); });
  const result = await GET(request()); t.mock.timers.tick(8000); assert.equal(signal.aborted, false); assert.equal(await result.text(), 'MZbinary');
});
test('metadata failure returns a labeled verified snapshot', async t => {
  mockFetch(t, async () => { throw new Error('offline'); });
  const result = await metadata(); const data = await result.json(); assert.equal(result.status, 200); assert.equal(data.stale, true); assert.equal(data.assets[0].digest, asset.digest);
});
test('metadata rejects mismatched repositories and unpublished installers', () => {
  assert.equal(normalizeRelease({ ...snapshot, assets: [{ ...asset, browser_download_url: 'https://evil.test/file.exe' }] }), null);
  assert.equal(normalizeRelease({ ...snapshot, prerelease: true }), null);
  assert.equal(normalizeRelease({ ...snapshot, assets: [] }), null);
  assert.equal(normalizeRelease(snapshot, '2026.1018.0'), null);
});
test('live metadata updates all installer fields together', async t => {
  const data = JSON.parse(JSON.stringify(snapshot)); data.tag_name = 'v2026.1020.0';
  data.assets[0].name = data.assets[0].name.replace('2026.1019.0', '2026.1020.0');
  data.assets[0].browser_download_url = data.assets[0].browser_download_url.replaceAll('2026.1019.0', '2026.1020.0');
  mockFetch(t, async () => Response.json(data));
  const result = await metadata(); const release = await result.json(); assert.equal(release.stale, false); assert.equal(release.tag_name, data.tag_name); assert.equal(release.assets[0].browser_download_url, data.assets[0].browser_download_url);
});
test('unknown version returns 404 instead of a different installer', async t => {
  mockFetch(t, async () => new Response(null, { status: 404 }));
  const result = await GET(request('?v=2099.1.0')); assert.equal(result.status, 404);
});
