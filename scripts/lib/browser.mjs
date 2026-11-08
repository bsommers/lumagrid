// Shared browser resolver and launcher for the brand and visuals scripts (D-19).
// Resolution order: LUMAGRID_CHROME, Playwright-managed Chromium, system Chrome.
// The Chromium download is never mandatory and this module never runs it.
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-core';

const SYSTEM_CHROME = '/usr/bin/google-chrome';

/**
 * Resolve a browser executable path.
 * @param {Record<string, string | undefined>} [env]
 * @returns {string}
 */
export function resolveChrome(env = process.env) {
  const fromEnv = env.LUMAGRID_CHROME;
  if (fromEnv) {
    if (!existsSync(fromEnv)) {
      throw new Error(`LUMAGRID_CHROME is set to "${fromEnv}" but that file does not exist`);
    }
    return fromEnv;
  }

  let managed = '';
  try {
    managed = chromium.executablePath();
  } catch {
    managed = '';
  }
  if (managed && existsSync(managed)) return managed;

  if (existsSync(SYSTEM_CHROME)) return SYSTEM_CHROME;

  throw new Error(
    [
      'No browser executable found. Tried, in order:',
      '  1. the LUMAGRID_CHROME environment variable (not set)',
      `  2. the Playwright-managed Chromium (${managed || 'unavailable'}; not installed)`,
      `  3. ${SYSTEM_CHROME} (not present)`,
      'Set LUMAGRID_CHROME to a Chrome or Chromium binary, or run `npx playwright-core install chromium` yourself (this script never runs it).',
    ].join('\n'),
  );
}

/**
 * Launch a headless browser with the sandbox left enabled.
 * @returns {Promise<{ browser: import('playwright-core').Browser, executablePath: string }>}
 */
export async function launchBrowser() {
  const executablePath = resolveChrome();
  const browser = await chromium.launch({ executablePath, headless: true });
  return { browser, executablePath };
}

async function smoke() {
  let browser;
  try {
    let executablePath;
    ({ browser, executablePath } = await launchBrowser());
    const page = await browser.newPage();
    await page.setContent('<body style="margin:0;background:#123"><h1>lumagrid</h1></body>');
    const png = await page.screenshot({ type: 'png' });
    const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (png.length < 8 || !png.subarray(0, 8).equals(signature)) {
      throw new Error('screenshot is not a PNG (bad signature)');
    }
    console.log(`browser ${browser.version()} via ${executablePath}`);
    console.log('PNG ok');
  } finally {
    if (browser) await browser.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv.includes('--smoke')) {
  smoke().then(
    () => process.exit(0),
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    },
  );
}
