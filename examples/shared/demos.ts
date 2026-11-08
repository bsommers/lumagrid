import type { TransformedData } from 'lumagrid';

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
