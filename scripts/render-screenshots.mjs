// Landing-page screenshot renderer. Serves the built site/dist with Vite's preview API on 127.0.0.1,
// drives a headless browser and writes docs/assets/screenshots/*.png. Network requests that leave the
// local origin are aborted. Outputs are committed; scripts/ci.sh never runs this script.
//
//   npm run site:build && node scripts/render-screenshots.mjs
/* global document */
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { launchBrowser } from './lib/browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const OUT = resolve(root, 'docs/assets/screenshots');
const BASE = '/lumagrid/';

const SHOTS = [
  { name: 'hero', viewport: { width: 1280, height: 720 }, selector: '#hero' },
  { name: 'features', viewport: { width: 1280, height: 800 }, selector: '#features' },
  { name: 'gallery-neon', viewport: { width: 1280, height: 900 }, selector: '#gallery', theme: 'Neon' },
  { name: 'gallery-dark', viewport: { width: 1280, height: 900 }, selector: '#gallery', theme: 'Dark' },
  { name: 'gallery-light', viewport: { width: 1280, height: 900 }, selector: '#gallery', theme: 'Light' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, selector: null },
];

const server = await preview({
  configFile: resolve(root, 'site/vite.config.ts'),
  preview: { host: '127.0.0.1', port: 0, strictPort: false },
});
const origin = new URL(server.resolvedUrls.local[0]).origin;
const { browser } = await launchBrowser();

try {
  mkdirSync(OUT, { recursive: true });
  for (const shot of SHOTS) {
    const context = await browser.newContext({
      viewport: shot.viewport,
      deviceScaleFactor: 2,
      reducedMotion: 'reduce',
      locale: 'en-US',
      timezoneId: 'UTC',
    });
    await context.route('**/*', (route) => {
      try {
        return new URL(route.request().url()).origin === origin ? route.continue() : route.abort();
      } catch {
        return route.abort();
      }
    });
    const page = await context.newPage();
    await page.goto(`${origin}${BASE}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    if (shot.theme) {
      await page.locator('#gallery').getByText(shot.theme, { exact: true }).first().click();
    }
    await page.waitForTimeout(400);
    const file = resolve(OUT, `${shot.name}.png`);
    if (shot.selector) {
      const el = page.locator(shot.selector);
      await el.scrollIntoViewIfNeeded();
      await el.screenshot({ path: file });
    } else {
      await page.screenshot({ path: file, fullPage: false });
    }
    console.log(`wrote ${shot.name}.png`);
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
