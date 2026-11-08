// Source of the choropleth page. Compiled by `npm run typecheck:site`,
// rendered by __tests__/charts.test.tsx and embedded verbatim in the markdown.

// #region choropleth
import { lightTheme } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { Choropleth } from 'lumagrid/viz';

// Features need a string id and primitive properties. The geometry is not drawn by
// the library, so it can stay as GeoJSON for your own projection code.
export const tiles: TransformedData = {
  rows: [],
  fields: [],
  geo: {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', id: 'a', properties: { name: 'Tile A', value: 12 }, geometry: { type: 'Polygon', coordinates: [] } },
      { type: 'Feature', id: 'b', properties: { name: 'Tile B', value: 58 }, geometry: { type: 'Polygon', coordinates: [] } },
      { type: 'Feature', id: 'c', properties: { name: 'Tile C', value: 90 }, geometry: { type: 'Polygon', coordinates: [] } },
    ],
  },
};

// The library has no projection engine. Supply one SVG path string per feature id
// (for example from d3-geo's geoPath); without projectedPaths a placeholder is drawn.
export const projectedPaths: Record<string, string> = {
  a: 'M10,10 L190,10 L190,130 L10,130 Z',
  b: 'M200,10 L380,10 L380,130 L200,130 Z',
  c: 'M10,140 L380,140 L380,230 L10,230 Z',
};

export function Example() {
  return (
    <Choropleth
      data={tiles}
      width={400}
      height={240}
      theme={lightTheme}
      valueProperty="value"
      projectedPaths={projectedPaths}
      ariaLabel="Value by tile"
    />
  );
}
// #endregion

// #region choropleth-view
// The same chart as a ViewSwitcher view: register nativeChoroplethPlugin, then name it by id.
export const choroplethView = {
  id: 'choropleth',
  label: 'Map',
  config: { valueProperty: 'value', projectedPaths },
};
// #endregion
