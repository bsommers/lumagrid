// Source of the scatter page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region scatter
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { ScatterChart } from 'lumagrid/viz';

// One row per observation: marketing spend and revenue for a channel, with the signups it produced.
const channels: TransformedData = {
  rows: [
    { channel: 'Search', spend: 4.2, revenue: 18.5, signups: 310 },
    { channel: 'Search', spend: 9.5, revenue: 36.4, signups: 620 },
    { channel: 'Social', spend: 5.6, revenue: 11.8, signups: 260 },
    { channel: 'Social', spend: 11.0, revenue: 19.7, signups: 410 },
    { channel: 'Email', spend: 2.0, revenue: 14.1, signups: 175 },
    { channel: 'Email', spend: 4.8, revenue: 26.9, signups: 310 },
  ],
  fields: [
    { key: 'channel', type: 'string' },
    { key: 'spend', type: 'number' },
    { key: 'revenue', type: 'number' },
    { key: 'signups', type: 'number' },
  ],
};

// xValueField is the x number, valueField the y number, colorField splits the series, sizeField sets the bubble radius.
export function Example() {
  return (
    <ScatterChart
      data={channels}
      width={600}
      height={300}
      theme={lightTheme}
      xValueField="spend"
      valueField="revenue"
      colorField="channel"
      sizeField="signups"
      ariaLabel="Revenue against marketing spend by channel"
    />
  );
}
// #endregion

// #region scatter-view
// The same chart as a ViewSwitcher view: register nativeScatterPlugin, then name it by id.
export const scatterView = {
  id: 'scatter',
  label: 'Scatter chart',
  config: { xValueField: 'spend', valueField: 'revenue', colorField: 'channel', sizeField: 'signups' },
};
// #endregion
