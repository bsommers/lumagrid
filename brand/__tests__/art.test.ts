// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseTokens } from '../contrast';
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
