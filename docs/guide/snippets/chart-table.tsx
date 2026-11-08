// Source of the data table page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region table
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { DataTable } from 'lumagrid/viz';

// Columns come from fields; label is the header text shown instead of the key.
const orders: TransformedData = {
  rows: [
    { region: 'North', product: 'Widgets', revenue: 7200, units: 240 },
    { region: 'North', product: 'Gadgets', revenue: 4800, units: 96 },
    { region: 'South', product: 'Widgets', revenue: 8100, units: 270 },
    { region: 'South', product: 'Gadgets', revenue: 6100, units: 122 },
  ],
  fields: [
    { key: 'region', type: 'string', label: 'Region' },
    { key: 'product', type: 'string', label: 'Product' },
    { key: 'revenue', type: 'number', label: 'Revenue' },
    { key: 'units', type: 'number', label: 'Units' },
  ],
};

// The table takes no role field props. Click a header to sort.
export function Example() {
  return <DataTable data={orders} width={600} height={240} theme={lightTheme} />;
}
// #endregion

// #region table-view
// The same table as a ViewSwitcher view: register nativeTablePlugin, then name it by id.
export const tableView = { id: 'table', label: 'Table' };
// #endregion
