import React from 'react';
import { DataTable } from 'lumagrid/viz';
import { tableRows } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

export default function TableDemo({ width, height, theme }: DemoProps): React.ReactElement {
  return (
    // #region code
    <DataTable data={tableRows} width={width} height={height} theme={theme} />
    // #endregion
  );
}
