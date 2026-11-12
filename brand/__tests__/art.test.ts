// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseTokens } from '../contrast';
import * as plugins from '../../src/viz/plugins';
// @ts-expect-error plain ESM script without type declarations
import { composeArt } from '../../scripts/brand/compose.mjs';

const root = new URL('../..', import.meta.url).pathname;
const read = (rel: string) => readFileSync(`${root}${rel}`, 'utf8');

const compose = composeArt as (file: string) => string;
const tokens = parseTokens(read('brand/tokens.css'));
const PALETTE = new Set(
  Object.values(tokens)
    .filter((v) => /^#[0-9a-fA-F]{6}$/.test(v))
    .map((v) => v.toUpperCase()),
);
const FORBIDDEN = [/<text\b/, /font-family/, /<style\b/, /<script\b/, /<foreignObject\b/];
const wordmarkD = read('brand/wordmark.svg').match(/<path\b[^>]*\sd="([^"]+)"/)?.[1] ?? '';
const TAGLINE_FILL = '#9AA4B2';
const BACKGROUND = '#05070A';

const ART = [
  { file: 'brand/social.svg', viewBox: '0 0 1280 640' },
  { file: 'brand/og.svg', viewBox: '0 0 1200 630' },
  { file: 'brand/banner.svg', viewBox: '0 0 1280 320' },
];

function colors(svg: string): string[] {
  return Array.from(svg.matchAll(/#[0-9a-fA-F]{6}\b/g), (m) => m[0].toUpperCase());
}

describe('brand tokens', () => {
  it('exposes a non-empty palette', () => {
    expect(wordmarkD.length).toBeGreaterThan(100);
    expect(PALETTE.has('#00E5FF')).toBe(true);
  });
});

describe.each(ART)('$file', ({ file, viewBox }) => {
  const svg = read(file);

  it('has the integer viewBox', () => {
    expect(svg).toContain(`viewBox="${viewBox}"`);
  });

  it('embeds the canonical wordmark path and exactly one tagline path', () => {
    expect(svg).toContain(`d="${wordmarkD}"`);
    expect(svg.match(/<path\b/g)).toHaveLength(2);
    expect(svg.match(/<path id="lg-tagline"/g)).toHaveLength(1);
  });

  it.each(FORBIDDEN)('contains no %s', (re) => {
    expect(svg).not.toMatch(re);
  });

  it('contains no NaN or Infinity in any coordinate', () => {
    expect(svg).not.toMatch(/NaN|Infinity/);
  });

  it('uses only D-07 palette colors', () => {
    for (const c of colors(svg)) expect(PALETTE.has(c), `${c} is not in the palette`).toBe(true);
  });

  it('keeps the tagline fill at 4.5:1 or better on the background', () => {
    expect(svg).toContain(`<path id="lg-tagline" fill="${TAGLINE_FILL}"`);
    expect(contrastRatio(TAGLINE_FILL, BACKGROUND)).toBeGreaterThanOrEqual(4.5);
  });

  // The composer reads brand/tagline.txt and outlines it, so equality also proves the outlined
  // tagline matches the single-source text.
  it('is exactly what the composer produces from the current sources', () => {
    expect(svg).toBe(compose(file));
  });

  it('keeps grid line opacity within 0.12 and 0.35', () => {
    for (const m of svg.matchAll(/<line\b[^>]*stroke-opacity="([\d.]+)"/g)) {
      const v = Number(m[1]);
      expect(v).toBeGreaterThanOrEqual(0.12);
      expect(v).toBeLessThanOrEqual(0.35);
    }
  });
});

// Chart-type icons: one 64 x 64 neon icon per native chart plugin (D-09).
const pluginIds = Object.values(plugins)
  .map((p) => (p as { id: string }).id)
  .sort();
const iconFiles = readdirSync(`${root}brand/icons`)
  .filter((f) => /^chart-.*\.svg$/.test(f))
  .sort();
const GEOMETRY_ATTRS = ['x', 'y', 'cx', 'cy', 'r', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'rx', 'ry', 'points', 'd'];

describe('chart icons', () => {
  it('has exactly one icon per native chart plugin id', () => {
    expect(pluginIds).toHaveLength(11);
    expect(iconFiles).toEqual(pluginIds.map((id) => `chart-${id}.svg`).sort());
  });

  describe.each(iconFiles)('%s', (name) => {
    const svg = read(`brand/icons/${name}`);
    const body = svg.slice(svg.indexOf('>') + 1);

    it('has the 64 x 64 viewBox, a title and no transform', () => {
      expect(svg).toContain('viewBox="0 0 64 64"');
      expect(svg).toContain('<title>');
      expect(svg).not.toMatch(/\stransform=/);
    });

    it.each(FORBIDDEN)('contains no %s', (re) => {
      expect(svg).not.toMatch(re);
    });

    it('uses only D-07 palette colors', () => {
      for (const c of colors(svg)) expect(PALETTE.has(c), `${c} is not in the palette`).toBe(true);
    });

    it('keeps every geometry coordinate an integer within 0 to 64', () => {
      let checked = 0;
      for (const tag of body.matchAll(/<(?!\/)[^>]*>/g)) {
        for (const attr of GEOMETRY_ATTRS) {
          const value = new RegExp(`\\s${attr}="([^"]*)"`).exec(tag[0])?.[1];
          if (value === undefined) continue;
          for (const num of value.match(/-?\d+(?:\.\d+)?/g) ?? []) {
            checked += 1;
            expect(Number.isInteger(Number(num)), `${attr}="${value}"`).toBe(true);
            expect(Number(num)).toBeGreaterThanOrEqual(0);
            expect(Number(num)).toBeLessThanOrEqual(64);
          }
        }
      }
      expect(checked).toBeGreaterThan(8);
    });

    it('has at most one magenta element', () => {
      const magenta = Array.from(body.matchAll(/<(?!\/)[^>]*#FF2BD6[^>]*>/gi));
      expect(magenta.length).toBeLessThanOrEqual(1);
    });
  });
});
