// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, parseTokens, relativeLuminance } from '../contrast';

const tokens = parseTokens(readFileSync(new URL('../tokens.css', import.meta.url), 'utf8'));

const REQUIRED = [
  '--lg-bg-black',
  '--lg-bg',
  '--lg-bg-card',
  '--lg-cyan',
  '--lg-cyan-light',
  '--lg-magenta',
  '--lg-text',
  '--lg-text-body',
  '--lg-muted',
  '--lg-border',
  '--lg-font-display',
  '--lg-font-body',
  '--lg-font-mono',
];
const FOREGROUNDS = ['--lg-text', '--lg-text-body', '--lg-muted', '--lg-cyan', '--lg-cyan-light', '--lg-magenta'];
const BACKGROUNDS = ['--lg-bg-black', '--lg-bg', '--lg-bg-card'];

describe('brand helper sanity', () => {
  it('returns 21 for black versus white, symmetric', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(contrastRatio('#ffffff', '#000000')).toBeCloseTo(21, 5);
    expect(relativeLuminance('#fff')).toBeCloseTo(1, 5);
  });

  it('parses custom properties and ignores comments', () => {
    expect(parseTokens('/* --x: #fff; */ :root { --a: #123456; --b : 1px ; }')).toEqual({ '--a': '#123456', '--b': '1px' });
  });
});

describe('tokens.css', () => {
  it.each(REQUIRED)('defines %s', (name) => {
    expect(tokens[name]).toBeTruthy();
  });

  it('exposes the D-07 hues exactly', () => {
    expect(tokens['--lg-cyan'].toLowerCase()).toBe('#00e5ff');
    expect(tokens['--lg-cyan-light'].toLowerCase()).toBe('#7df9ff');
    expect(tokens['--lg-magenta'].toLowerCase()).toBe('#ff2bd6');
  });

  describe.each(FOREGROUNDS)('%s', (fg) => {
    it.each(BACKGROUNDS)('is at least 4.5:1 on %s', (bg) => {
      expect(contrastRatio(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(4.5);
    });
  });

  it('keeps black button text at least 4.5:1 on cyan and magenta', () => {
    expect(contrastRatio('#000000', tokens['--lg-cyan'])).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio('#000000', tokens['--lg-magenta'])).toBeGreaterThanOrEqual(4.5);
  });

  it('documents why buttons use black text: white on magenta fails AA', () => {
    expect(contrastRatio('#ffffff', tokens['--lg-magenta'])).toBeLessThan(4.5);
  });
});
