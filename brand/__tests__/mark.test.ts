// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (name: string) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

const LENGTH_ATTRS = ['cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'rx', 'x1', 'y1', 'x2', 'y2'];

/** All values of one attribute, ignoring names that merely end in it (stroke-width, cx for x). */
function attrValues(svg: string, attr: string): string[] {
  const re = new RegExp(`(?<![\\w-])${attr}="([^"]*)"`, 'g');
  return [...svg.matchAll(re)].map((m) => m[1]);
}

function polylinePoints(svg: string): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const m of svg.matchAll(/<polyline[^>]*\spoints="([^"]*)"/g)) {
    for (const pair of m[1].trim().split(/\s+/)) {
      const [x, y] = pair.split(',').map(Number);
      out.push([x, y]);
    }
  }
  return out;
}

/** Coordinates used on one axis. A rect contributes both of its edges (x and x + width). */
function axisValues(svg: string, axis: 'x' | 'y'): Set<number> {
  const set = new Set<number>();
  const centre = axis === 'x' ? 'cx' : 'cy';
  const a = axis === 'x' ? 'x1' : 'y1';
  const b = axis === 'x' ? 'x2' : 'y2';
  for (const key of [centre, a, b]) for (const v of attrValues(svg, key)) set.add(Number(v));
  for (const p of polylinePoints(svg)) set.add(axis === 'x' ? p[0] : p[1]);
  for (const m of svg.matchAll(/<rect\b[^>]*>/g)) {
    const tag = m[0];
    const origin = Number(attrValues(tag, axis)[0]);
    const extent = Number(attrValues(tag, axis === 'x' ? 'width' : 'height')[0]);
    set.add(origin);
    set.add(origin + extent);
  }
  return set;
}

const circles = (svg: string) =>
  [...svg.matchAll(/<circle\b[^>]*>/g)].map((m) => ({
    cx: Number(attrValues(m[0], 'cx')[0]),
    cy: Number(attrValues(m[0], 'cy')[0]),
    r: Number(attrValues(m[0], 'r')[0]),
  }));

describe.each(['mark.svg', 'favicon.svg'])('%s on the 64 grid', (file) => {
  const svg = read(file);

  it('has the exact 64 x 64 viewBox and no transform', () => {
    expect(svg).toContain('viewBox="0 0 64 64"');
    expect(svg).not.toMatch(/\stransform=/);
  });

  it('uses only integer coordinates in 0..64', () => {
    const values: string[] = [];
    for (const attr of LENGTH_ATTRS) values.push(...attrValues(svg, attr));
    for (const p of polylinePoints(svg)) values.push(String(p[0]), String(p[1]));
    expect(values.length).toBeGreaterThan(0);
    for (const v of values) {
      expect(v, `value ${v}`).toMatch(/^\d+$/);
      expect(Number(v)).toBeGreaterThanOrEqual(0);
      expect(Number(v)).toBeLessThanOrEqual(64);
    }
  });

  it.each(['x', 'y'] as const)('is mirror-symmetric on the %s axis', (axis) => {
    const set = axisValues(svg, axis);
    for (const v of set) expect(set.has(64 - v), `${axis}=${v} needs mirror ${64 - v}`).toBe(true);
  });
});

describe('mark.svg lattice', () => {
  const svg = read('mark.svg');

  it('has the eight outer nodes at {8,32,56}^2 minus the centre', () => {
    const expected: string[] = [];
    for (const x of [8, 32, 56]) for (const y of [8, 32, 56]) if (!(x === 32 && y === 32)) expected.push(`${x},${y}`);
    const outer = circles(svg)
      .filter((c) => c.r === 3)
      .map((c) => `${c.cx},${c.cy}`);
    expect(outer.sort()).toEqual(expected.sort());
  });

  it('has exactly one bright centre node at 32,32 with radius 7', () => {
    const centre = circles(svg).filter((c) => c.r === 7);
    expect(centre).toEqual([{ cx: 32, cy: 32, r: 7 }]);
  });

  it('keeps a uniform pitch of 24 between lattice coordinates', () => {
    for (const axis of ['x', 'y'] as const) {
      const lattice = [...axisValues(svg, axis)].sort((a, b) => a - b);
      expect(lattice).toEqual([8, 32, 56]);
      for (let i = 1; i < lattice.length; i++) expect(lattice[i] - lattice[i - 1]).toBe(24);
    }
  });

  it('rises through lattice nodes 8,56 32,32 56,8', () => {
    expect(polylinePoints(svg)).toEqual([
      [8, 56],
      [32, 32],
      [56, 8],
    ]);
  });
});

describe('favicon.svg', () => {
  const svg = read('favicon.svg');

  it('is the dedicated 16 px design', () => {
    expect(svg).toMatch(/<rect\b[^>]*\srx="12"/);
    expect(svg).toMatch(/<polyline\b[^>]*stroke-width="8"/);
    expect(circles(svg)).toEqual([{ cx: 32, cy: 32, r: 12 }]);
    expect(svg).not.toMatch(/<(filter|radialGradient|linearGradient)\b/);
  });
});
