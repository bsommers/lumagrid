import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { ViewSwitcher, registerPlugin } from 'lumagrid';
import { createRechartsPlugin } from 'lumagrid/plugins';
import { sales } from '../../../examples/shared/demos';
import type { DemoProps } from './types';

// #region code
registerPlugin(createRechartsPlugin({
  id: 'gallery-recharts',
  label: 'Bars (Recharts)',
  // The default data adapter picks the first string column (name) and number column (value).
  Renderer: ({ data, theme, width, height }) => (
    <BarChart width={width} height={height} data={data}>
      <CartesianGrid stroke={theme.gridColor} />
      <XAxis dataKey="name" tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
      <YAxis tick={{ fill: theme.textColor }} />
      <Tooltip />
      <Bar dataKey="value" fill={theme.colors[0] ?? '#3b82f6'} />
    </BarChart>
  ),
}));

export default function RechartsDemo({ width, height }: DemoProps): React.ReactElement {
  return <ViewSwitcher views={[{ id: 'gallery-recharts' }]} data={sales} width={width} height={height} />;
}
// #endregion
