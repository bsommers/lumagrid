import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Repo-wide gate (T-05-04): every SVG under these roots is parsed and checked for active content.
// SVGs added by later plans are covered automatically.
const repoRoot = resolve(__dirname, '..', '..');
const ROOTS = ['brand', 'docs/assets', 'site/public'];

function collect(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collect(full));
    else if (entry.name.toLowerCase().endsWith('.svg')) out.push(full);
  }
  return out;
}

const files = ROOTS.flatMap((r) => collect(join(repoRoot, r))).map((f) => relative(repoRoot, f));

describe('svg safety', () => {
  it('finds the canonical logo sources (the suite cannot pass vacuously)', () => {
    for (const required of ['brand/mark.svg', 'brand/favicon.svg', 'brand/wordmark.svg', 'brand/lockup.svg']) {
      expect(files).toContain(required);
    }
  });

  describe.each(files)('%s', (file) => {
    const text = readFileSync(join(repoRoot, file), 'utf8');
    const doc = new DOMParser().parseFromString(text, 'image/svg+xml');

    it('parses as XML', () => {
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
    });

    it('has an svg root with an xmlns', () => {
      expect(doc.documentElement.localName).toBe('svg');
      expect(doc.documentElement.getAttribute('xmlns')).toBeTruthy();
    });

    it('has no script or foreignObject elements', () => {
      expect(doc.getElementsByTagName('script')).toHaveLength(0);
      expect(doc.getElementsByTagName('foreignObject')).toHaveLength(0);
    });

    it('has no event handlers, javascript: values or external hrefs', () => {
      for (const el of Array.from(doc.getElementsByTagName('*'))) {
        for (const attr of Array.from(el.attributes)) {
          expect(attr.name.toLowerCase().startsWith('on'), `${attr.name} on <${el.localName}>`).toBe(false);
          expect(attr.value.toLowerCase(), `${attr.name} value`).not.toContain('javascript:');
          if (attr.name === 'href' || attr.name === 'xlink:href') {
            expect(attr.value.startsWith('#'), `${attr.name}="${attr.value}"`).toBe(true);
          }
        }
      }
    });
  });
});
