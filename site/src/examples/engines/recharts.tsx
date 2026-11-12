import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { registerPlugin } from 'lumagrid';
import { createRechartsPlugin } from 'lumagrid/plugins';
import type { RechartsConfig } from 'lumagrid/plugins';

export const RECHARTS_ID = 'ex-recharts';
type Cfg = RechartsConfig & { labelField?: string; valueField?: string };

registerPlugin(createRechartsPlugin({
  id: RECHARTS_ID,
  label: 'Recharts',
  dataAdapter: (data, cfg) => data.rows.map((r) => ({
    name: String(r[(cfg as Cfg | undefined)?.labelField ?? 'region'] ?? ''),
    value: Number(r[(cfg as Cfg | undefined)?.valueField ?? 'revenue'] ?? 0),
  })),
  Renderer: ({ data, theme, width, height }) => (
    <BarChart width={width} height={height} data={data} accessibilityLayer>
      <CartesianGrid stroke={theme.gridColor} />
      <XAxis dataKey="name" tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
      <YAxis tick={{ fill: theme.textColor }} />
      <Tooltip />
      <Bar dataKey="value" isAnimationActive={false}>
        {data.map((_d, i) => <Cell key={i} fill={theme.colors[i % theme.colors.length] ?? '#3b82f6'} />)}
      </Bar>
    </BarChart>
  ),
}));
