// Deterministic chart image renderer (D-14, D-19). Builds the site, serves site/dist with Vite's
// preview API on 127.0.0.1, drives a headless browser through scripts/lib/browser.mjs and writes
// docs/assets/charts/<chart>-<theme>.png (all charts) and .svg (the SVG charts). A second
// phase asserts the built landing page layout in a real browser (D-13).
//
//   node scripts/render-visuals.mjs [--only <chart>[:<theme>]] [--no-build] [--no-site-checks]
//
// Run it with `npm run visuals`. Outputs are committed; scripts/ci.sh never runs this script.
/* global document, window, getComputedStyle, XMLSerializer, requestAnimationFrame -- page.evaluate callbacks run in the browser */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, preview } from 'vite';
import { launchBrowser } from './lib/browser.mjs';
import { CAPTURE_BOX, OUT_DIR, SCALE, SVG_CHARTS, parseOnly, selectedPairs } from './lib/visuals-matrix.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const CONFIG_FILE = resolve(root, 'site/vite.config.ts');
const BASE = '/lumagrid/';

function parseArgs(argv) {
  const opts = { only: undefined, build: true, siteChecks: true };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--only') {
      opts.only = argv[i + 1];
      i += 1;
    } else if (arg === '--no-build') opts.build = false;
    else if (arg === '--no-site-checks') opts.siteChecks = false;
    else throw new Error(`unknown argument "${arg}"`);
  }
  return opts;
}

/** Abort every request that does not target the local preview server. */
async function localOnly(context, origin) {
  await context.route('**/*', (route) => {
    let ok;
    try {
      ok = new URL(route.request().url()).origin === origin;
    } catch {
      ok = false;
    }
    return ok ? route.continue() : route.abort();
  });
}

/** Serialize the first role=img svg inside #capture with a background rect (runs in the page). */
function extractSvg() {
  const svg = document.querySelector('#capture svg[role="img"]') ?? document.querySelector('#capture svg');
  if (!svg) throw new Error('no svg element inside #capture');
  const host = document.querySelector('#capture');
  const background = getComputedStyle(host).backgroundColor;
  const clone = svg.cloneNode(true);
  if (!clone.getAttribute('xmlns')) clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  rect.setAttribute('x', '0');
  rect.setAttribute('y', '0');
  rect.setAttribute('width', '100%');
  rect.setAttribute('height', '100%');
  rect.setAttribute('fill', background);
  clone.insertBefore(rect, clone.firstChild);
  return new XMLSerializer().serializeToString(clone);
}

async function captureAll(browser, origin, pairs) {
  const context = await browser.newContext({
    viewport: { width: 800, height: 520 },
    deviceScaleFactor: SCALE,
    reducedMotion: 'reduce',
    locale: 'en-US',
    timezoneId: 'UTC',
  });
  mkdirSync(resolve(root, OUT_DIR), { recursive: true });
  try {
    await localOnly(context, origin);
    for (const { chart, theme } of pairs) {
      const page = await context.newPage();
      try {
        await page.goto(`${origin}${BASE}capture.html?chart=${chart}&theme=${theme}&seed=1`, { waitUntil: 'load' });
        await page.waitForSelector('#capture[data-capture-ready="1"]', { timeout: 30000 });
        // Fonts load lazily on first use; request Inter explicitly, then let layout settle.
        await page.evaluate(async () => {
          await document.fonts.load('400 14px Inter');
          await document.fonts.load('600 14px Inter');
          await document.fonts.ready;
          await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        });
        const png = await page.locator('#capture').screenshot({ animations: 'disabled', caret: 'hide', type: 'png' });
        writeFileSync(resolve(root, OUT_DIR, `${chart}-${theme}.png`), png);
        let svgNote = '';
        if (SVG_CHARTS.includes(chart)) {
          const svg = await page.evaluate(extractSvg);
          writeFileSync(resolve(root, OUT_DIR, `${chart}-${theme}.svg`), `${svg}\n`);
          svgNote = ' + svg';
        }
        console.log(`captured ${chart}-${theme} (png${svgNote}, ${CAPTURE_BOX.width}x${CAPTURE_BOX.height} @${SCALE}x)`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await context.close();
  }
}

async function siteChecks(browser, origin) {
  const failures = [];
  const url = `${origin}${BASE}`;

  async function open(context, viewport) {
    const page = await context.newPage();
    await page.setViewportSize(viewport);
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    return page;
  }

  const reduced = await browser.newContext({ reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'UTC' });
  const motion = await browser.newContext({ reducedMotion: 'no-preference', locale: 'en-US', timezoneId: 'UTC' });
  try {
    await localOnly(reduced, origin);
    await localOnly(motion, origin);

    for (const width of [375, 1280]) {
      const page = await open(reduced, { width, height: width === 375 ? 812 : 800 });
      const m = await page.evaluate(() => ({
        innerWidth: window.innerWidth,
        doc: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }));
      if (m.doc > m.innerWidth || m.body > m.innerWidth) {
        failures.push(`horizontal overflow at ${width}px: innerWidth ${m.innerWidth}, documentElement.scrollWidth ${m.doc}, body.scrollWidth ${m.body}`);
      } else {
        console.log(`layout ok at ${width}px (scrollWidth ${m.doc} <= innerWidth ${m.innerWidth})`);
      }
      await page.close();
    }

    const animationName = async (context) => {
      const page = await open(context, { width: 1280, height: 800 });
      const name = await page.evaluate(() => {
        const el = document.querySelector('.grid-bg');
        return el ? getComputedStyle(el, '::before').animationName : '<no .grid-bg element>';
      });
      await page.close();
      return name;
    };
    const reducedName = await animationName(reduced);
    const motionName = await animationName(motion);
    if (reducedName !== 'none') failures.push(`grid animation under reduced motion is "${reducedName}", expected "none"`);
    if (motionName === 'none' || motionName.startsWith('<')) {
      failures.push(`grid animation with motion allowed is "${motionName}", expected an active animation`);
    }
    if (reducedName === 'none' && motionName !== 'none' && !motionName.startsWith('<')) {
      console.log(`grid animation ok (reduced: none, motion: ${motionName})`);
    }
  } finally {
    await reduced.close();
    await motion.close();
  }
  return failures;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pairs = selectedPairs(parseOnly(opts.only));

  if (opts.build) {
    await build({ configFile: CONFIG_FILE, logLevel: 'warn' });
  }

  let server;
  let browser;
  try {
    server = await preview({
      configFile: CONFIG_FILE,
      logLevel: 'warn',
      preview: { host: '127.0.0.1', port: 4173, strictPort: false, open: false },
    });
    const local = server.resolvedUrls?.local?.[0];
    if (!local) throw new Error('preview server did not report a local URL');
    const origin = new URL(local).origin;
    if (new URL(origin).hostname !== '127.0.0.1') throw new Error(`preview bound to ${origin}, expected 127.0.0.1`);

    let executablePath;
    ({ browser, executablePath } = await launchBrowser());
    console.log(`browser ${browser.version()} via ${executablePath}`);

    await captureAll(browser, origin, pairs);

    if (opts.siteChecks) {
      const failures = await siteChecks(browser, origin);
      if (failures.length > 0) {
        for (const f of failures) console.error(`SITE CHECK FAILED: ${f}`);
        process.exitCode = 1;
      }
    }
  } finally {
    if (browser) await browser.close();
    if (server) await new Promise((r) => server.httpServer.close(r));
  }
}

main().then(
  () => process.exit(process.exitCode ?? 0),
  (err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  },
);
