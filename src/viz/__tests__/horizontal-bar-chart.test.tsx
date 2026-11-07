import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { HorizontalBarChart } from '../horizontal-bar-chart.js';
import { nativeBarPlugin } from '../plugins.js';
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

  describe('field selection', () => {
    // Two numeric and two string columns so inference and explicit choice differ.
    // Inferred: label=region, value=sales. Explicit: label=team, value=cost.
    const wide: TransformedData = {
      rows: [
        { region: 'North', team: 'Alpha', sales: 50, cost: 10 },
        { region: 'South', team: 'Beta', sales: 100, cost: 40 },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'team', type: 'string' },
        { key: 'sales', type: 'number' },
        { key: 'cost', type: 'number' },
      ],
    };

    function bars(container: HTMLElement) {
      const rects = Array.from(container.querySelectorAll('rect'));
      const widths = rects.map((r) => Number(r.getAttribute('width')));
      const titles = rects.map((r) => r.querySelector('title')!.textContent);
      return { widths, titles };
    }

    function expectCostByTeam(container: HTMLElement) {
      const { widths, titles } = bars(container);
      expect(widths).toHaveLength(2);
      expect(titles).toEqual(['Alpha: 10', 'Beta: 40']);
      // cost 10 is a quarter of cost 40
      expect(widths[0]).toBeCloseTo(widths[1]! / 4, 0);
    }

    it('draws bars from valueField and labelField', () => {
      const { container } = renderChart({ data: wide, valueField: 'cost', labelField: 'team' });
      expectCostByTeam(container);
      expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Horizontal bar chart of cost');
    });

    it('still honors legacy xField (value) and yField (label)', () => {
      const { container } = renderChart({ data: wide, xField: 'cost', yField: 'team' });
      expectCostByTeam(container);
    });

    it('prefers the role name over its legacy alias when both are passed', () => {
      const { container } = renderChart({
        data: wide,
        valueField: 'cost',
        labelField: 'team',
        xField: 'sales',
        yField: 'region',
      });
      expectCostByTeam(container);
    });

    it('falls back to inferred columns when no field props are passed', () => {
      const { container } = renderChart({ data: wide });
      const { widths, titles } = bars(container);
      expect(titles).toEqual(['North: 50', 'South: 100']);
      expect(widths[0]).toBeCloseTo(widths[1]! / 2, 0);
    });

    it('receives valueField and labelField through nativeBarPlugin config', () => {
      const { Renderer } = nativeBarPlugin;
      const { container } = render(
        <Renderer
          data={wide}
          theme={lightTheme}
          width={400}
          height={200}
          config={{ valueField: 'cost', labelField: 'team' }}
        />,
      );
      expectCostByTeam(container);
    });
  });
});
