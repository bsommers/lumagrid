import React from 'react';
import { Bar } from '@nivo/bar';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createNivoPlugin } from 'lumagrid/plugins';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

// #region code
// Pick dark or white label text per bar so it keeps WCAG AA (4.5:1) contrast on any fill.
function labelColor(fill: string): string {
  const n = parseInt(fill.replace('#', '').slice(0, 6), 16);
  const lin = (c: number) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return (l + 0.05) / 0.05 >= 1.05 / (l + 0.05) ? '#111827' : '#ffffff';
}

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
      labelTextColor={(bar) => labelColor(String(bar.color))}
    />
  ),
}));

export default function NivoDemo({ width, height }: DemoProps): React.ReactElement {
  return <ViewSwitcher views={[{ id: 'gallery-nivo' }]} data={sales} width={width} height={height} />;
}
// #endregion
