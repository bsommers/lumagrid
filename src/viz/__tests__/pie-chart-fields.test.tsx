import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PieChart } from '../pie-chart.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  rows: [{ k: 'a', v: 1, w: 3 }, { k: 'b', v: 3, w: 1 }],
  fields: [{ key: 'k', type: 'string' }, { key: 'v', type: 'number' }, { key: 'w', type: 'number' }],
};
const draw = (o: Partial<React.ComponentProps<typeof PieChart>>) =>
  render(<PieChart data={data} width={300} height={300} theme={lightTheme} {...o} />);

describe('PieChart field resolution', () => {
  it('uses legacy xField/yField aliases', () => {
    const { container } = draw({ xField: 'k', yField: 'w' });
    expect(container.textContent).toContain('75.0%');
  });

  it('valueField takes priority over yField', () => {
    const { container } = draw({ valueField: 'v', yField: 'w' });
    expect(container.textContent).toContain('25.0%');
  });

  it('labelField takes priority over xField', () => {
    const { container } = draw({ labelField: 'k', xField: 'v', valueField: 'v' });
    expect(container.textContent).toContain('a');
  });

  it('renders no slices when no fields can be inferred', () => {
    const { container } = render(
      <PieChart data={{ rows: [{ x: 1 }], fields: [] }} width={300} height={300} theme={lightTheme} />,
    );
    expect(container.querySelectorAll('path')).toHaveLength(0);
  });
});
