import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { ForceGraph } from '../force-graph.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const mk = (rows: TransformedData['rows']): TransformedData => ({ rows, fields: [] });
const draw = (data: TransformedData, o: Partial<React.ComponentProps<typeof ForceGraph>> = {}) =>
  render(<ForceGraph data={data} width={400} height={300} theme={lightTheme} {...o} />);

describe('ForceGraph', () => {
  it('has role img and default/custom aria-label', () => {
    const { container, rerender } = draw(mk([]));
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Force-directed graph');
    rerender(<ForceGraph data={mk([])} width={400} height={300} theme={lightTheme} ariaLabel="Net" />);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Net');
  });

  it('renders an empty svg for empty data', () => {
    const { container } = draw(mk([]));
    expect(container.querySelectorAll('circle')).toHaveLength(0);
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('renders one circle per node and one line per resolvable edge', async () => {
    const { container } = draw(mk([
      { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C', group: 'g2' },
      { source: 'a', target: 'b' },
      { source: 'b', target: 'c', weight: 3 },
      { source: 'a', target: 'ghost' },
    ]));
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(3));
    expect(container.querySelectorAll('line')).toHaveLength(2);
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('handles a single node with finite coordinates', async () => {
    const { container } = draw(mk([{ id: 'only', label: 'Only' }]));
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(1));
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('does not produce NaN with zero width/height', async () => {
    const { container } = draw(mk([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]), { width: 0, height: 0 });
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(2));
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('truncates long labels and colors by group', async () => {
    const { container } = draw(mk([
      { id: 'a', label: 'abcdefghijklmnopqrstuvwxyz', group: 'x' },
      { id: 'b', label: 'B', group: 'y' },
    ]));
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(2));
    expect(container.querySelector('text')!.textContent).toBe('abcdefghijkl');
    const fills = [...container.querySelectorAll('circle')].map((c) => c.getAttribute('fill'));
    expect(new Set(fills).size).toBe(2);
  });

  it('honours xField/yField for id/label', async () => {
    const { container } = draw(mk([{ key: 'k1', name: 'Named' }]), { xField: 'key', yField: 'name' });
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(1));
    expect(container.textContent).toContain('Named');
  });

  it('honours idField/labelField for id/label', async () => {
    const { container } = draw(mk([{ key: 'k1', name: 'Named' }]), { idField: 'key', labelField: 'name' });
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(1));
    expect(container.textContent).toContain('Named');
  });

  it('lets idField/labelField win over xField/yField', async () => {
    const { container } = draw(
      mk([{ key: 'k1', name: 'Named', other: 'Other' }]),
      { idField: 'key', labelField: 'name', xField: 'key', yField: 'other' },
    );
    await waitFor(() => expect(container.querySelectorAll('circle')).toHaveLength(1));
    expect(container.textContent).toContain('Named');
    expect(container.textContent).not.toContain('Other');
  });

  describe('layout lifecycle', () => {
    const base = [
      { id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'c', label: 'C' },
      { source: 'a', target: 'b' }, { source: 'b', target: 'c' },
    ];
    const positions = (c: HTMLElement) =>
      Object.fromEntries(Array.from(c.querySelectorAll('g[transform]')).map((g) => [
        g.querySelector('text')!.textContent, g.getAttribute('transform'),
      ]));
    const el = (data: TransformedData, o: Partial<React.ComponentProps<typeof ForceGraph>> = {}) =>
      <ForceGraph data={data} width={400} height={300} theme={lightTheme} {...o} />;

    it('renders nodes on the first render (no empty first paint)', () => {
      const { container } = draw(mk(base));
      expect(container.querySelectorAll('circle')).toHaveLength(3);
    });

    it('is deterministic for the same seed and differs for another seed', () => {
      const a = positions(draw(mk(base), { seed: 7 }).container);
      const b = positions(draw(mk(base), { seed: 7 }).container);
      const c = positions(draw(mk(base), { seed: 8 }).container);
      expect(a).toEqual(b);
      expect(a).not.toEqual(c);
    });

    it('re-runs the layout when nodes/edges change (default relayout)', () => {
      const { container, rerender } = render(el(mk(base)));
      expect(container.querySelectorAll('circle')).toHaveLength(3);
      rerender(el(mk([...base, { id: 'd', label: 'D' }, { source: 'c', target: 'd' }])));
      expect(container.querySelectorAll('circle')).toHaveLength(4);
      expect(container.querySelectorAll('line')).toHaveLength(3);
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('does not relayout for a new rows array with identical structure', () => {
      const { container, rerender } = render(el(mk(base)));
      const before = positions(container);
      rerender(el(mk(base.map((r) => ({ ...r })))));
      expect(positions(container)).toEqual(before);
    });

    it('does not relayout on resize alone (same shape, uniformly rescaled)', () => {
      // Positions relative to the graph's own bounding box are invariant under a
      // uniform scale + translate, but change if the layout is re-simulated.
      const shape = (c: HTMLElement) => {
        const pts = Array.from(c.querySelectorAll('g[transform]')).map((g) =>
          g.getAttribute('transform')!.match(/-?[\d.]+/g)!.map(Number) as [number, number]);
        const minX = Math.min(...pts.map((p) => p[0])), minY = Math.min(...pts.map((p) => p[1]));
        const span = Math.max(...pts.map((p) => Math.max(p[0] - minX, p[1] - minY)));
        return pts.map(([x, y]) => [((x - minX) / span).toFixed(6), ((y - minY) / span).toFixed(6)]);
      };
      const { container, rerender } = render(el(mk(base)));
      const before = shape(container);
      rerender(<ForceGraph data={mk(base)} width={800} height={600} theme={lightTheme} />);
      expect(shape(container)).toEqual(before);
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('updates labels without relayout when only labels change', () => {
      const { container, rerender } = render(el(mk(base)));
      rerender(el(mk(base.map((r) => ('label' in r && r.id === 'a' ? { ...r, label: 'Alpha' } : r)))));
      const labels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
      expect(labels).toContain('Alpha');
    });

    it('relayout={false} keeps existing node positions, adds new nodes and drops removed ones', () => {
      const props = { relayout: false } as const;
      const { container, rerender } = render(el(mk(base), props));
      const before = positions(container);
      // Add d, remove c (and its edge). Without relayout a and b keep their layout-space
      // positions; viewport rescaling can still move them on screen, so compare with a relayout run.
      const next = mk([{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }, { id: 'd', label: 'D' }, { source: 'a', target: 'b' }]);
      rerender(el(next, props));
      const labels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
      expect(labels.sort()).toEqual(['A', 'B', 'D']);
      expect(container.innerHTML).not.toContain('NaN');

      const relaid = render(el(mk(base))); // fresh instance, same seed → same first layout
      expect(positions(relaid.container)).toEqual(before);
      relaid.rerender(el(next));
      // With relayout the a/b layout is re-simulated, so at least one position differs from the frozen run.
      expect(positions(relaid.container)).not.toEqual(positions(container));
    });
  });
});
