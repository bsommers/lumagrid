import React from 'react';
import { Choropleth } from 'lumagrid/viz';
import { hexMap, hexProjectedPaths } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function ChoroplethDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <Choropleth
      data={hexMap}
      width={width}
      height={height}
      theme={theme}
      valueProperty="value"
      projectedPaths={hexProjectedPaths(width, height)}
    />
    // #endregion
  );
}
