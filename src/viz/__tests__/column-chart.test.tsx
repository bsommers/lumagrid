import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ColumnChart } from '../column-chart.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const flat: TransformedData = {
  fields: [{ key: 'q', type: 'string' }, { key: 'v', type: 'number' }] as TransformedData['fields'],
  rows: [{ q: 'Q1', v: 10 }, { q: 'Q2', v: 25 }, { q: 'Q3', v: 40 }],
};
const multi: TransformedData = {
  fields: [{ key: 'q', type: 'string' }, { key: 's', type: 'string' }, { key: 'v', type: 'number' }] as TransformedData['fields'],
  rows: [
    { q: 'Q1', s: 'A', v: 10 }, { q: 'Q1', s: 'B', v: 5 },
    { q: 'Q2', s: 'A', v: 20 }, { q: 'Q2', s: 'B', v: -4 },
    { q: 'Q3', s: 'B', v: 7 },
  ],
};
const draw = (data: TransformedData, o: Partial<React.ComponentProps<typeof ColumnChart>> = {}) =>
  render(<ColumnChart data={data} width={500} height={300} theme={lightTheme} {...o} />);

describe('ColumnChart', () => {
  it('draws one bar per row, inferring fields, with aria labels', () => {
    const { container } = draw(flat);
    const bars = [...container.querySelectorAll('rect[aria-label]')];
    expect(bars.map((b) => b.getAttribute('aria-label'))).toEqual(['Q1: 10', 'Q2: 25', 'Q3: 40']);
    const svg = container.querySelector('svg')!;
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toContain('Column chart');
    expect(container.querySelector('[data-testid="column-chart-legend"]')).toBeNull();
  });

  it('honours explicit fields, legacy aliases and ariaLabel', () => {
    const { container } = draw(flat, { labelField: 'q', valueField: 'v', ariaLabel: 'Sales' });
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Sales');
    const legacy = draw(flat, { xField: 'q', yField: 'v' });
    expect(legacy.container.querySelectorAll('rect[aria-label]')).toHaveLength(3);
  });

  it('draws grouped series with "category, series: value" labels and a legend', () => {
    const { container } = draw(multi, { labelField: 'q', valueField: 'v', colorField: 's' });
    const labels = [...container.querySelectorAll('rect[aria-label]')].map((b) => b.getAttribute('aria-label'));
    expect(labels).toContain('Q1, A: 10');
    expect(labels).toContain('Q2, B: -4');
    expect(labels).toHaveLength(5);
    expect(container.querySelector('[data-testid="column-chart-legend"]')!.textContent).toContain('A');
    const xs = [...container.querySelectorAll('rect[aria-label]')].slice(0, 2).map((b) => b.getAttribute('x'));
    expect(xs[0]).not.toBe(xs[1]);
  });

  it('stacks series at the same x and can hide the legend', () => {
    const { container } = draw(multi, { colorField: 's', mode: 'stacked', showLegend: false, labelField: 'q', valueField: 'v' });
    const bars = [...container.querySelectorAll('rect[aria-label]')];
    expect(bars[0]!.getAttribute('x')).toBe(bars[1]!.getAttribute('x'));
    expect(container.querySelector('[data-testid="column-chart-legend"]')).toBeNull();
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('renders nice y ticks including zero', () => {
    const { container } = draw(flat);
    const ticks = [...container.querySelectorAll('[data-testid="column-chart-tick"] text')].map((t) => t.textContent);
    expect(ticks).toContain('0');
    expect(ticks).toContain('40');
  });

  it('shows value labels only when asked', () => {
    expect(draw(flat).container.querySelectorAll('text').length)
      .toBeLessThan(draw(flat, { showValues: true }).container.querySelectorAll('text').length);
  });

  it('picks contrast-safe value text for hex, rgb() and unparseable fills', () => {
    const withFill = (fill: string) => {
      const t = { ...lightTheme, colors: { ...lightTheme.colors, categorical: [fill] } };
      const { container } = render(<ColumnChart data={flat} width={500} height={300} theme={t} showValues />);
      const texts = [...container.querySelectorAll('text')].filter((x) => x.getAttribute('pointer-events') === 'none');
      return texts[texts.length - 1]!.getAttribute('fill');
    };
    expect(withFill('#000000')).toBe(lightTheme.text.inverse);
    expect(withFill('#ffffff')).toBe(lightTheme.text.primary);
    expect(withFill('rgb(0, 0, 0)')).toBe(lightTheme.text.inverse);
    expect(withFill('rgb(250,250,250)')).toBe(lightTheme.text.primary);
    expect(withFill('rebeccapurple')).toBeTruthy();
  });

  it('truncates long labels and handles empty, zero and non-finite data', () => {
    const long: TransformedData = { ...flat, rows: [{ q: 'A very long category name', v: 3 }, { q: 'x', v: NaN }] };
    expect(draw(long, { colorField: 'q' }).container.textContent).toContain('…');
    const empty = draw({ ...flat, rows: [] });
    expect(empty.container.querySelectorAll('rect[aria-label]')).toHaveLength(0);
    const zeros = draw({ ...flat, rows: [{ q: 'a', v: 0 }, { q: 'b' }] });
    expect(zeros.container.innerHTML).not.toContain('NaN');
    const bare = draw({ rows: [{ a: 1 }], fields: [] });
    expect(bare.container.querySelector('svg')).not.toBeNull();
    const small = draw(flat, { width: 10, height: 10 });
    expect(small.container.innerHTML).not.toContain('NaN');
  });
});
