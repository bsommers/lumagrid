// Manifest-driven brand asset generator (D-09). Rasterizes the canonical SVG sources in a
// headless browser (scripts/lib/browser.mjs), packs the ICO and copies SVGs, all described by
// brand/assets.json. Output is byte-deterministic. Run it with `npm run brand`.
//
// brand/assets.json schema (JSON has no comments, so it is documented here):
//   pngs:   [{ src, out, width, height, background }]
//             src         repo-relative SVG path
//             out         repo-relative PNG path (must be inside site/public/ or docs/assets/)
//             width,height target pixel size
//             background  null for transparent, or a hex color such as "#05070A"
//   ico:    { out, images }   images lists PNG outputs (above) packed into one ICO, in order
//   copies: [{ src, out }]    files copied verbatim
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isAllowedOutput, manifestOutputs } from './check-brand.mjs';
import { launchBrowser } from './lib/browser.mjs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

/**
 * Build an ICO file embedding the given PNG buffers (PNG-in-ICO, supported since Vista).
 * @param {{ width: number, height: number, data: Buffer }[]} images
 * @returns {Buffer}
 */
export function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  const entries = Buffer.alloc(16 * images.length);
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const e = i * 16;
    entries.writeUInt8(img.width >= 256 ? 0 : img.width, e);
    entries.writeUInt8(img.height >= 256 ? 0 : img.height, e + 1);
    entries.writeUInt8(0, e + 2); // palette colors
    entries.writeUInt8(0, e + 3); // reserved
    entries.writeUInt16LE(1, e + 4); // planes
    entries.writeUInt16LE(32, e + 6); // bits per pixel
    entries.writeUInt32LE(img.data.length, e + 8);
    entries.writeUInt32LE(offset, e + 12);
    offset += img.data.length;
  });
  return Buffer.concat([header, entries, ...images.map((i) => i.data)]);
}

function svgBody(src) {
  const text = readFileSync(src, 'utf8');
  const start = text.indexOf('<svg');
  if (start < 0) throw new Error(`${src}: no <svg> element`);
  return text.slice(start);
}

function pageHtml(svg, width, height, background) {
  const bg = background ?? 'transparent';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;padding:0;background:${bg};}
body{width:${width}px;height:${height}px;overflow:hidden;}
svg{display:block;width:${width}px;height:${height}px;}
</style></head><body>${svg}</body></html>`;
}

async function rasterize(browser, spec) {
  const context = await browser.newContext({
    viewport: { width: spec.width, height: spec.height },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
  });
  try {
    // The SVGs are repository-owned; abort anything that tries to reach the network anyway.
    await context.route('**/*', (route) => route.abort());
    const page = await context.newPage();
    await page.setContent(pageHtml(svgBody(spec.src), spec.width, spec.height, spec.background), {
      waitUntil: 'load',
    });
    return await page.screenshot({
      type: 'png',
      omitBackground: spec.background === null,
      animations: 'disabled',
      clip: { x: 0, y: 0, width: spec.width, height: spec.height },
    });
  } finally {
    await context.close();
  }
}

function write(out, data) {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, data);
  console.log(`wrote ${out} (${data.length} bytes)`);
}

async function main() {
  const manifest = JSON.parse(readFileSync('brand/assets.json', 'utf8'));
  for (const out of manifestOutputs(manifest)) {
    if (!isAllowedOutput(root, out)) {
      throw new Error(`refusing to write ${out}: outside site/public/ and docs/assets/`);
    }
  }

  const rendered = new Map();
  const pngs = manifest.pngs ?? [];
  if (pngs.length > 0) {
    let browser;
    try {
      let executablePath;
      ({ browser, executablePath } = await launchBrowser());
      console.log(`browser ${browser.version()} via ${executablePath}`);
      for (const spec of pngs) {
        const data = await rasterize(browser, spec);
        rendered.set(spec.out, { width: spec.width, height: spec.height, data });
        write(spec.out, data);
      }
    } finally {
      if (browser) await browser.close();
    }
  }

  if (manifest.ico) {
    const images = manifest.ico.images.map((out) => {
      const img = rendered.get(out);
      if (!img) throw new Error(`ico image ${out} is not a manifest png`);
      return img;
    });
    write(manifest.ico.out, buildIco(images));
  }

  for (const c of manifest.copies ?? []) write(c.out, readFileSync(c.src));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then(
    () => process.exit(0),
    (err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    },
  );
}
