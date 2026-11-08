// Deterministic composer for the Lumagrid brand art (D-09): social card, Open Graph image and
// README hero banner. Reuses the outlined wordmark/lockup from brand/lockup.svg verbatim and
// outlines the tagline from brand/tagline.txt with Orbitron (D-06, D-08), so the art contains no
// text elements, font declarations or style elements and rasterizes identically on any machine.
// Colors come only from the D-07 palette. No timestamps, no random ids: running it twice yields
// byte-identical files. Orbitron is OFL-1.1; see NOTICE. Run it with `npm run brand`.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import opentype from 'opentype.js';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const at = (p) => resolve(root, p);

const FONT_FILE = 'node_modules/@fontsource/orbitron/files/orbitron-latin-500-normal.woff';
const BG_TOP = '#000000';
const BG_BOTTOM = '#05070A';
const CYAN = '#00E5FF';
const TAGLINE_FILL = '#9AA4B2';
const LETTER_SPACING = 0.06;

/** Round to two decimals and drop trailing zeros so coordinates stay short and stable. */
const n = (v) => String(Number(v.toFixed(2)));

/** The shared lockup: its inner markup (defs, mark group, wordmark group) and pixel size. */
function loadLockup() {
  const svg = readFileSync(at('brand/lockup.svg'), 'utf8');
  const size = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  if (!size) throw new Error('brand/lockup.svg: no integer viewBox');
  const body = svg.slice(svg.indexOf('</title>') + '</title>'.length, svg.lastIndexOf('</svg>')).trim();
  return { body, width: Number(size[1]), height: Number(size[2]) };
}

/** The tagline text, single-sourced from brand/tagline.txt. */
export function readTagline() {
  return readFileSync(at('brand/tagline.txt'), 'utf8').trim();
}

let cachedFont;
function loadFont() {
  if (!cachedFont) {
    const buf = readFileSync(at(FONT_FILE));
    cachedFont = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  }
  return cachedFont;
}

/**
 * Outline the tagline at the given font size with its top-left ink corner at (x, y).
 * @returns {{ d: string, width: number, height: number }}
 */
export function outlineTagline(text, size, x, y) {
  const font = loadFont();
  const options = { letterSpacing: LETTER_SPACING };
  const box = font.getPath(text, 0, 0, size, options).getBoundingBox();
  const d = font.getPath(text, x - box.x1, y - box.y1, size, options).toPathData(2);
  return { d, width: box.x2 - box.x1, height: box.y2 - box.y1 };
}

/**
 * Perspective neon grid: lines radiating from the vanishing point down to the bottom edge, and
 * horizontal lines whose gaps grow toward the bottom. Opacity stays between 0.12 and 0.35.
 */
function perspectiveGrid({ width, height, horizonY, vpX, spokeGap, rows }) {
  const out = [];
  const depth = height - horizonY;
  // Horizontal lines: quadratic spacing gives increasing gaps toward the viewer.
  for (let j = 1; j <= rows; j += 1) {
    const t = j / rows;
    const y = horizonY + depth * t * t;
    const opacity = 0.12 + 0.2 * t;
    out.push(`<line x1="0" y1="${n(y)}" x2="${width}" y2="${n(y)}" stroke-opacity="${n(opacity)}"/>`);
  }
  // Radiating lines: even spacing along the bottom edge, extended past both sides.
  const spokes = Math.ceil((width * 1.5) / spokeGap);
  for (let k = -spokes; k <= spokes; k += 1) {
    const x2 = vpX + k * spokeGap;
    out.push(`<line x1="${n(vpX)}" y1="${n(horizonY)}" x2="${n(x2)}" y2="${height}" stroke-opacity="0.22"/>`);
  }
  out.push(`<line x1="0" y1="${n(horizonY)}" x2="${width}" y2="${n(horizonY)}" stroke-opacity="0.35"/>`);
  return `<g stroke="${CYAN}" stroke-width="1" fill="none">\n    ${out.join('\n    ')}\n  </g>`;
}

/** Build one art SVG from a layout description. */
function compose(layout) {
  const { width, height, title, desc } = layout;
  const lockup = loadLockup();
  const tagline = readTagline();
  const lockupW = lockup.width * layout.lockupScale;
  const lockupX = layout.lockupX ?? (width - lockupW) / 2;
  const lockupH = lockup.height * layout.lockupScale;
  const taglineY = layout.lockupY + lockupH + layout.taglineGap;
  const taglineProbe = outlineTagline(tagline, layout.taglineSize, 0, 0);
  const taglineX = layout.lockupX ?? (width - taglineProbe.width) / 2;
  const tag = outlineTagline(tagline, layout.taglineSize, n(taglineX) * 1, n(taglineY) * 1);

  const grid = perspectiveGrid(layout);
  const gridMarkup = layout.fadeLeft
    ? `<g mask="url(#lg-art-fade-mask)">\n  ${grid.replace(/\n/g, '\n  ')}\n  </g>`
    : grid;
  const fadeDefs = layout.fadeLeft
    ? `
    <linearGradient id="lg-art-fade" gradientUnits="userSpaceOnUse" x1="${n(layout.fadeLeft[0])}" y1="0" x2="${n(layout.fadeLeft[1])}" y2="0">
      <stop offset="0" stop-color="#E6EDF3" stop-opacity="0"/>
      <stop offset="1" stop-color="#E6EDF3" stop-opacity="1"/>
    </linearGradient>
    <mask id="lg-art-fade-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}">
      <rect width="${width}" height="${height}" fill="url(#lg-art-fade)"/>
    </mask>`
    : '';
  const glowRx = layout.glowRx;
  const glowRy = layout.glowRy;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <!-- Generated by scripts/brand/compose.mjs from brand/lockup.svg, brand/tagline.txt and Orbitron 500 (OFL-1.1). Do not edit by hand. -->
  <title>${title}</title>
  <desc>${desc}</desc>
  <defs>
    <linearGradient id="lg-art-bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${BG_TOP}"/>
      <stop offset="1" stop-color="${BG_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="lg-art-glow" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${CYAN}" stop-opacity="0.35"/>
      <stop offset="1" stop-color="${CYAN}" stop-opacity="0"/>
    </radialGradient>${fadeDefs}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#lg-art-bg)"/>
  <ellipse cx="${n(layout.vpX)}" cy="${n(layout.horizonY)}" rx="${glowRx}" ry="${glowRy}" fill="url(#lg-art-glow)"/>
  ${gridMarkup}
  <g transform="translate(${n(lockupX)} ${n(layout.lockupY)}) scale(${layout.lockupScale})">
    ${lockup.body.replace(/\n/g, '\n    ')}
  </g>
  <path id="lg-tagline" fill="${TAGLINE_FILL}" d="${tag.d}"/>
</svg>
`;
}

const DESC = 'Lumagrid lockup with the tagline over a neon perspective grid on a black background.';

/** Layout table: one entry per composed art file. */
export const ART = {
  'brand/social.svg': {
    width: 1280,
    height: 640,
    title: 'Lumagrid social preview',
    desc: DESC,
    horizonY: 352,
    vpX: 640,
    spokeGap: 80,
    rows: 9,
    glowRx: 560,
    glowRy: 150,
    lockupScale: 2.6,
    lockupY: 96,
    taglineSize: 28,
    taglineGap: 40,
  },
  'brand/og.svg': {
    width: 1200,
    height: 630,
    title: 'Lumagrid Open Graph image',
    desc: DESC,
    horizonY: 366,
    vpX: 600,
    spokeGap: 80,
    rows: 9,
    glowRx: 520,
    glowRy: 150,
    lockupScale: 2.2,
    lockupY: 120,
    taglineSize: 24,
    taglineGap: 36,
  },
  'brand/banner.svg': {
    width: 1280,
    height: 320,
    title: 'Lumagrid README banner',
    desc: DESC,
    horizonY: 120,
    vpX: 880,
    spokeGap: 64,
    rows: 8,
    glowRx: 520,
    glowRy: 110,
    lockupScale: 1.5,
    lockupX: 64,
    lockupY: 84,
    taglineSize: 18,
    taglineGap: 24,
    fadeLeft: [300, 760],
  },
};

/** Compose one art file by repo-relative path and return its SVG text. */
export function composeArt(file) {
  const layout = ART[file];
  if (!layout) throw new Error(`unknown art file ${file}`);
  return compose(layout);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  for (const file of Object.keys(ART)) {
    const svg = composeArt(file);
    writeFileSync(at(file), svg);
    console.log(`wrote ${file} (${svg.length} bytes)`);
  }
}
