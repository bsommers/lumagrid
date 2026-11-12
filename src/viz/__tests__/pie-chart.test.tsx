import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PieChart } from '../pie-chart.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const fields: TransformedData['fields'] = [
  { key: 'name', type: 'string' },
  { key: 'amt', type: 'number' },
];
const mk = (rows: TransformedData['rows']): TransformedData => ({ rows, fields });
const draw = (data: TransformedData, o: Partial<React.ComponentProps<typeof PieChart>> = {}) =>
  render(<PieChart data={data} width={300} height={300} theme={lightTheme} {...o} />);

describe('PieChart', () => {
  it('renders one path per positive slice with percentages', () => {
    const { container } = draw(mk([{ name: 'a', amt: 1 }, { name: 'b', amt: 3 }]));
    expect(container.querySelectorAll('path')).toHaveLength(2);
    expect(container.textContent).toContain('25.0%');
    expect(container.textContent).toContain('75.0%');
  });

  it('has role img and default/custom aria-label', () => {
    const { container, rerender } = draw(mk([{ name: 'a', amt: 1 }]));
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Pie chart of amt');
    rerender(<PieChart data={mk([])} width={300} height={300} theme={lightTheme} ariaLabel="Mine" />);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Mine');
    expect(container.querySelector('svg')?.getAttribute('role')).toBe('img');
  });

  it('renders no slices for empty data without NaN', () => {
    const { container } = draw(mk([]));
    expect(container.querySelectorAll('path')).toHaveLength(0);
    expect(container.innerHTML).not.toContain('NaN');
  });

  it('drops zero, negative, NaN and Infinity values', () => {
    const { container } = draw(mk([
      { name: 'a', amt: 0 }, { name: 'b', amt: -4 }, { name: 'c', amt: 'x' },
      { name: 'd', amt: Infinity }, { name: 'e', amt: 2 },
    ]));
    expect(container.querySelectorAll('path')).toHaveLength(1);
    expect(container.innerHTML).not.toContain('NaN');
    expect(container.innerHTML).not.toContain('Infinity');
  });

  it('draws a visible arc for a single 100% slice', () => {
    const { container } = draw(mk([{ name: 'only', amt: 5 }]));
    const d = container.querySelector('path')!.getAttribute('d')!;
    const nums = d.match(/-?\d+(\.\d+)?(e-?\d+)?/g)!.map(Number);
    // start point (M x y) must differ from the arc end point
    expect(nums[0] === nums[5] && nums[1] === nums[6]).toBe(false);
    expect(container.textContent).toContain('100.0%');
  });

  it('renders the total in the center when donut', () => {
    const { container } = draw(mk([{ name: 'a', amt: 1 }, { name: 'b', amt: 2 }]), { donut: true });
    const texts = [...container.querySelectorAll('text')].map((t) => t.textContent);
    expect(texts).toContain('3');
  });

  it('hides percentage labels on tiny slices', () => {
    const { container } = draw(mk([{ name: 'a', amt: 1 }, { name: 'b', amt: 1000 }]), { showLegend: false });
    expect(container.querySelectorAll('text')).toHaveLength(1);
  });

  it('honours xField/yField', () => {
    const data: TransformedData = {
      rows: [{ k: 'x', v: 4 }, { k: 'y', v: 4 }],
      fields: [{ key: 'k', type: 'string' }, { key: 'v', type: 'number' }],
    };
    const { container } = draw(data, { xField: 'k', yField: 'v' });
    expect(container.querySelector('title')?.textContent).toContain('x: 4');
  });
});

describe('PieChart role-named fields', () => {
  const data: TransformedData = {
    rows: [
      { name: 'a', alt: 'p', amt: 1, other: 4 },
      { name: 'b', alt: 'q', amt: 1, other: 12 },
    ],
    fields: [
      { key: 'name', type: 'string' },
      { key: 'alt', type: 'string' },
      { key: 'amt', type: 'number' },
      { key: 'other', type: 'number' },
    ],
  };
  const titles = (c: HTMLElement) => [...c.querySelectorAll('title')].map((t) => t.textContent);

  it('selects columns with valueField/labelField', () => {
    const { container } = draw(data, { valueField: 'other', labelField: 'alt' });
    expect(titles(container)).toEqual(['p: 4 (25.0%)', 'q: 12 (75.0%)']);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Pie chart of other');
  });

  it('selects the same columns through the legacy yField/xField aliases', () => {
    const { container } = draw(data, { yField: 'other', xField: 'alt' });
    expect(titles(container)).toEqual(['p: 4 (25.0%)', 'q: 12 (75.0%)']);
  });

  it('lets role names win over legacy aliases', () => {
    const { container } = draw(data, {
      valueField: 'other', labelField: 'alt', yField: 'amt', xField: 'name',
    });
    expect(titles(container)).toEqual(['p: 4 (25.0%)', 'q: 12 (75.0%)']);
  });

  it('infers the first number and string columns when no field props are given', () => {
    const { container } = draw(data);
    expect(titles(container)).toEqual(['a: 1 (50.0%)', 'b: 1 (50.0%)']);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Pie chart of amt');
  });

describe('PieChart legend', () => {
  const rows = [{ k: 'p', v: 4 }, { k: 'q', v: 12 }];
  const data: TransformedData = {
    rows, fields: [{ key: 'k', type: 'string' }, { key: 'v', type: 'number' }] as TransformedData['fields'],
  };

  it('renders a legend with label, value and percent by default, and slices keep aria-labels', () => {
    const { container, getByTestId } = render(<PieChart data={data} width={400} height={300} theme={lightTheme} />);
    expect(getByTestId('pie-legend').textContent).toContain('q: 12 (75.0%)');
    expect(container.querySelector('path')!.getAttribute('aria-label')).toBe('p: 4 (25.0%)');
  });

  it('can opt out of the legend', () => {
    const { queryByTestId } = render(<PieChart data={data} width={400} height={300} theme={lightTheme} showLegend={false} />);
    expect(queryByTestId('pie-legend')).toBeNull();
  });
});
});
