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
