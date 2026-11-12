import type { GeoData, GeoFeature, TransformedData } from 'lumagrid';

// Shared demo data and view configs. Pure data, no React: the examples playground
// and the showcase site both import from here so nothing is duplicated.

export const sales: TransformedData = {
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
  hierarchy: {
    id: 'all',
    label: 'All regions',
    value: 46600,
    children: [
      { id: 'north', label: 'North', value: 12000 },
      { id: 'south', label: 'South', value: 14200 },
      { id: 'east', label: 'East', value: 9300 },
      { id: 'west', label: 'West', value: 11100 },
    ],
  },
};

// Role-named field props for the sales dataset (revenue = value, region = label).
export const salesFields = { valueField: 'revenue', labelField: 'region' };

export const views = [
  { id: 'bar', label: 'Bar', config: salesFields },
  { id: 'line', label: 'Line', config: salesFields },
  { id: 'pie', label: 'Pie', config: salesFields },
  { id: 'table', label: 'Table' },
  { id: 'tree', label: 'Tree' },
];

// ---------------------------------------------------------------------------
// Datasets for the remaining native charts (used by the site gallery and capture page).
// ---------------------------------------------------------------------------

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const regionBase: Record<string, number[]> = {
  North: [12.0, 12.8, 13.1, 14.2, 14.9, 15.8],
  South: [14.2, 13.6, 14.8, 15.1, 14.4, 16.2],
  East: [9.3, 10.1, 10.8, 10.2, 11.5, 12.4],
};

/** Monthly revenue by region (line chart, `colorField: 'region'` splits the series). */
export const trend: TransformedData = {
  rows: Object.entries(regionBase).flatMap(([region, values]) =>
    values.map((revenue, i) => ({ month: months[i] ?? '', revenue, region })),
  ),
  fields: [
    { key: 'month', type: 'string' },
    { key: 'revenue', type: 'number' },
    { key: 'region', type: 'string' },
  ],
};

const networkNodes: Array<[string, string, string]> = [
  ['core', 'Core', 'platform'],
  ['theme', 'Theme', 'platform'],
  ['registry', 'Registry', 'platform'],
  ['transforms', 'Transforms', 'data'],
  ['csv', 'CSV', 'data'],
  ['geo', 'GeoJSON', 'data'],
  ['bar', 'Bar', 'viz'],
  ['line', 'Line', 'viz'],
  ['pie', 'Pie', 'viz'],
  ['force', 'Force', 'viz'],
  ['d3', 'D3', 'plugin'],
  ['recharts', 'Recharts', 'plugin'],
];
const networkEdges: Array<[string, string, number]> = [
  ['core', 'theme', 2], ['core', 'registry', 2], ['core', 'transforms', 2],
  ['transforms', 'csv', 1], ['transforms', 'geo', 1], ['registry', 'bar', 1],
  ['registry', 'line', 1], ['registry', 'pie', 1], ['registry', 'force', 1],
  ['theme', 'bar', 1], ['theme', 'line', 1], ['theme', 'pie', 1],
  ['registry', 'd3', 1], ['registry', 'recharts', 1], ['d3', 'force', 1],
  ['transforms', 'bar', 1],
];

/** Node rows (`id`, `label`, `group`) plus edge rows (`source`, `target`, `weight`) in one dataset. */
export const network: TransformedData = {
  rows: [
    ...networkNodes.map(([id, label, group]) => ({ id, label, group })),
    ...networkEdges.map(([source, target, weight]) => ({ source, target, weight })),
  ],
  fields: [
    { key: 'id', type: 'string' },
    { key: 'label', type: 'string' },
    { key: 'group', type: 'string' },
    { key: 'source', type: 'string' },
    { key: 'target', type: 'string' },
    { key: 'weight', type: 'number' },
  ],
};

// Axial (q, r) coordinates and a value for each of the twelve hex tiles.
const hexTiles: Array<[string, number, number, number]> = [
  ['h01', 0, 0, 12], ['h02', 1, 0, 34], ['h03', 2, 0, 58], ['h04', 3, 0, 41],
  ['h05', -1, 1, 22], ['h06', 0, 1, 67], ['h07', 1, 1, 90], ['h08', 2, 1, 73],
  ['h09', -1, 2, 8], ['h10', 0, 2, 45], ['h11', 1, 2, 62], ['h12', 2, 2, 29],
];

const hexFeatures: GeoFeature[] = hexTiles.map(([id, q, r, value]) => ({
  type: 'Feature',
  id,
  properties: { name: `Tile ${id.slice(1)}`, value },
  // Axial coordinates; `hexProjectedPaths` turns them into pixel paths.
  geometry: { type: 'Hex', coordinates: [q, r] },
}));

/** A tile map: twelve hexagons with a numeric `value` property. */
export const hexMap: TransformedData = {
  rows: [],
  fields: [],
  geo: { type: 'FeatureCollection', features: hexFeatures } satisfies GeoData,
};

/**
 * Deterministic projection for {@link hexMap}: pointy-top hexagons laid out from axial
 * coordinates, scaled to fit `width` by `height` with a margin and centred. Choropleth has no
 * projection engine, so the paths are supplied through `projectedPaths`. Rounded to 2 decimals.
 */
export function hexProjectedPaths(width: number, height: number, margin = 24): Record<string, string> {
  const sqrt3 = Math.sqrt(3);
  const centers = hexFeatures.map((f) => {
    const [q, r] = f.geometry.coordinates as [number, number];
    return { id: f.id, x: sqrt3 * (q + r / 2), y: 1.5 * r };
  });
  const xs = centers.map((c) => c.x);
  const ys = centers.map((c) => c.y);
  const spanX = Math.max(...xs) - Math.min(...xs) + sqrt3; // unit-size hex is sqrt3 wide
  const spanY = Math.max(...ys) - Math.min(...ys) + 2; // and 2 tall
  const size = Math.min((width - margin * 2) / spanX, (height - margin * 2) / spanY);
  const offX = (width - spanX * size) / 2 + (sqrt3 / 2) * size - Math.min(...xs) * size;
  const offY = (height - spanY * size) / 2 + size - Math.min(...ys) * size;
  const round = (n: number) => String(Math.round(n * 100) / 100);
  const out: Record<string, string> = {};
  for (const c of centers) {
    const cx = offX + c.x * size;
    const cy = offY + c.y * size;
    const pts = [0, 1, 2, 3, 4, 5].map((i) => {
      const a = (Math.PI / 180) * (60 * i - 30);
      return `${round(cx + size * Math.cos(a))},${round(cy + size * Math.sin(a))}`;
    });
    out[c.id] = `M${pts.join('L')}Z`;
  }
  return out;
}

/** Flat sales rows for the table chart. */
export const tableRows: TransformedData = {
  rows: [
    { region: 'North', product: 'Widgets', revenue: 7200, units: 240 },
    { region: 'North', product: 'Gadgets', revenue: 4800, units: 96 },
    { region: 'South', product: 'Widgets', revenue: 8100, units: 270 },
    { region: 'South', product: 'Gadgets', revenue: 6100, units: 122 },
    { region: 'East', product: 'Widgets', revenue: 5300, units: 177 },
    { region: 'East', product: 'Gadgets', revenue: 4000, units: 80 },
    { region: 'West', product: 'Widgets', revenue: 6400, units: 213 },
    { region: 'West', product: 'Gadgets', revenue: 4700, units: 94 },
  ],
  fields: [
    { key: 'region', type: 'string', label: 'Region' },
    { key: 'product', type: 'string', label: 'Product' },
    { key: 'revenue', type: 'number', label: 'Revenue' },
    { key: 'units', type: 'number', label: 'Units' },
  ],
};

// Marketing channels: spend vs. revenue, bubble size = signups.
const channelPoints: Array<[string, number, number, number]> = [
  ['Search', 4.2, 18.5, 310], ['Search', 6.8, 27.1, 470],
  ['Search', 9.5, 36.4, 620], ['Search', 12.1, 41.0, 705],
  ['Search', 15.3, 52.8, 880], ['Social', 3.1, 6.2, 150],
  ['Social', 5.6, 11.8, 260], ['Social', 8.4, 15.0, 340],
  ['Social', 11.0, 19.7, 410], ['Social', 14.2, 21.3, 460],
  ['Email', 1.2, 9.4, 120], ['Email', 2.0, 14.1, 175],
  ['Email', 3.5, 22.6, 260], ['Email', 4.8, 26.9, 310],
  ['Email', 6.1, 30.2, 365], ['Events', 7.5, 12.4, 90],
  ['Events', 10.2, 24.8, 160], ['Events', 13.9, 38.5, 240],
];

/** Monthly marketing spend and revenue by channel (scatter: `xValueField: 'spend'`, `sizeField: 'signups'`). */
export const channels: TransformedData = {
  rows: channelPoints.map(([channel, spend, revenue, signups]) => ({ channel, spend, revenue, signups })),
  fields: [
    { key: 'channel', type: 'string' },
    { key: 'spend', type: 'number' },
    { key: 'revenue', type: 'number' },
    { key: 'signups', type: 'number' },
  ],
};

const supportDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const supportSlots = ['00-04', '04-08', '08-12', '12-16', '16-20', '20-24'];
const supportCounts: number[][] = [
  [4, 9, 52, 61, 38, 12], [5, 8, 58, 66, 41, 14], [3, 10, 55, 63, 44, 11],
  [6, 11, 60, 70, 46, 15], [4, 9, 49, 57, 35, 13], [2, 4, 18, 22, 19, 9], [1, 3, 11, 15, 14, 6],
];

/** Support tickets opened per weekday and four-hour slot (heatmap: day rows by slot columns). */
export const tickets: TransformedData = {
  rows: supportDays.flatMap((day, di) =>
    supportSlots.map((slot, si) => ({ day, slot, tickets: supportCounts[di]?.[si] ?? 0 })),
  ),
  fields: [
    { key: 'day', type: 'string' },
    { key: 'slot', type: 'string' },
    { key: 'tickets', type: 'number' },
  ],
};

/** Role-field config for one demo chart (role names only). */
export interface DemoView {
  data: TransformedData;
  config: {
    valueField?: string;
    labelField?: string;
    idField?: string;
    colorField?: string;
    valueProperty?: string;
    xValueField?: string;
    sizeField?: string;
    columnField?: string;
    rowField?: string;
    stacked?: boolean;
    mode?: 'grouped' | 'stacked';
    seed?: number;
  };
}

export type DemoChartId = 'bar' | 'line' | 'pie' | 'force' | 'choropleth' | 'table' | 'tree'
  | 'scatter' | 'area' | 'column' | 'heatmap';

/** Data and role-field config for each native chart, keyed by capture chart id. */
export const demoViews: Record<DemoChartId, DemoView> = {
  bar: { data: sales, config: salesFields },
  line: { data: trend, config: { valueField: 'revenue', labelField: 'month', colorField: 'region' } },
  pie: { data: sales, config: salesFields },
  force: { data: network, config: { idField: 'id', labelField: 'label', seed: 1 } },
  choropleth: { data: hexMap, config: { valueProperty: 'value' } },
  table: { data: tableRows, config: {} },
  tree: { data: sales, config: {} },
  scatter: {
    data: channels,
    config: { xValueField: 'spend', valueField: 'revenue', colorField: 'channel', sizeField: 'signups' },
  },
  area: { data: trend, config: { valueField: 'revenue', labelField: 'month', colorField: 'region', stacked: true } },
  column: { data: trend, config: { valueField: 'revenue', labelField: 'month', colorField: 'region', mode: 'grouped' } },
  heatmap: { data: tickets, config: { valueField: 'tickets', columnField: 'slot', rowField: 'day' } },
};
