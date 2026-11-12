// Source of the area page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region area
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { AreaChart } from 'lumagrid/viz';

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

// stacked adds the series on top of each other; labelField is the x category, colorField splits the series.
export function Example() {
  return (
    <AreaChart
      data={trend}
      width={600}
      height={300}
      theme={lightTheme}
      labelField="month"
      valueField="revenue"
      colorField="region"
      stacked
      ariaLabel="Monthly revenue by region"
    />
  );
}
// #endregion

// #region area-view
// The same chart as a ViewSwitcher view: register nativeAreaPlugin, then name it by id.
export const areaView = {
  id: 'area',
  label: 'Area chart',
  config: { labelField: 'month', valueField: 'revenue', colorField: 'region', stacked: true },
};
// #endregion
