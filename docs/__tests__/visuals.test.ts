// @vitest-environment node
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without type declarations
import { checkVisuals } from '../../scripts/check-visuals.mjs';

const root = new URL('../..', import.meta.url).pathname;
const check = checkVisuals as (opts: { root: string; only?: string }) => string[];
const dir = join(root, 'docs/assets/charts');

describe('committed chart images', () => {
  it('pass the visuals checker (sizes, signatures, SVG shape, no stray files)', () => {
    expect(check({ root })).toEqual([]);
  });

  it('hold exactly 22 PNG and 18 SVG files', () => {
    const files = readdirSync(dir);
    expect(files.filter((f) => f.endsWith('.png'))).toHaveLength(22);
    expect(files.filter((f) => f.endsWith('.svg'))).toHaveLength(18);
  });

  it('reports a problem for a selector with a missing file (the checker is not vacuous)', () => {
    expect(check({ root: join(root, 'docs'), only: 'bar:dark' }).length).toBeGreaterThan(0);
  });
});
