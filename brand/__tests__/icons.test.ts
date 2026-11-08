// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without type declarations
import { checkBrand, isAllowedOutput, manifestOutputs } from '../../scripts/check-brand.mjs';

const root = new URL('../..', import.meta.url).pathname;
const check = checkBrand as (opts: { root: string }) => string[];
const allowed = isAllowedOutput as (root: string, out: string) => boolean;
const outputs = manifestOutputs as (manifest: unknown) => string[];

const manifest = JSON.parse(readFileSync(new URL('../assets.json', import.meta.url), 'utf8')) as unknown;

describe('brand assets', () => {
  it('passes the brand checker (dimensions, ICO directory)', () => {
    expect(check({ root })).toEqual([]);
  });

  it('writes nothing outside site/public/ and docs/assets/', () => {
    for (const out of outputs(manifest)) {
      expect(allowed(root, out), out).toBe(true);
    }
  });

  it('rejects paths that escape the allow-list', () => {
    expect(allowed(root, 'brand/mark.svg')).toBe(false);
    expect(allowed(root, 'site/public/../../package.json')).toBe(false);
    expect(allowed(root, '/etc/passwd')).toBe(false);
    expect(allowed(root, 'site/public')).toBe(false);
  });
});
