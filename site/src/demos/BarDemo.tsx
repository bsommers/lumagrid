import React from 'react';
import { HorizontalBarChart } from 'lumagrid/viz';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function BarDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <HorizontalBarChart
      data={sales}
      width={width}
      height={height}
      theme={theme}
      valueField="revenue"
      labelField="region"
    />
    // #endregion
  );
}
