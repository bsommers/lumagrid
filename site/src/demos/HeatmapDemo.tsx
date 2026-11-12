import React from 'react';
import { Heatmap } from 'lumagrid/viz';
import { tickets } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function HeatmapDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <Heatmap
      data={tickets}
      width={width}
      height={height}
      theme={theme}
      valueField="tickets"
      columnField="slot"
      rowField="day"
    />
    // #endregion
  );
}
