import React from 'react';
import { ScatterChart } from 'lumagrid/viz';
import { channels } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function ScatterDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <ScatterChart
      data={channels}
      width={width}
      height={height}
      theme={theme}
      xValueField="spend"
      valueField="revenue"
      colorField="channel"
      sizeField="signups"
    />
    // #endregion
  );
}
