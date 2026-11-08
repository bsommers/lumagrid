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

  it('covers every favicon, app icon and the web manifest', () => {
    const listed = outputs(manifest).map((out) => out.replace('site/public/', ''));
    expect(listed).toEqual(
      expect.arrayContaining([
        'favicon.svg',
        'favicon.ico',
        'favicon-16.png',
        'favicon-32.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'site.webmanifest',
      ]),
    );
  });

  it('declares the 180, 192 and 512 app icons with the declared sizes', () => {
    const sizes = Object.fromEntries(
      (manifest as { pngs: { out: string; width: number; height: number }[] }).pngs.map((p) => [
        p.out.replace('site/public/', ''),
        `${p.width}x${p.height}`,
      ]),
    );
    expect(sizes['apple-touch-icon.png']).toBe('180x180');
    expect(sizes['icon-192.png']).toBe('192x192');
    expect(sizes['icon-512.png']).toBe('512x512');
  });

  it('ships a relative-URL web manifest listing the 192 and 512 icons', () => {
    const web = JSON.parse(readFileSync(new URL('../../site/public/site.webmanifest', import.meta.url), 'utf8')) as {
      name: string;
      start_url: string;
      scope: string;
      icons: { src: string; sizes: string }[];
    };
    expect(web.name).toBe('Lumagrid');
    expect(web.start_url).toBe('./');
    expect(web.scope).toBe('./');
    expect(web.icons.map((i) => i.sizes).sort()).toEqual(['192x192', '512x512']);
    for (const icon of web.icons) expect(icon.src.startsWith('/')).toBe(false);
  });

  it('rejects paths that escape the allow-list', () => {
    expect(allowed(root, 'brand/mark.svg')).toBe(false);
    expect(allowed(root, 'site/public/../../package.json')).toBe(false);
    expect(allowed(root, '/etc/passwd')).toBe(false);
    expect(allowed(root, 'site/public')).toBe(false);
  });
});
