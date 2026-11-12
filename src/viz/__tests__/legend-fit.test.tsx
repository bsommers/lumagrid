import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PieChart } from '../pie-chart.js';
import { legendHeight } from '../ticks.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  rows: [{ region: 'North', revenue: 85.1 }, { region: 'South', revenue: 99 }],
  fields: [{ key: 'region', type: 'string' }, { key: 'revenue', type: 'number' }],
};
const legend = (width: number) => {
  const { container, unmount } = render(
    <PieChart data={data} width={width} height={200} theme={lightTheme} valueField="revenue" labelField="region" />);
  const text = container.querySelector('[data-testid="pie-legend"]')!.textContent!;
  unmount();
  return text;
};

describe('legends fit their space', () => {
  it('pie legend drops the percent, then the value, as the chart narrows', () => {
    expect(legend(480)).toContain('North: 85.1 (46.2%)');
    expect(legend(300)).toContain('North: 85.1');
    expect(legend(300)).not.toContain('%');
    expect(legend(150)).toBe('NorthSouth');
  });

  it('legendHeight grows by a row when labels wrap', () => {
    const labels = ['North', 'South', 'East', 'West'];
    expect(legendHeight(labels, 600)).toBe(28);
    expect(legendHeight(labels, 150)).toBeGreaterThan(28);
    expect(legendHeight([], 100)).toBe(28);
  });
});
