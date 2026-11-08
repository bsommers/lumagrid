import React from 'react';
import { PieChart } from 'lumagrid/viz';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function PieDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <PieChart
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
