// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { contrastRatio, parseTokens } from '../../../brand/contrast';
import { readFileSync } from 'node:fs';
import { lumagridTheme } from '../theme/lumagridTheme';

const tokens = parseTokens(readFileSync(new URL('../../../brand/tokens.css', import.meta.url), 'utf8'));
const bg = lumagridTheme.surface.background;

function token(name: string): string {
  const v = tokens[name];
  if (v === undefined) throw new Error(`Missing token ${name}`);
  return v;
}

describe('lumagridTheme matches the brand tokens', () => {
  it('shares surface and text colors with brand/tokens.css', () => {
    const t = lumagridTheme;
    expect(t.surface.background.toLowerCase()).toBe(token('--lg-bg').toLowerCase());
    expect(t.surface.surface.toLowerCase()).toBe(token('--lg-bg-card').toLowerCase());
    expect(t.surface.border.toLowerCase()).toBe(token('--lg-border').toLowerCase());
    expect(t.text.primary.toLowerCase()).toBe(token('--lg-text').toLowerCase());
    expect(t.text.secondary.toLowerCase()).toBe(token('--lg-muted').toLowerCase());
  });

  it('starts the categorical palette with cyan, magenta and light cyan', () => {
    const first = lumagridTheme.colors.categorical.slice(0, 3).map((c) => c.toLowerCase());
    expect(first).toEqual([
      token('--lg-cyan').toLowerCase(),
      token('--lg-magenta').toLowerCase(),
      token('--lg-cyan-light').toLowerCase(),
    ]);
  });
});

describe('lumagridTheme contrast against the site background', () => {
  it('text colors reach 4.5:1', () => {
    expect(contrastRatio(lumagridTheme.text.primary, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lumagridTheme.text.secondary, bg)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(lumagridTheme.text.disabled, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it.each(lumagridTheme.colors.categorical)('categorical %s reaches 3:1', (color) => {
    expect(contrastRatio(color, bg)).toBeGreaterThanOrEqual(3);
  });

  it.each(lumagridTheme.colors.sequential)('sequential %s reaches 3:1', (color) => {
    expect(contrastRatio(color, bg)).toBeGreaterThanOrEqual(3);
  });

  it('has the palette sizes the theme contract requires', () => {
    expect(lumagridTheme.colors.categorical.length).toBeGreaterThanOrEqual(8);
    expect(lumagridTheme.colors.sequential.length).toBeGreaterThanOrEqual(5);
    expect(lumagridTheme.colors.diverging.length % 2).toBe(1);
  });
});
