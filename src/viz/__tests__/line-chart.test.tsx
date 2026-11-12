import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { LineChart } from '../line-chart.js';
import { lightTheme } from '../../theme/light.js';
import { categoricalColor } from '../../theme/color-scale.js';
import type { TransformedData } from '../../transforms/types.js';

const singleSeriesData: TransformedData = {
  rows: [
    { day: 'Mon', value: 10 },
    { day: 'Tue', value: 20 },
    { day: 'Wed', value: 15 },
  ],
  fields: [
    { key: 'day', type: 'string' },
    { key: 'value', type: 'number' },
  ],
};

function renderChart(
  data: TransformedData,
  overrides: Partial<React.ComponentProps<typeof LineChart>> = {},
) {
  return render(<LineChart data={data} width={400} height={200} theme={lightTheme} {...overrides} />);
}

describe('LineChart', () => {
  it('renders exactly one path when there is no colorField', () => {
    const { container } = renderChart(singleSeriesData);
    expect(container.querySelectorAll('path')).toHaveLength(1);
  });

  it('renders one path per distinct colorField value when colorField is set', () => {
    const grouped: TransformedData = {
      rows: [
        { day: 'Mon', value: 10, region: 'East' },
        { day: 'Mon', value: 5, region: 'West' },
        { day: 'Tue', value: 12, region: 'East' },
        { day: 'Tue', value: 8, region: 'West' },
      ],
      fields: [
        { key: 'day', type: 'string' },
        { key: 'value', type: 'number' },
        { key: 'region', type: 'string' },
      ],
    };
    const { container } = renderChart(grouped, { colorField: 'region' });
    expect(container.querySelectorAll('path')).toHaveLength(2);
  });

  it('colors each series using categoricalColor by series index', () => {
    const grouped: TransformedData = {
      rows: [
        { day: 'Mon', value: 10, region: 'East' },
        { day: 'Mon', value: 5, region: 'West' },
      ],
      fields: [
        { key: 'day', type: 'string' },
        { key: 'value', type: 'number' },
        { key: 'region', type: 'string' },
      ],
    };
    const { container } = renderChart(grouped, { colorField: 'region' });
    const paths = Array.from(container.querySelectorAll('path'));
    expect(paths[0]!.getAttribute('stroke')).toBe(categoricalColor(lightTheme, 0));
    expect(paths[1]!.getAttribute('stroke')).toBe(categoricalColor(lightTheme, 1));
  });

  it('starts the path data with an absolute moveto command', () => {
    const { container } = renderChart(singleSeriesData);
    const d = container.querySelector('path')!.getAttribute('d')!;
    expect(d.startsWith('M')).toBe(true);
  });

  it('truncates x-axis tick labels to 8 characters', () => {
    const longLabels: TransformedData = {
      rows: [
        { day: 'Monday Morning', value: 1 },
        { day: 'Tuesday Afternoon', value: 2 },
      ],
      fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
    };
    const { container } = renderChart(longLabels);
    const texts = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
    expect(texts).toContain('Monday M');
  });

  it('uses the default aria-label naming the numeric field when none is provided', () => {
    const { container } = renderChart(singleSeriesData);
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Line chart of value');
  });

  it('uses a custom aria-label when provided', () => {
    const { container } = renderChart(singleSeriesData, { ariaLabel: 'Weekly trend' });
    expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Weekly trend');
  });

  it('does not produce a NaN x-tick position when there is only one distinct x value', () => {
    const singleXValue: TransformedData = {
      rows: [{ day: 'Mon', value: 10 }],
      fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
    };
    const { container } = renderChart(singleXValue);
    const tickText = Array.from(container.querySelectorAll('text')).find((t) => t.textContent === 'Mon');
    expect(tickText).toBeDefined();
    expect(tickText!.getAttribute('x')).not.toBe('NaN');
  });
});

describe('LineChart non-finite values', () => {
  it('ignores NaN y values without producing NaN in the path or ticks', () => {
    const data: TransformedData = {
      rows: [{ day: 'Mon', value: 'abc' }, { day: 'Tue', value: 5 }, { day: 'Wed', value: 7 }],
      fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
    };
    const { container } = renderChart(data);
    expect(container.innerHTML).not.toContain('NaN');
  });

  describe('field inference and missing values', () => {
    const paths = (c: HTMLElement) => Array.from(c.querySelectorAll('path')).map((e) => e.getAttribute('d') ?? '');

    it('falls back to empty field names when no number/string fields are declared', () => {
      const { container } = renderChart({ rows: [{ a: 1 }, { a: 2 }], fields: [] });
      const svg = container.querySelector('svg')!;
      expect(svg.getAttribute('aria-label')).toBe('Line chart of ');
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('uses a date field as the category axis when there is no string field', () => {
      const { container } = renderChart({
        rows: [{ when: '2026-01', v: 1 }, { when: '2026-02', v: 2 }],
        fields: [{ key: 'when', type: 'date' }, { key: 'v', type: 'number' }],
      });
      const labels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
      expect(labels).toContain('2026-01');
      expect(labels).toContain('2026-02');
    });

    it('honours explicit xField/yField over inferred fields', () => {
      const { container } = renderChart(
        {
          rows: [{ day: 'Mon', alt: 'X1', value: 1, other: 50 }, { day: 'Tue', alt: 'X2', value: 2, other: 60 }],
          fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
        },
        { xField: 'alt', yField: 'other' },
      );
      expect(container.querySelector('svg')!.getAttribute('aria-label')).toBe('Line chart of other');
      const labels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
      expect(labels).toContain('X1');
      expect(labels).not.toContain('Mon');
    });

    it('treats a missing y value as 0 and a missing category as an empty label (no colorField)', () => {
      const { container } = renderChart({
        rows: [{ day: 'Mon', value: 5 }, { value: 3 }, { day: 'Wed' }],
        fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
      });
      const [d] = paths(container);
      expect(d!.split(/[ML]/).filter(Boolean)).toHaveLength(3);
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('skips non-numeric y values instead of drawing NaN segments', () => {
      const { container } = renderChart({
        rows: [{ day: 'Mon', value: 5 }, { day: 'Tue', value: 'oops' }, { day: 'Wed', value: 7 }],
        fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
      });
      const [d] = paths(container);
      expect(d!.split(/[ML]/).filter(Boolean)).toHaveLength(2);
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('groups rows missing the colorField value into a "default" series and handles missing x/y', () => {
      const { container } = renderChart(
        {
          rows: [
            { day: 'Mon', value: 1, s: 'a' },
            { day: 'Tue', value: 2, s: 'a' },
            { day: 'Mon', value: 3 },
            { value: 4, s: 'b' },
            { day: 'Tue', s: 'b' },
          ],
          fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
        },
        { colorField: 's' },
      );
      expect(paths(container)).toHaveLength(3);
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('renders no x-tick labels and no NaN for empty rows', () => {
      const { container } = renderChart({ rows: [], fields: [{ key: 'v', type: 'number' }] });
      const texts = Array.from(container.querySelectorAll('text'));
      expect(texts.map((t) => t.textContent)).toEqual(['0', '0.5', '1']); // y-axis ticks only
      expect(container.innerHTML).not.toContain('NaN');
    });

    it('caps x-ticks at 5 for many categories, including first and last', () => {
      const rows = Array.from({ length: 12 }, (_, i) => ({ day: `D${i}`, value: i }));
      const { container } = renderChart({ rows, fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }] });
      const xLabels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent).filter((t) => t?.startsWith('D'));
      expect(xLabels).toHaveLength(5);
      expect(xLabels[0]).toBe('D0');
      expect(xLabels[4]).toBe('D11');
    });

    it('extends the y domain below zero for negative values', () => {
      const { container } = renderChart({
        rows: [{ day: 'Mon', value: -10 }, { day: 'Tue', value: 10 }],
        fields: [{ key: 'day', type: 'string' }, { key: 'value', type: 'number' }],
      });
      const yLabels = Array.from(container.querySelectorAll('text')).map((t) => t.textContent);
      expect(yLabels).toContain('-10');
      expect(yLabels).toContain('10');
    });
  });
});

describe('LineChart role-named fields', () => {
  const multi: TransformedData = {
    rows: [
      { day: 'Mon', alt: 'X1', value: 1, other: 50 },
      { day: 'Tue', alt: 'X2', value: 2, other: 60 },
    ],
    fields: [
      { key: 'day', type: 'string' },
      { key: 'alt', type: 'string' },
      { key: 'value', type: 'number' },
      { key: 'other', type: 'number' },
    ],
  };
  const labels = (c: HTMLElement) => Array.from(c.querySelectorAll('text')).map((t) => t.textContent);
  const ariaOf = (c: HTMLElement) => c.querySelector('svg')!.getAttribute('aria-label');

  it('selects columns with valueField/labelField', () => {
    const { container } = renderChart(multi, { valueField: 'other', labelField: 'alt' });
    expect(ariaOf(container)).toBe('Line chart of other');
    expect(labels(container)).toContain('X1');
    expect(labels(container)).not.toContain('Mon');
  });

  it('selects the same columns through the legacy yField/xField aliases', () => {
    const { container } = renderChart(multi, { yField: 'other', xField: 'alt' });
    expect(ariaOf(container)).toBe('Line chart of other');
    expect(labels(container)).toContain('X1');
  });

  it('lets role names win over legacy aliases', () => {
    const { container } = renderChart(multi, {
      valueField: 'other', labelField: 'alt', yField: 'value', xField: 'day',
    });
    expect(ariaOf(container)).toBe('Line chart of other');
    expect(labels(container)).toContain('X1');
    expect(labels(container)).not.toContain('Mon');
  });

  it('infers the first number and string columns when no field props are given', () => {
    const { container } = renderChart(multi);
    expect(ariaOf(container)).toBe('Line chart of value');
    expect(labels(container)).toContain('Mon');
  });

  describe('ticks, legend, and text alternatives', () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const grouped: TransformedData = {
      rows: months.flatMap((m, i) => [
        { month: m, value: 1000 * (i + 1) + 200, region: 'North' },
        { month: m, value: 500 * (i + 1), region: 'South' },
      ]),
      fields: [{ key: 'month', type: 'string' }, { key: 'value', type: 'number' }, { key: 'region', type: 'string' }],
    };

    it('shows every x label for 6 categories (no dropped Mar)', () => {
      const { container } = renderChart(grouped, { labelField: 'month', valueField: 'value', colorField: 'region' });
      const xs = Array.from(container.querySelectorAll('svg text')).map((t) => t.textContent).filter((t) => months.includes(t ?? ''));
      expect(xs).toEqual(months);
    });

    it('renders a legend with one themed swatch per series, and can opt out', () => {
      const props = { labelField: 'month', valueField: 'value', colorField: 'region' };
      const { container } = renderChart(grouped, props);
      const items = container.querySelectorAll('ul[aria-label="Legend"] li');
      expect(items).toHaveLength(2);
      expect(items[0].textContent).toBe('North');
      const sw = items[1].querySelector('[data-legend-swatch]') as HTMLElement;
      expect(sw.style.background).not.toBe('');
      const off = renderChart(grouped, { ...props, showLegend: false });
      expect(off.container.querySelector('ul')).toBeNull();
    });

    it('has no legend without colorField', () => {
      expect(renderChart(singleSeriesData).container.querySelector('ul')).toBeNull();
    });

    it('exposes every data point in a hidden table', () => {
      const { container } = renderChart(grouped, { labelField: 'month', valueField: 'value', colorField: 'region' });
      const rows = Array.from(container.querySelectorAll('tbody tr')).map((r) =>
        Array.from(r.querySelectorAll('td')).map((c) => c.textContent).join(','));
      expect(rows).toHaveLength(12);
      expect(rows).toContain('North,Mar,' + (3200).toLocaleString());
    });
  });
});
