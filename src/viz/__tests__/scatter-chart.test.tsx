import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { ScatterChart } from '../scatter-chart.js';
import { lightTheme } from '../../theme/light.js';
import { categoricalColor } from '../../theme/color-scale.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  rows: [
    { a: 1, b: 10, g: 'X', s: 5 },
    { a: 2, b: 25, g: 'Y', s: 50 },
    { a: 3, b: 18, g: 'X' },
    { a: 'bad', b: 1, g: 'X' },
  ],
  fields: [
    { key: 'a', type: 'number' },
    { key: 'b', type: 'number' },
    { key: 'g', type: 'string' },
    { key: 's', type: 'number' },
  ],
};

function r(props: Partial<React.ComponentProps<typeof ScatterChart>> = {}, d = data) {
  return render(<ScatterChart data={d} width={400} height={240} theme={lightTheme} {...props} />);
}

describe('ScatterChart', () => {
  it('infers fields and skips non-finite points', () => {
    const { container } = r();
    expect(container.querySelectorAll('[data-scatter-point]')).toHaveLength(3);
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Scatter chart of b by a');
  });

  it('uses explicit fields, legacy aliases and ariaLabel', () => {
    const { container } = r({ xValueField: 'b', valueField: 'a', ariaLabel: 'Custom' });
    expect(container.querySelector('svg')?.getAttribute('aria-label')).toBe('Custom');
    const { container: c2 } = r({ xField: 'a', yField: 'b' });
    expect(c2.querySelectorAll('[data-scatter-point]')).toHaveLength(3);
  });

  it('colors by series and renders legend, hidden when disabled', () => {
    const { container, getByLabelText, rerender } = r({ colorField: 'g' });
    expect(getByLabelText('Legend').querySelectorAll('li')).toHaveLength(2);
    expect(container.querySelectorAll('circle')[0]?.getAttribute('fill')).toBe(categoricalColor(lightTheme, 0));
    rerender(<ScatterChart data={data} width={400} height={240} theme={lightTheme} colorField="g" showLegend={false} />);
    expect(container.querySelector('ul')).toBeNull();
  });

  it('has no legend without colorField and uses default series for missing values', () => {
    const { container } = r();
    expect(container.querySelector('ul')).toBeNull();
    const d2: TransformedData = { ...data, rows: [{ a: 1, b: 2 }, { a: 2, b: 3 }] };
    expect(r({ colorField: 'g' }, d2).container.querySelector('li')?.textContent).toBe('default');
  });

  it('maps sizeField to radius', () => {
    const { container } = r({ sizeField: 's' });
    const radii = [...container.querySelectorAll('[data-scatter-point] > circle')].map((c) => Number(c.getAttribute('r')));
    expect(radii[0]).toBeLessThan(radii[1]!);
    expect(radii[2]).toBe(5);
    const same: TransformedData = { ...data, rows: [{ a: 1, b: 2, s: 3 }, { a: 2, b: 3, s: 3 }] };
    const rr = [...r({ sizeField: 's' }, same).container.querySelectorAll('[data-scatter-point] > circle')];
    expect(rr[0]?.getAttribute('r')).toBe('8');
  });

  it('gives each point an aria-label and a hidden data table', () => {
    const { container } = r({ colorField: 'g', sizeField: 's' });
    const labels = [...container.querySelectorAll('[data-scatter-point]')].map((p) => p.getAttribute('aria-label'));
    expect(labels[0]).toBe('X, 1, 10');
    const rows = container.querySelectorAll('table tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[2]!.textContent).toContain('n/a');
    expect(container.querySelector('table caption')?.textContent).toContain('data');
  });

  it('omits size column without sizeField', () => {
    const { container } = r();
    expect(container.querySelectorAll('table th')).toHaveLength(3);
  });

  it('points are focusable and show a focus ring on focus', () => {
    const { container } = r();
    const p = container.querySelector('[data-scatter-point]') as SVGGElement;
    expect(p.getAttribute('tabindex')).toBe('0');
    expect(container.querySelector('[data-focus-ring]')).toBeNull();
    fireEvent.focus(p);
    expect(container.querySelector('[data-focus-ring]')).not.toBeNull();
    fireEvent.blur(p);
    expect(container.querySelector('[data-focus-ring]')).toBeNull();
  });

  it('calls onSelect on click, Enter and Space only', () => {
    const onSelect = vi.fn();
    const { container } = r({ onSelect });
    const p = container.querySelector('[data-scatter-point]') as SVGGElement;
    fireEvent.click(p);
    fireEvent.keyDown(p, { key: 'Enter' });
    fireEvent.keyDown(p, { key: ' ' });
    fireEvent.keyDown(p, { key: 'a' });
    expect(onSelect).toHaveBeenCalledTimes(3);
    expect(onSelect).toHaveBeenCalledWith(data.rows[0]);
  });

  it('does not throw without onSelect', () => {
    const { container } = r();
    const p = container.querySelector('[data-scatter-point]') as SVGGElement;
    fireEvent.click(p);
    fireEvent.keyDown(p, { key: 'Enter' });
  });

  it('renders axes with nice ticks and handles empty and degenerate data', () => {
    const { container } = r();
    const texts = [...container.querySelectorAll('svg text')].map((t) => t.textContent);
    expect(texts).toContain('0');
    expect(texts).toContain('30');
    const empty = r({}, { rows: [], fields: [] });
    expect(empty.container.querySelectorAll('[data-scatter-point]')).toHaveLength(0);
    const same: TransformedData = { ...data, rows: [{ a: 5, b: 5 }] };
    expect(r({}, same).container.querySelectorAll('[data-scatter-point]')).toHaveLength(1);
    const neg: TransformedData = { ...data, rows: [{ a: -3, b: 0.4 }, { a: -1, b: 0.9 }] };
    expect(r({}, neg).container.querySelectorAll('[data-scatter-point]')).toHaveLength(2);
  });
});
