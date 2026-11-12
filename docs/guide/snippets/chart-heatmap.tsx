// Source of the heatmap page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region heatmap
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { Heatmap } from 'lumagrid/viz';

// One row per cell: support tickets opened per weekday and slot of the day.
const tickets: TransformedData = {
  rows: [
    { day: 'Mon', slot: '08-12', tickets: 52 },
    { day: 'Mon', slot: '12-16', tickets: 61 },
    { day: 'Mon', slot: '16-20', tickets: 38 },
    { day: 'Tue', slot: '08-12', tickets: 58 },
    { day: 'Tue', slot: '12-16', tickets: 66 },
    { day: 'Tue', slot: '16-20', tickets: 41 },
  ],
  fields: [
    { key: 'day', type: 'string' },
    { key: 'slot', type: 'string' },
    { key: 'tickets', type: 'number' },
  ],
};

// columnField and rowField name the two axes; valueField is the number that colors each cell.
export function Example() {
  return (
    <Heatmap
      data={tickets}
      width={600}
      height={300}
      theme={lightTheme}
      valueField="tickets"
      columnField="slot"
      rowField="day"
      ariaLabel="Support tickets by weekday and time slot"
    />
  );
}
// #endregion

// #region heatmap-view
// The same chart as a ViewSwitcher view: register nativeHeatmapPlugin, then name it by id.
export const heatmapView = {
  id: 'heatmap',
  label: 'Heatmap',
  config: { valueField: 'tickets', columnField: 'slot', rowField: 'day' },
};
// #endregion
