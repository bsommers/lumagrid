// Source of the transforms chapter. Compiled by `npm run typecheck:site`,
// rendered and asserted by __tests__/snippets.test.tsx, embedded verbatim in the markdown.

// #region pipeline
import { WidgetContainer, HorizontalBarChart, lightTheme, flatten, aggregate } from 'lumagrid';
import type { PipelineStep } from 'lumagrid';

// Raw input: nested objects, as an API might return them.
const orders = [
  { region: 'North', order: { product: 'Widget A', revenue: 12000 } },
  { region: 'North', order: { product: 'Widget B', revenue: 8500 } },
  { region: 'South', order: { product: 'Widget A', revenue: 9300 } },
  { region: 'South', order: { product: 'Widget B', revenue: 14200 } },
];

// aggregate is a pre-configured object called as transform(data, options). A pipeline
// calls each step with the data only, so a step that needs options is closed over them.
const revenueByRegion: PipelineStep = {
  name: 'revenueByRegion',
  transform: (data) =>
    aggregate.transform(data, {
      groupBy: ['region'],
      aggregations: { 'order.revenue': 'sum' },
    }),
};

export function Example() {
  return (
    <WidgetContainer data={orders} transforms={[flatten, revenueByRegion]} width={600} height={300}>
      {(data, width, height) => (
        <HorizontalBarChart
          data={data}
          width={width}
          height={height}
          theme={lightTheme}
          valueField="order.revenue"
          labelField="region"
        />
      )}
    </WidgetContainer>
  );
}
// #endregion

// #region chaining
import { TransformPipeline, groupBy, pivot, geoNormalize } from 'lumagrid';
import type { GeoData } from 'lumagrid';

// flatten and PipelineStep come from the imports above.
// Long data: one row per region and quarter, normalized to TransformedData.
const quarterly = [
  { region: 'East', quarter: 'Q1', sales: 10 },
  { region: 'East', quarter: 'Q2', sales: 20 },
  { region: 'West', quarter: 'Q1', sales: 5 },
  { region: 'West', quarter: 'Q2', sales: 8 },
];
const flat = flatten.transform(quarterly);

// pivot called directly: the quarters become columns, one row per region.
export const wide = pivot.transform(flat, {
  columnField: 'quarter',
  valueField: 'sales',
  rowFields: ['region'],
});

const geoJson: GeoData = {
  type: 'FeatureCollection',
  features: [
    { type: 'Feature', id: 'East', properties: { name: 'East region' }, geometry: { type: 'Polygon', coordinates: [] } },
    { type: 'Feature', id: 'West', properties: { name: 'West region' }, geometry: { type: 'Polygon', coordinates: [] } },
  ],
};

// geoNormalize joins the grouped rows onto the features by the region column.
const joinRegions: PipelineStep = {
  name: 'geoNormalize',
  transform: (data) => geoNormalize.transform(data, { geoJson, idField: 'region' }),
};

// groupBy is a factory, so its result goes into the pipeline as it is. The pipeline
// starts from TransformedData: its first step receives the input as given.
export const grouped = new TransformPipeline([groupBy('region', 'sales'), joinRegions]).run(flat);
// #endregion
