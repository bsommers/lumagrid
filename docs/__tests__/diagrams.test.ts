import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Guards the hand-tuned neon diagrams under docs/assets/diagrams: structure, accessibility,
// palette (D-07) and the absence of active content. Dropping a new SVG in the folder is covered
// automatically.
const repoRoot = resolve(__dirname, '..', '..');
const diagramsDir = join(repoRoot, 'docs', 'assets', 'diagrams');

const PALETTE = new Set(
  ['#000000', '#05070A', '#0B0F14', '#00E5FF', '#7DF9FF', '#FF2BD6', '#E6EDF3', '#C9D1D9', '#9AA4B2', '#1F2A37'].map((c) =>
    c.toLowerCase(),
  ),
);

const files = existsSync(diagramsDir)
  ? readdirSync(diagramsDir).filter((f) => f.toLowerCase().endsWith('.svg')).sort()
  : [];

function parse(file: string): { text: string; doc: Document } {
  const text = readFileSync(join(diagramsDir, file), 'utf8');
  return { text, doc: new DOMParser().parseFromString(text, 'image/svg+xml') };
}

describe('docs diagrams', () => {
  it('finds the diagrams (the suite cannot pass vacuously)', () => {
    expect(files.length).toBeGreaterThan(0);
    expect(files).toContain('pipeline.svg');
  });

  describe.each(files)('%s', (file) => {
    const { text, doc } = parse(file);
    const root = doc.documentElement;

    it('parses as XML with an svg root and xmlns', () => {
      expect(doc.getElementsByTagName('parsererror')).toHaveLength(0);
      expect(root.localName).toBe('svg');
      expect(root.getAttribute('xmlns')).toBe('http://www.w3.org/2000/svg');
    });

    it('has an integer four-number viewBox', () => {
      const parts = (root.getAttribute('viewBox') ?? '').trim().split(/\s+/);
      expect(parts).toHaveLength(4);
      for (const p of parts) expect(p).toMatch(/^\d+$/);
    });

    it('is accessible: role img, non-empty title and desc', () => {
      expect(root.getAttribute('role')).toBe('img');
      const title = doc.getElementsByTagName('title')[0];
      const desc = doc.getElementsByTagName('desc')[0];
      expect((title?.textContent ?? '').trim()).not.toBe('');
      expect((desc?.textContent ?? '').trim()).not.toBe('');
    });

    it('has no active content', () => {
      expect(doc.getElementsByTagName('script')).toHaveLength(0);
      expect(doc.getElementsByTagName('foreignObject')).toHaveLength(0);
      for (const el of Array.from(doc.getElementsByTagName('*'))) {
        for (const attr of Array.from(el.attributes)) {
          expect(attr.name.toLowerCase().startsWith('on'), `${attr.name} on <${el.localName}>`).toBe(false);
          expect(attr.value.toLowerCase()).not.toContain('javascript:');
          if (attr.name === 'href' || attr.name === 'xlink:href') {
            expect(attr.value.startsWith('#'), `${attr.name}="${attr.value}"`).toBe(true);
          }
        }
      }
    });

    it('uses only palette colors', () => {
      const used = text.match(/#[0-9a-fA-F]{6}\b/g) ?? [];
      expect(used.length).toBeGreaterThan(0);
      const stray = [...new Set(used.map((c) => c.toLowerCase()))].filter((c) => !PALETTE.has(c));
      expect(stray).toEqual([]);
    });
  });

  describe('pipeline.svg labels', () => {
    const labels = Array.from(parse('pipeline.svg').doc.getElementsByTagName('text'))
      .map((t) => t.textContent ?? '')
      .join(' ')
      .toLowerCase();

    it.each(['transforms', 'registry', 'renderers', 'theme'])('shows a "%s" label', (word) => {
      expect(labels).toContain(word);
    });
  });

  describe('plugin-architecture.svg labels', () => {
    const present = files.includes('plugin-architecture.svg');
    it.skipIf(!present)('shows the plugin contract and its sources', () => {
      const labels = Array.from(parse('plugin-architecture.svg').doc.getElementsByTagName('text'))
        .map((t) => t.textContent ?? '')
        .join(' ');
      for (const word of [
        'ChartPlugin',
        'dataAdapter',
        'themeAdapter',
        'Renderer',
        'getPlugin',
        'registerPlugin',
        'WidgetContainer',
        'ViewSwitcher',
        'createNativePlugin',
        'createD3Plugin',
        'createRechartsPlugin',
        'createNivoPlugin',
      ]) {
        expect(labels).toContain(word);
      }
    });
  });
});
