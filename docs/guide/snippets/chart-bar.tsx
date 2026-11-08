// Source of the bar chart page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region bar
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { HorizontalBarChart } from 'lumagrid/viz';

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

// valueField is the bar length, labelField is the text beside each bar.
export function Example() {
  return (
    <HorizontalBarChart
      data={sales}
      width={600}
      height={240}
      theme={lightTheme}
      valueField="revenue"
      labelField="region"
      ariaLabel="Revenue by region"
    />
  );
}
// #endregion

// #region bar-view
// The same chart as a ViewSwitcher view: register nativeBarPlugin, then name it by id.
export const barView = {
  id: 'bar',
  label: 'Bar chart',
  config: { valueField: 'revenue', labelField: 'region' },
};
// #endregion
