// Source of the Nivo section of plugins-and-adapters.md. Compiled by `npm run typecheck:site`,
// rendered by __tests__/adapters.test.tsx and embedded verbatim in the markdown.

// #region nivo-bars
import { Bar } from '@nivo/bar';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createNivoPlugin } from 'lumagrid/plugins';

// A type alias (not an interface) so the rows satisfy Nivo's BarDatum index signature.
type Row = { region: string; revenue: number };

// dataAdapter is required: Nivo chart types disagree about the data shape they expect.
const nivoBarsPlugin = createNivoPlugin<Row[]>({
  id: 'nivo-bars',
  label: 'Bars (Nivo)',
  dataAdapter: (data: TransformedData) =>
    data.rows.map((row) => ({ region: String(row['region'] ?? ''), revenue: Number(row['revenue'] ?? 0) })),
  Renderer: ({ data, theme, width, height }) => (
    // The fixed-size Bar component takes its size from the props the plugin receives.
    <Bar
      data={data}
      width={width}
      height={height}
      keys={['revenue']}
      indexBy="region"
      margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
      theme={theme}
      colors={theme.colors}
    />
  ),
});

registerPlugin(nivoBarsPlugin);

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
      <WidgetContainer data={sales} title="Nivo bars" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'nivo-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
