/* A successful build must still contain independent route handlers. */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const functions = path.resolve('.vercel/output/functions');
const realpaths = new Set();
for (const route of ['api/cryoclaw-dl', 'api/cryoclaw-release', 'api/health']) {
  const folder = path.join(functions, route + '.func');
  const config = JSON.parse(fs.readFileSync(path.join(folder, '.vc-config.json'), 'utf8'));
  assert.equal(config.name, route, `${route} points to another function; rebuild on clean Linux`);
  realpaths.add(fs.realpathSync(folder));
}
assert.equal(realpaths.size, 3, 'Public API routes share one output directory');
console.log('Verified independent download, release and health handlers');
