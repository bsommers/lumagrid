import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string => readFileSync(join(here, '..', 'styles', name), 'utf8');
const gridCss = read('grid.css');
const baseCss = read('base.css');
const tokensCss = read('tokens.css');

/** Returns the bodies of every block that starts with the given prelude (balanced braces). */
function blocks(css: string, prelude: RegExp): string[] {
  const out: string[] = [];
  const re = new RegExp(prelude.source, 'g');
  let m: RegExpExecArray | null;
  while ((m = re.exec(css)) !== null) {
    const open = css.indexOf('{', m.index + m[0].length - 1);
    let depth = 0;
    let i = open;
    for (; i < css.length; i += 1) {
      if (css[i] === '{') depth += 1;
      if (css[i] === '}') {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    out.push(css.slice(open + 1, i));
  }
  return out;
}

describe('grid.css (D-13)', () => {
  it('disables both pseudo-element animations under prefers-reduced-motion', () => {
    const reduced = blocks(gridCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/);
    expect(reduced).toHaveLength(1);
    expect(reduced[0]).toMatch(/\.grid-bg::before/);
    expect(reduced[0]).toMatch(/\.grid-bg::after/);
    expect(reduced[0]).toMatch(/animation:\s*none/);
  });

  it('animates only transform and opacity in every keyframe block', () => {
    const keyframes = blocks(gridCss, /@keyframes\s+[\w-]+\s*\{/);
    expect(keyframes.length).toBeGreaterThanOrEqual(2);
    for (const body of keyframes) {
      const props = [...body.matchAll(/([a-z-]+)\s*:/g)].map((m) => m[1]);
      expect(props.length).toBeGreaterThan(0);
      for (const prop of props) expect(['transform', 'opacity']).toContain(prop);
    }
  });

  it('lowers the cell size at narrow viewports', () => {
    expect(gridCss).toMatch(/--cell:\s*48px/);
    const narrow = blocks(gridCss, /@media\s*\(max-width:\s*600px\)\s*\{/);
    expect(narrow).toHaveLength(1);
    expect(narrow[0]).toMatch(/--cell:\s*32px/);
  });

  it('loops by exactly one cell', () => {
    expect(gridCss).toMatch(/translateY\(var\(--cell\)\)/);
  });
});

describe('style files', () => {
  it('make no external requests', () => {
    for (const css of [gridCss, baseCss, tokensCss]) {
      expect(css).not.toMatch(/url\(\s*['"]?https?:/);
      expect(css).not.toMatch(/@import\s+url\(/);
      expect(css).not.toMatch(/https?:\/\//);
    }
  });

  it('base.css clips horizontal overflow and scrolls pre inside its box', () => {
    expect(baseCss).toMatch(/overflow-x:\s*clip/);
    expect(baseCss).toMatch(/overflow-x:\s*hidden/);
    const pre = blocks(baseCss, /(?:^|\n)pre\s*\{/);
    expect(pre.join('\n')).toMatch(/overflow-x:\s*auto/);
    expect(baseCss).toMatch(/max-width:\s*100%/);
  });

  it('tokens.css imports brand/tokens.css and defines no color', () => {
    expect(tokensCss).toMatch(/@import\s+['"][^'"]*brand\/tokens\.css['"]/);
    expect(tokensCss).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(tokensCss).not.toMatch(/rgba?\(/);
  });
});
