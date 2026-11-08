// Source of the pie chart page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region pie
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { PieChart } from 'lumagrid/viz';

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

// valueField is the slice size, labelField the slice name. donut adds the total in the middle.
export function Example() {
  return (
    <PieChart
      data={sales}
      width={360}
      height={300}
      theme={lightTheme}
      valueField="revenue"
      labelField="region"
      donut
      ariaLabel="Revenue share by region"
    />
  );
}
// #endregion

// #region pie-view
// The same chart as a ViewSwitcher view: register nativePiePlugin, then name it by id.
export const pieView = {
  id: 'pie',
  label: 'Pie chart',
  config: { valueField: 'revenue', labelField: 'region', donut: true },
};
// #endregion
