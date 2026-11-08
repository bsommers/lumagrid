// Source of the getting-started chapter. Compiled by `npm run typecheck:site`,
// rendered by __tests__/snippets.test.tsx and embedded verbatim in the markdown.

// #region basic
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { nativeBarPlugin, nativeTablePlugin } from 'lumagrid/viz';

// 1. Register the plugins your views refer to, once, at application startup.
registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);

// 2. Data already in the library's shape: rows plus a description of each field.
const sales: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000 },
    { region: 'South', revenue: 14200 },
    { region: 'East', revenue: 9300 },
    { region: 'West', revenue: 11100 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
};

// 3. Name the columns by role: revenue is the value, region is the label.
const views = [
  { id: 'bar', label: 'Bar chart', config: { valueField: 'revenue', labelField: 'region' } },
  { id: 'table', label: 'Table' },
];

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={sales} title="Revenue by region" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={views} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
// #endregion
