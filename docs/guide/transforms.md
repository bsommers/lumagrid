[← Project README](../../README.md)

# Transforms

Reshape raw data into the `TransformedData` shape that charts read, with five built-in transforms and a pipeline that chains them.

## Contents

- [The five transforms at a glance](#the-five-transforms-at-a-glance)
- [flatten](#flatten)
- [aggregate](#aggregate)
- [pivot](#pivot)
- [groupBy](#groupby)
- [geoNormalize](#geonormalize)
- [Pipelines and WidgetContainer](#pipelines-and-widgetcontainer)
- [Chaining transforms](#chaining-transforms)

All transforms are pure functions with no React dependency, exported from `lumagrid` and from `lumagrid/transforms`. They never modify their input. Every result keeps the input's `meta`, and the transforms that start from `TransformedData` (all except `flatten`) also keep its `hierarchy` and `geo`.

## The five transforms at a glance

| Transform | Input | Options | Output |
|-----------|-------|---------|--------|
| `flatten` | an array of objects | `separator` (default `'.'`) | `rows` with nested keys joined into flat keys |
| `aggregate` | `TransformedData` | `groupBy`, `aggregations` | one row per group with aggregated numbers |
| `pivot` | `TransformedData` | `columnField`, `valueField`, `rowFields`, `aggregation` | long data turned wide: one column per distinct value |
| `groupBy(field, valueField?)` | `TransformedData` | `field`, `valueField`, `rootLabel` (override the factory arguments) | one row per group, plus a `hierarchy` |
| `geoNormalize` | `TransformedData` | `geoJson`, `idField` | the same data plus a `geo` feature collection |

Two calling conventions exist, and mixing them up is the most common mistake:

- `flatten`, `aggregate`, `pivot` and `geoNormalize` are ready-made objects. You call them as `transform.transform(data, options)`. `aggregate`, `pivot` and `geoNormalize` return their input unchanged when called without options, so a forgotten option fails silently.
- `groupBy` is a factory. `groupBy('region', 'revenue')` returns a configured transform that you then use as it is.

## flatten

Turns an array of possibly nested objects into flat rows. Nested keys are joined with the separator, and `fields` is inferred from the values: `number`, `boolean`, `date` (strings that parse as dates but not as numbers) or `string`.

For example, `flatten.transform([{ a: { b: 1, c: { d: 2 } } }])` gives the single row `{ 'a.b': 1, 'a.c.d': 2 }`, and the same call with `{ separator: '_' }` on `[{ a: { b: 1 } }]` gives `{ a_b: 1 }`.

Also: `Date` values become ISO strings, array values become their `String()` form (`[1, 2, 3]` becomes `'1,2,3'`), `null` is kept, and an item that is not a plain object becomes an empty row. An empty input gives empty `rows` and `fields`.

`flatten` is the usual first step because it accepts raw input. The `pipeline` example in [Pipelines and WidgetContainer](#pipelines-and-widgetcontainer) shows it feeding `aggregate`.

## aggregate

Groups rows by one or more fields and reduces other fields with an aggregation function.

| Option | Type | Meaning |
|--------|------|---------|
| `groupBy` | `string[]` | Fields that identify a group. Their values stay in the output rows. |
| `aggregations` | `Record<string, AggregationFn>` | Field name mapped to one of `sum`, `avg`, `min`, `max`, `count`, `first`, `last`. |

Given these rows:

```json
[
  { "region": "East", "sales": 100, "returns": 5 },
  { "region": "East", "sales": 200, "returns": 10 },
  { "region": "West", "sales": 150, "returns": 3 }
]
```

`aggregate.transform(data, { groupBy: ['region'], aggregations: { sales: 'sum' } })` yields the East row with `sales` 300 and the West row with 150. Changing the function to `avg` gives 150 for East, `min` gives 100, `max` gives 200, and `count` gives 2 (the number of rows in the group, whatever their values). `first` and `last` follow row order within the group.

The output `fields` list the group keys as `string` and the aggregated fields as `number`. Only numeric values take part in `sum`, `avg`, `min`, `max`, `first` and `last`; a group with no numeric values gives 0.

## pivot

Turns long data into wide data.

| Option | Type | Meaning |
|--------|------|---------|
| `columnField` | `string` | The field whose distinct values become new columns. |
| `valueField` | `string` | The field that fills the cells. |
| `rowFields` | `string[]` | The fields that identify each output row. |
| `aggregation` | `'first' \| 'sum' \| 'last'` | What to do when several rows land in one cell. Default `'first'`. |

Given these rows:

```json
[
  { "region": "East", "quarter": "Q2", "sales": 20 },
  { "region": "East", "quarter": "Q1", "sales": 10 },
  { "region": "West", "quarter": "Q1", "sales": 5 },
  { "region": "East", "quarter": "Q1", "sales": 7 }
]
```

`pivot.transform(data, { columnField: 'quarter', valueField: 'sales', rowFields: ['region'] })` yields:

```json
[
  { "region": "East", "Q1": 10, "Q2": 20 },
  { "region": "West", "Q1": 5, "Q2": null }
]
```

The new columns are sorted alphabetically, rows keep first-seen order, and a cell with no data is `null`. With `aggregation: 'sum'` the East `Q1` cell is 17 (10 plus 7); with `'last'` it is 7. Cell values that are numeric strings are parsed, and anything else counts as 0. The output `fields` list the row fields as `string` and the new columns as `number`.

## groupBy

`groupBy(field, valueField?)` returns a transform that groups rows by `field` and builds both a flat summary and a two-level hierarchy. This is the transform that produces `hierarchy`, which the tree chart reads.

Given these rows:

```json
[
  { "team": "red", "score": 3 },
  { "team": "blue", "score": 4 },
  { "team": "red", "score": "x" },
  { "team": null, "score": 1 },
  { "team": "red", "score": 2 }
]
```

`groupBy('team').transform(data).rows` counts rows per group, puts rows with a missing key in a `'(blank)'` group, and keeps first-seen order:

```json
[
  { "team": "red", "count": 3 },
  { "team": "blue", "count": 1 },
  { "team": "(blank)", "count": 1 }
]
```

With a value field, `groupBy('team', 'score')` adds the sum of the numeric values: the `red` row becomes `{ "team": "red", "count": 3, "score": 5 }`. The hierarchy has a root node with id `'root'` and the field name as label, and one child per group. A child's `value` is the summed value field, or the row count when there is no value field. Its `data` is the first row of the group. Options passed at call time (`field`, `valueField`, `rootLabel`) override the factory arguments, so `rootLabel: 'All'` renames the root.

## geoNormalize

Joins rows to the features of a GeoJSON feature collection by a shared id and copies each row's values into the matching feature's `properties`. This is the transform that produces `geo`, which the choropleth reads.

| Option | Type | Meaning |
|--------|------|---------|
| `geoJson` | `GeoData` | A `FeatureCollection` whose features each have a string `id`. |
| `idField` | `string` | The row field that holds the feature id. Default `'id'`. |

For a row `{ id: 'CA', value: 39, flag: true, note: null }` and a feature with id `'CA'` and properties `{ name: 'California', value: 0 }`, the joined properties are:

```json
{ "name": "California", "id": "CA", "value": 39, "flag": 1, "note": null }
```

Row values override existing properties of the same name, booleans become 1 or 0, features without a matching row are left as they were, and rows without a matching feature are ignored. `rows` and `fields` pass through untouched, and the source GeoJSON is not modified.

## Pipelines and WidgetContainer

`WidgetContainer` takes the raw `data` and an optional `transforms` list, builds a `TransformPipeline` from the list and passes the result to its render function. If you leave `transforms` out, `data` must already be `TransformedData`.

The first step receives your raw input. Every later step receives only the data from the step before it: a pipeline never passes options. A step that needs options therefore has to be closed over them, as `revenueByRegion` does below.

<!-- snippet: transforms#pipeline -->

```tsx
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
```

`flatten` turns the nested `order` objects into the flat key `order.revenue`, `revenueByRegion` sums it per region, and the chart draws one bar per region: North 20,500 and South 23,500. The chart is a native component used directly, so no plugin registration is involved.

`WidgetContainer` recomputes the pipeline whenever `data` or `transforms` changes identity. Define both outside the component, or memoize them, so that an unrelated re-render does not rerun the transforms.

### TransformPipeline

`new TransformPipeline(steps)` composes steps for use outside React. It needs at least one step and throws otherwise. `run(input)` returns the final `TransformedData`, and `stepNames` lists the step names, which is handy for debugging.

A step is a `PipelineStep`: an object with a `name` and a `transform(data: TransformedData)` method. That type has one consequence worth knowing: `flatten` takes an array of objects, not `TransformedData`, so TypeScript does not accept it directly as a `TransformPipeline` step, although it is accepted in the `transforms` prop of `WidgetContainer`. Start a standalone pipeline from data that is already `TransformedData` (for example the result of `flatten.transform(...)`), as the next example does.

## Chaining transforms

The second example calls `pivot` directly, then chains `groupBy` and `geoNormalize` in a pipeline. The data is one row per region and quarter:

<!-- snippet: transforms#chaining -->

```tsx
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
```

The results are:

- `wide.rows` is `[{ region: 'East', Q1: 10, Q2: 20 }, { region: 'West', Q1: 5, Q2: 8 }]`.
- `grouped.rows` is `[{ region: 'East', count: 2, sales: 30 }, { region: 'West', count: 2, sales: 13 }]`.
- `grouped.hierarchy` has the root label `'region'` and two children: `East` with value 30 and `West` with value 13. This is what the tree chart draws.
- `grouped.geo` holds the two features with the grouped values merged into their properties, for example `{ name: 'East region', region: 'East', count: 2, sales: 30 }`. This is what the choropleth draws.

So a single pipeline can produce `rows`, `hierarchy` and `geo` at once, and one `ViewSwitcher` can then offer a bar chart, a tree and a map over the same data. For the next step see [Theming](./theming.md), or return to [Getting started](./getting-started.md).
