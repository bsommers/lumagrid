// Source of the line chart page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region line
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { LineChart } from 'lumagrid/viz';

// Long form: one row per month and region.
const trend: TransformedData = {
  rows: [
    { month: 'Jan', revenue: 12.0, region: 'North' },
    { month: 'Feb', revenue: 12.8, region: 'North' },
    { month: 'Mar', revenue: 13.1, region: 'North' },
    { month: 'Jan', revenue: 14.2, region: 'South' },
    { month: 'Feb', revenue: 13.6, region: 'South' },
    { month: 'Mar', revenue: 14.8, region: 'South' },
  ],
  fields: [
    { key: 'month', type: 'string' },
    { key: 'revenue', type: 'number' },
    { key: 'region', type: 'string' },
  ],
};

// labelField is the x category, valueField the y value, colorField splits the series.
export function Example() {
  return (
    <LineChart
      data={trend}
      width={600}
      height={300}
      theme={lightTheme}
      labelField="month"
      valueField="revenue"
      colorField="region"
      ariaLabel="Monthly revenue by region"
    />
  );
}
// #endregion

// #region line-view
// The same chart as a ViewSwitcher view: register nativeLinePlugin, then name it by id.
export const lineView = {
  id: 'line',
  label: 'Line chart',
  config: { labelField: 'month', valueField: 'revenue', colorField: 'region' },
};
// #endregion
