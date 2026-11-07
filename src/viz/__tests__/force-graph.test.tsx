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
});
