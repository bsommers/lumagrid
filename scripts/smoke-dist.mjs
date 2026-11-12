// Post-build smoke check: every package.json "exports" entry must load from the BUILT dist through both
// require() and import(), and expose a known symbol. Run after `npm run build` (wired into scripts/ci.sh).
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const require = createRequire(join(root, 'noop.cjs'));

// One symbol that must exist per entry; an exports entry missing here fails the check.
const expected = {
  '.': 'LineChart',
  './transforms': 'flatten',
  './theme': 'lightTheme',
  './viz': 'ScatterChart',
  './plugins': 'createD3Plugin',
  './testing': 'checkPluginConformance',
};

let failed = 0;
const fail = (msg) => { failed++; console.error(`FAIL ${msg}`); };

for (const sub of Object.keys(pkg.exports)) {
  if (!(sub in expected)) { fail(`exports["${sub}"] has no expected symbol in scripts/smoke-dist.mjs`); continue; }
}
for (const [sub, symbol] of Object.entries(expected)) {
  if (!(sub in pkg.exports)) { fail(`expected entry "${sub}" is not in package.json exports`); continue; }
  const spec = sub === '.' ? pkg.name : `${pkg.name}${sub.slice(1)}`;
  try {
    const cjs = require(spec);
    if (cjs[symbol] === undefined) fail(`require('${spec}') lacks ${symbol}`);
  } catch (e) { fail(`require('${spec}') threw: ${e.message}`); }
  try {
    const esm = await import(spec);
    if (esm[symbol] === undefined) fail(`import('${spec}') lacks ${symbol}`);
  } catch (e) { fail(`import('${spec}') threw: ${e.message}`); }
  console.log(`ok ${spec} (${symbol})`);
}
if (failed) { console.error(`smoke-dist: ${failed} failure(s)`); process.exit(1); }
console.log('smoke-dist: all exports entries load via require and import');
