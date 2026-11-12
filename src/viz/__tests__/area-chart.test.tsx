import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AreaChart } from '../area-chart.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const single: TransformedData = {
  rows: [{ day: 'Mon', value: 10 }, { day: 'Tue', value: 20 }, { day: 'Wed', value: 15 }],
  fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
};
const grouped: TransformedData = {
  rows: [
    { day: 'Mon', value: 10, region: 'East' },
    { day: 'Mon', value: 5, region: 'West' },
    { day: 'Tue', value: 12, region: 'East' },
    { day: 'Tue', value: 'x', region: 'West' },
  ],
  fields: [
    { key: 'day', type: 'string' },
    { key: 'value', type: 'number' },
    { key: 'region', type: 'string' },
  ],
};

function r(d: TransformedData, props: Partial<React.ComponentProps<typeof AreaChart>> = {}) {
  return render(<AreaChart data={d} width={400} height={200} theme={lightTheme} {...props} />);
}
const areas = (c: HTMLElement) => c.querySelectorAll('path[data-area]');

describe('AreaChart', () => {
  it('renders a filled area and line for a single series', () => {
    const { container } = r(single);
    expect(areas(container)).toHaveLength(1);
    expect(container.querySelectorAll('path[data-area-line]')).toHaveLength(1);
    expect(areas(container)[0]!.getAttribute('d')).toMatch(/Z$/);
  });

  it('renders one area per colorField series with legend', () => {
    const { container, getByLabelText } = r(grouped, { colorField: 'region' });
    expect(areas(container)).toHaveLength(2);
    expect(getByLabelText('Legend').querySelectorAll('li')).toHaveLength(2);
  });

  it('hides legend when disabled or without colorField', () => {
    expect(r(grouped, { colorField: 'region', showLegend: false }).container.querySelector('ul')).toBeNull();
    expect(r(single).container.querySelector('ul')).toBeNull();
  });

  it('stacks series so the second area has a raised baseline and larger y range', () => {
    const over = r(grouped, { colorField: 'region' }).container;
    const stack = r(grouped, { colorField: 'region', stacked: true }).container;
    expect(areas(stack)[1]!.getAttribute('d')).not.toBe(areas(over)[1]!.getAttribute('d'));
    expect(areas(stack)[0]!.getAttribute('fill-opacity')).toBe('0.8');
    expect(areas(over)[0]!.getAttribute('fill-opacity')).toBe('0.35');
    const yMax = (c: HTMLElement) => Math.max(
      ...[...c.querySelectorAll('svg text')].filter((t) => t.getAttribute('text-anchor') === 'end').map((t) => Number(t.textContent)));
    expect(yMax(stack)).toBeGreaterThanOrEqual(yMax(over));
  });

  it('uses round y ticks and keeps plot plus legend inside the given height', () => {
    const c = r(grouped, { colorField: 'region' }).container;
    const ticks = [...c.querySelectorAll('svg text')].filter((t) => t.getAttribute('text-anchor') === 'end').map((t) => Number(t.textContent));
    expect(ticks.every((t) => Number.isInteger(t * 2))).toBe(true);
    expect(Number(c.querySelector('svg')!.getAttribute('height'))).toBe(200 - 28);
    const narrow = r(grouped, { colorField: 'region', width: 120 }).container;
    expect(Number(narrow.querySelector('svg')!.getAttribute('height'))).toBeLessThan(200 - 28);
    expect((c.querySelector('ul') as HTMLElement).style.height).toBe('28px');
    expect(r(single).container.querySelector('svg')!.getAttribute('height')).toBe('200');
  });

  it('shows all x ticks when <= 6 labels and 5 when more', () => {
    const xt = (c: HTMLElement) => [...c.querySelectorAll('svg text')].filter((t) => t.getAttribute('y') === String(200 - 24 - 40 + 16));
    expect(xt(r(single).container)).toHaveLength(3);
    const many: TransformedData = {
      rows: Array.from({ length: 10 }, (_, i) => ({ day: `D${i}`, value: i })),
      fields: single.fields,
    };
    expect(xt(r(many).container)).toHaveLength(5);
    const one: TransformedData = { rows: [{ day: 'A', value: 1 }], fields: single.fields };
    expect(xt(r(one).container)).toHaveLength(1);
  });

  it('provides aria-label, legacy aliases and a hidden data table', () => {
    const { container } = r(grouped, { colorField: 'region', ariaLabel: 'Traffic', xField: 'day', yField: 'value' });
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Traffic');
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(4);
    expect(container.querySelector('table caption')?.textContent).toBe('Traffic data');
    expect(r(single).container.querySelector('svg')?.getAttribute('aria-label')).toBe('Area chart of value');
  });

  it('uses explicit role fields and default series when colorField value missing', () => {
    const d: TransformedData = { rows: [{ k: 'a', v: 1 }, { k: 'b', v: 2 }], fields: [] };
    const { container } = r(d, { labelField: 'k', valueField: 'v', colorField: 'zz' });
    expect(container.querySelector('li')?.textContent).toBe('default');
  });

  it('handles empty data', () => {
    const { container } = r({ rows: [], fields: [] });
    expect(areas(container)[0]!.getAttribute('d')).toBe('');
  });

  it('tolerates null cells and date category fields', () => {
    const d: TransformedData = {
      rows: [{ d: '2024', v: null, g: null }, { d: null, v: 3, g: null }],
      fields: [{ key: 'd', type: 'date' }, { key: 'v', type: 'number' }],
    };
    const { container } = r(d, { colorField: 'g' });
    expect(container.querySelectorAll('table tbody tr')).toHaveLength(2);
  });
});
