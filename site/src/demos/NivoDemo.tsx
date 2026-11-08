import React from 'react';
import { Bar } from '@nivo/bar';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createNivoPlugin } from 'lumagrid/plugins';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

// #region code
// A type alias (not an interface) so rows satisfy Nivo's BarDatum index signature.
type Row = { region: string; revenue: number };

registerPlugin(createNivoPlugin<Row[]>({
  id: 'gallery-nivo',
  label: 'Bars (Nivo)',
  dataAdapter: (data: TransformedData) =>
    data.rows.map((row) => ({ region: String(row['region'] ?? ''), revenue: Number(row['revenue'] ?? 0) })),
  Renderer: ({ data, theme, width, height }) => (
    <Bar
      data={data}
      width={width}
      height={height}
      keys={['revenue']}
      indexBy="region"
      margin={{ top: 16, right: 16, bottom: 40, left: 64 }}
      theme={theme}
      colors={theme.colors}
    />
  ),
}));

export default function NivoDemo({ width, height }: DemoProps): React.ReactElement {
  return <ViewSwitcher views={[{ id: 'gallery-nivo' }]} data={sales} width={width} height={height} />;
}
// #endregion
