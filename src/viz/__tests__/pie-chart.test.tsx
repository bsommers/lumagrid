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
    const { container } = draw(mk([{ name: 'a', amt: 1 }, { name: 'b', amt: 1000 }]));
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
