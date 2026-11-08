// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const wordmark = read('wordmark.svg');
const lockup = read('lockup.svg');
const FORBIDDEN = [/<text\b/, /font-family/, /<style\b/];

describe('wordmark.svg', () => {
  it('has exactly one outline path', () => {
    expect(wordmark.match(/<path\b/g)).toHaveLength(1);
  });

  it('has an integer viewBox starting at the origin', () => {
    expect(wordmark).toMatch(/viewBox="0 0 \d+ \d+"/);
  });

  it.each(FORBIDDEN)('contains no %s', (re) => {
    expect(wordmark).not.toMatch(re);
    expect(lockup).not.toMatch(re);
  });
});

describe('lockup.svg', () => {
  const d = wordmark.match(/<path\b[^>]*\sd="([^"]+)"/)?.[1];

  it('has an integer viewBox of height 64', () => {
    expect(lockup).toMatch(/viewBox="0 0 \d+ 64"/);
  });

  it('embeds the identical wordmark path data', () => {
    expect(d).toBeTruthy();
    expect(lockup).toContain(`d="${d}"`);
  });

  it("includes the mark's centre circle", () => {
    expect(lockup).toMatch(/<circle\b[^>]*cx="32"[^>]*cy="32"[^>]*r="7"/);
  });
});
