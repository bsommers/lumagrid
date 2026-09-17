import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HorizontalBarChart } from '../horizontal-bar-chart.js';
import { lightTheme } from '../../theme/light.js';
import { categoricalColor } from '../../theme/color-scale.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  rows: [
    { region: 'North', sales: 50 },
    { region: 'South', sales: 100 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
};

function renderChart(overrides: Partial<React.ComponentProps<typeof HorizontalBarChart>> = {}) {
  return render(
    <HorizontalBarChart data={data} width={400} height={200} theme={lightTheme} {...overrides} />,
  );
}

describe('HorizontalBarChart', () => {
  it('renders one bar per row, auto-detecting the numeric and label fields', () => {
    const { container } = renderChart();
    const rects = container.querySelectorAll('rect');
    expect(rects).toHaveLength(2);
  });

  it('scales the largest bar to the full inner width', () => {
    const { container } = renderChart();
    const rects = Array.from(container.querySelectorAll('rect'));
    const innerW = 400 - 120 - 24; // MARGIN.left + MARGIN.right from the component
    const widths = rects.map((r) => Number(r.getAttribute('width')));
    expect(Math.max(...widths)).toBeCloseTo(innerW, 0);
  });

  it('gives the smaller row a proportionally smaller bar width', () => {
    const { container } = renderChart();
    const rects = Array.from(container.querySelectorAll('rect'));
    const widths = rects.map((r) => Number(r.getAttribute('width')));
    // North (50) is half of South (100)
    expect(widths[0]).toBeCloseTo(widths[1]! / 2, 0);
  });

  it('colors bars using categoricalColor by row index', () => {
    const { container } = renderChart();
    const rects = Array.from(container.querySelectorAll('rect'));
    expect(rects[0]!.getAttribute('fill')).toBe(categoricalColor(lightTheme, 0));
    expect(rects[1]!.getAttribute('fill')).toBe(categoricalColor(lightTheme, 1));
  });

  it('truncates a label longer than 14 characters with an ellipsis', () => {
    const { container } = renderChart({
      data: {
        rows: [{ region: 'A Very Long Region Name', sales: 10 }],
        fields: [{ key: 'region', type: 'string' }, { key: 'sales', type: 'number' }],
      },
    });
    const text = container.querySelector('text')!.textContent;
    expect(text).toBe('A Very Long R…');
  });

  it('filters out rows whose value is not finite', () => {
    const { container } = renderChart({
      data: {
        rows: [{ region: 'Good', sales: 10 }, { region: 'Bad', sales: NaN }],
        fields: [{ key: 'region', type: 'string' }, { key: 'sales', type: 'number' }],
      },
    });
    expect(container.querySelectorAll('rect')).toHaveLength(1);
  });

  it('uses the default aria-label naming the numeric field when none is provided', () => {
    const { container } = renderChart();
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Horizontal bar chart of sales');
  });

  it('uses a custom aria-label when provided', () => {
    const { container } = renderChart({ ariaLabel: 'Sales by region' });
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Sales by region');
  });
});
