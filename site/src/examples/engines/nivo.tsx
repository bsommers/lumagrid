import React from 'react';
import { Bar } from '@nivo/bar';
import { registerPlugin } from 'lumagrid';
import { createNivoPlugin } from 'lumagrid/plugins';

export const NIVO_ID = 'ex-nivo';
type Row = { region: string; revenue: number };
type Cfg = { labelField?: string; valueField?: string };

registerPlugin(createNivoPlugin<Row[], Cfg>({
  id: NIVO_ID,
  label: 'Nivo',
  dataAdapter: (data, cfg) => data.rows.map((r) => ({
    region: String(r[cfg?.labelField ?? 'region'] ?? ''),
    revenue: Number(r[cfg?.valueField ?? 'revenue'] ?? 0),
  })),
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
      colorBy="indexValue"
      animate={false}
      enableLabel={false}
    />
  ),
}));
