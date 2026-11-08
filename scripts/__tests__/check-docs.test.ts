import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
// @ts-expect-error plain ESM script without type declarations
import { checkDocs } from '../check-docs.mjs';

const check = checkDocs as (opts: { root: string; files: string[]; only?: string[] }) => string[];

// The stale names are assembled at run time so this file stays free of literals.
const STALE = ['viz', 'box'].join('');

let sandbox = '';
let root = '';

function put(rel: string, content: string): void {
  const abs = path.join(root, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}

const SNIPPET_SOURCE = [
  "import { x } from 'lumagrid';",
  '',
  '// #region basic',
  'export const a = 1;',
  'export const b = 2;',
  '// #endregion',
  '',
].join('\n');

beforeEach(() => {
  sandbox = mkdtempSync(path.join(tmpdir(), 'check-docs-'));
  root = path.join(sandbox, 'repo');
  mkdirSync(root);
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('checkDocs', () => {
  it('reports one error of each kind for a bad fixture', () => {
    put('docs/guide/snippets/demo.tsx', SNIPPET_SOURCE);
    put('docs/exists.md', '# exists\n');
    put(
      'docs/bad.md',
      [
        '# Bad',
        '',
        '[broken](./nope.md)',
        '[traversal](../../../outside.md)',
        '![remote](https://example.com/pic.png)',
        `The ${STALE} package.`,
        '',
        '<!-- snippet: demo#basic -->',
        '',
        '```tsx',
        'export const a = 1;',
        'export const b = 3;',
        '```',
        '',
      ].join('\n'),
    );
    const errors = check({ root, files: ['docs/bad.md', 'docs/exists.md', 'docs/guide/snippets/demo.tsx'] });
    const kinds = (kind: string) => errors.filter((e) => e.startsWith(`[${kind}]`));
    expect(kinds('links').filter((e) => e.includes('missing target'))).toHaveLength(1);
    expect(kinds('links').filter((e) => e.includes('escapes'))).toHaveLength(1);
    expect(kinds('names')).toHaveLength(1);
    expect(kinds('snippets')).toHaveLength(1);
    expect(kinds('images')).toHaveLength(1);
    expect(errors).toHaveLength(5);
  });

  it('reports no error for a clean fixture', () => {
    put('docs/guide/snippets/demo.tsx', SNIPPET_SOURCE);
    put('docs/other.md', '# other\n');
    put('docs/assets/pic.svg', '<svg xmlns="http://www.w3.org/2000/svg"></svg>\n');
    put(
      'docs/good.md',
      [
        '# Good',
        '',
        '[other](./other.md#top) [site](https://example.com) [mail](mailto:a@b.c) [here](#good)',
        '![pic](./assets/pic.svg)',
        '',
        '```bash',
        'npm install [not-a-link](./missing.md)',
        '```',
        '',
      ].join('\n'),
    );
    put(
      'docs/guide/page.md',
      [
        '# Page',
        '',
        '<!-- snippet: demo#basic -->',
        '',
        '```tsx',
        'export const a = 1;   ',
        'export const b = 2;',
        '```',
        '',
        '```bash',
        'npm install lumagrid',
        '```',
        '',
      ].join('\n'),
    );
    const files = ['docs/good.md', 'docs/other.md', 'docs/guide/page.md', 'docs/guide/snippets/demo.tsx', 'docs/assets/pic.svg'];
    expect(check({ root, files })).toEqual([]);
  });

  it('restricts the checks run with only', () => {
    put('docs/bad.md', `# Bad\n\n[broken](./nope.md)\nThe ${STALE} package.\n`);
    const files = ['docs/bad.md'];
    const names = check({ root, files, only: ['names'] });
    expect(names).toHaveLength(1);
    expect(names[0]).toMatch(/^\[names\]/);
    const links = check({ root, files, only: ['links'] });
    expect(links).toHaveLength(1);
    expect(links[0]).toMatch(/^\[links\]/);
    expect(check({ root, files, only: ['images', 'snippets', 'historical'] })).toEqual([]);
  });

  it('rejects an unknown check name', () => {
    expect(() => check({ root, files: [], only: ['bogus'] })).toThrow(/unknown check/);
  });

  it('allows the stale name in allowlisted historical paths', () => {
    put('REBUILD.md', `Historical document\n\n${STALE}\n`);
    put('.planning/notes.md', `${STALE}\n`);
    expect(check({ root, files: ['REBUILD.md', '.planning/notes.md'], only: ['names'] })).toEqual([]);
  });

  it('requires the historical note within the first three lines', () => {
    put('REBUILD.md', '# Rebuild\n\nno note here\nHistorical document\n');
    put('plans/vizbox.md', 'Historical document\n\n# plan\n');
    const errors = check({ root, files: ['REBUILD.md', 'plans/vizbox.md'], only: ['historical'] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/^\[historical\] REBUILD\.md/);
  });

  it('flags a missing region, a missing snippet file and an unmarked code block in guide pages', () => {
    put('docs/guide/snippets/demo.tsx', SNIPPET_SOURCE);
    put(
      'docs/guide/page.md',
      [
        '<!-- snippet: demo#absent -->',
        '```tsx',
        'x',
        '```',
        '<!-- snippet: ghost#basic -->',
        '```tsx',
        'x',
        '```',
        '```ts',
        'handWritten();',
        '```',
        '',
      ].join('\n'),
    );
    const errors = check({ root, files: ['docs/guide/page.md', 'docs/guide/snippets/demo.tsx'], only: ['snippets'] });
    expect(errors).toHaveLength(3);
    expect(errors[0]).toMatch(/region "absent" not found/);
    expect(errors[1]).toMatch(/not found/);
    expect(errors[2]).toMatch(/no snippet marker/);
  });

  it('flags root-relative links', () => {
    put('docs/a.md', '[abs](/etc/passwd)\n');
    const errors = check({ root, files: ['docs/a.md'], only: ['links'] });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toMatch(/root-relative/);
  });
});
