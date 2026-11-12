import React, { useState } from 'react';
import { AreaChart } from 'lumagrid/viz';
import { trend } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function AreaDemo({ width, height, theme }: DemoProps): React.ReactElement {
  // #region code
  const [stacked, setStacked] = useState(false);
  const chart = (
    <AreaChart
      data={trend}
      width={width}
      height={height - 44}
      theme={theme}
      valueField="revenue"
      labelField="month"
      colorField="region"
      stacked={stacked}
    />
  );
  // #endregion
  return (
    <div>
      <div className="lg-demo-bar" style={{ color: theme.text.primary }}>
        <label>
          <input type="checkbox" checked={stacked} onChange={(e) => setStacked(e.target.checked)} /> Stacked
        </label>
      </div>
      {chart}
    </div>
  );
}
