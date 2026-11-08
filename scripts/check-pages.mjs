// Pages checker (D-11). Default mode statically checks the built artifact in site/dist
// (run after `npm run site:build` and the docs/api copy). With `--url <base>` it checks the
// live deployment instead.
// Usage: node scripts/check-pages.mjs
//        node scripts/check-pages.mjs --url https://bsommers.github.io/lumagrid/
// Exits 1 with one message per failure.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(REPO_ROOT);

const DIST = 'site/dist';
const REQUIRED = ['index.html', 'capture.html', 'api/index.html', 'og.png', 'favicon.ico', 'site.webmanifest'];
const BASE_PATH = '/lumagrid/';
const LIVE_HOST = 'bsommers.github.io';
const LIVE_PATHS = ['', 'api/', 'og.png', 'site.webmanifest', 'favicon.ico'];
const TEXT_EXT = /\.(html|css|js|mjs|json|webmanifest|svg|txt|map|xml)$/i;
// An absolute local home directory leaking into published docs (Linux, macOS, Windows).
const HOME_PATH = /(?:\/home\/[A-Za-z0-9._-]+\/|\/Users\/[A-Za-z0-9._-]+\/|[A-Za-z]:\\Users\\[A-Za-z0-9._-]+\\)/;

/**
 * Every file below `dir`, as paths relative to `dir` with forward slashes.
 * @param {string} dir
 * @param {string} [prefix]
 * @returns {string[]}
 */
function walk(dir, prefix = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const rel = prefix ? `${prefix}/${name}` : name;
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, rel));
    else out.push(rel);
  }
  return out;
}

/**
 * Static artifact check.
 * @returns {string[]} failure messages
 */
export function checkArtifact() {
  const errors = [];
  if (!existsSync(DIST)) return [`${DIST} is missing: run npm run site:build first`];
  for (const rel of REQUIRED) {
    if (!existsSync(join(DIST, rel))) errors.push(`${DIST}/${rel} is missing`);
  }
  const indexPath = join(DIST, 'index.html');
  if (existsSync(indexPath) && !readFileSync(indexPath, 'utf8').includes(BASE_PATH)) {
    errors.push(`${DIST}/index.html does not reference the ${BASE_PATH} base`);
  }
  const apiDir = join(DIST, 'api');
  if (existsSync(apiDir)) {
    for (const rel of walk(apiDir)) {
      if (!TEXT_EXT.test(rel)) continue;
      if (HOME_PATH.test(readFileSync(join(apiDir, rel), 'utf8'))) {
        errors.push(`${DIST}/api/${rel} contains an absolute local home-directory path`);
      }
    }
  }
  return errors;
}

/**
 * Validates and normalises the live base URL: https on the project's Pages host only.
 * @param {string} raw
 * @returns {string} base URL ending with a slash
 */
export function parseBase(raw) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(`not a valid URL: ${raw}`);
  }
  if (url.protocol !== 'https:' || url.hostname !== LIVE_HOST) {
    throw new Error(`base URL must be https on ${LIVE_HOST}: ${raw}`);
  }
  return url.href.endsWith('/') ? url.href : `${url.href}/`;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Live URL check with retries for Pages propagation.
 * @param {string} base
 * @param {{attempts?: number, delayMs?: number}} [opts]
 * @returns {Promise<string[]>} failure messages
 */
export async function checkLive(base, { attempts = 5, delayMs = 10000 } = {}) {
  const errors = [];
  for (const p of LIVE_PATHS) {
    const url = new URL(p, base).href;
    let status = 0;
    for (let i = 0; i < attempts; i += 1) {
      try {
        status = (await fetch(url, { redirect: 'follow' })).status;
      } catch {
        status = 0;
      }
      if (status === 200) break;
      if (i < attempts - 1) await sleep(delayMs);
    }
    if (status !== 200) errors.push(`${url} returned ${status || 'no response'} (expected 200)`);
  }
  return errors;
}

async function main() {
  const args = process.argv.slice(2);
  const urlIdx = args.indexOf('--url');
  let errors;
  if (urlIdx !== -1) {
    const raw = args[urlIdx + 1];
    if (!raw) throw new Error('--url needs a value');
    errors = await checkLive(parseBase(raw));
  } else {
    errors = checkArtifact();
  }
  if (errors.length > 0) {
    for (const e of errors) console.error(`check-pages: ${e}`);
    process.exit(1);
  }
  console.log(urlIdx !== -1 ? 'check-pages: live site OK' : 'check-pages: artifact OK');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`check-pages: ${err.message}`);
    process.exit(1);
  });
}
