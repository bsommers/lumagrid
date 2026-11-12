import type { TransformedData } from '../transforms/types.js';

/**
 * Sample `TransformedData` used by the conformance kit: five rows with a string, a number and a
 * group column, plus a small hierarchy and a one-feature GeoJSON collection so that tree and map
 * style plugins have something to draw.
 *
 * Treat it as read-only; the kit clones it before every use.
 *
 * @beta
 * @experimental
 */
export const sampleData: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000, group: 'A' },
    { region: 'South', revenue: 14200, group: 'A' },
    { region: 'East', revenue: 9300, group: 'B' },
    { region: 'West', revenue: 11100, group: 'B' },
    { region: 'Central', revenue: 7600, group: 'B' },
  ],
  fields: [
    { key: 'region', type: 'string', label: 'Region' },
    { key: 'revenue', type: 'number', label: 'Revenue' },
    { key: 'group', type: 'string', label: 'Group' },
  ],
  hierarchy: {
    id: 'root',
    label: 'All regions',
    children: [
      { id: 'A', label: 'Group A', children: [{ id: 'North', label: 'North', value: 12000 }, { id: 'South', label: 'South', value: 14200 }] },
      { id: 'B', label: 'Group B', children: [{ id: 'East', label: 'East', value: 9300 }] },
    ],
  },
  geo: {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        id: 'North',
        properties: { name: 'North', revenue: 12000 },
        geometry: { type: 'Polygon', coordinates: [[[0, 0], [10, 0], [10, 10], [0, 10], [0, 0]]] },
      },
    ],
  },
};

/**
 * `TransformedData` with the sample fields and no rows, used for the "renders with empty data" check.
 *
 * @beta
 * @experimental
 */
export const emptyData: TransformedData = {
  rows: [],
  fields: [
    { key: 'region', type: 'string', label: 'Region' },
    { key: 'revenue', type: 'number', label: 'Revenue' },
    { key: 'group', type: 'string', label: 'Group' },
  ],
};
