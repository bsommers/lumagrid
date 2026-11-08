import React from 'react';
import { LineChart } from 'lumagrid/viz';
import { trend } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function LineDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <LineChart
      data={trend}
      width={width}
      height={height}
      theme={theme}
      labelField="month"
      valueField="revenue"
      colorField="region"
    />
    // #endregion
  );
}
