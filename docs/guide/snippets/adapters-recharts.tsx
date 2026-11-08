// Source of the Recharts section of plugins-and-adapters.md. Compiled by `npm run typecheck:site`,
// rendered by __tests__/adapters.test.tsx and embedded verbatim in the markdown.

// #region recharts-bars
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createRechartsPlugin } from 'lumagrid/plugins';

// The default data adapter finds the first string column (name) and the first number
// column (value). Pass config.nameKey and config.dataKey to choose columns yourself.
const rechartsBarsPlugin = createRechartsPlugin({
  id: 'recharts-bars',
  label: 'Bars (Recharts)',
  Renderer: ({ data, theme, width, height, config }) => (
    // A fixed-size BarChart takes its size from the props the plugin receives.
    <BarChart width={width} height={height} data={data}>
      <CartesianGrid stroke={theme.gridColor} />
      <XAxis
        dataKey={config?.nameKey ?? 'name'}
        tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }}
      />
      <YAxis tick={{ fill: theme.textColor }} />
      <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0] ?? '#3b82f6'} />
    </BarChart>
  ),
});

registerPlugin(rechartsBarsPlugin);

const sales: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000 },
    { region: 'South', revenue: 14200 },
    { region: 'East', revenue: 9300 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="light">
      <WidgetContainer data={sales} title="Recharts bars" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'recharts-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
