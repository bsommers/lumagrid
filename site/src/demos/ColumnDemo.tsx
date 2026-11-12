import React, { useState } from 'react';
import { ColumnChart } from 'lumagrid/viz';
import { trend } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function ColumnDemo({ width, height, theme }: DemoProps): React.ReactElement {
  // #region code
  const [mode, setMode] = useState<'grouped' | 'stacked'>('grouped');
  const chart = (
    <ColumnChart
      data={trend}
      width={width}
      height={height - 44}
      theme={theme}
      valueField="revenue"
      labelField="month"
      colorField="region"
      mode={mode}
    />
  );
  // #endregion
  return (
    <div>
      <div className="lg-demo-bar" style={{ color: theme.text.primary }}>
        <button type="button" onClick={() => setMode(mode === 'grouped' ? 'stacked' : 'grouped')}>
          {mode === 'grouped' ? 'Stack series' : 'Group series'}
        </button>
        <span style={{ color: theme.text.secondary }}>Mode: {mode}</span>
      </div>
      {chart}
    </div>
  );
}
