[← Project README](../../README.md)

# Getting started

Install Lumagrid, draw a first chart, and learn how the data model and the role field names fit together.

## Contents

- [Install](#install)
- [Your first chart](#your-first-chart)
- [How the data model works](#how-the-data-model-works)
- [Role field names](#role-field-names)
- [Registering plugins](#registering-plugins)
- [Next steps](#next-steps)

## Install

```bash
npm install lumagrid react react-dom
```

`react` and `react-dom` are peer dependencies. The built-in SVG charts need nothing else. The adapter plugins use their chart libraries from your own project, so install only the ones you use:

```bash
# optional: D3 charts
npm install d3
# optional: Recharts charts
npm install recharts
# optional: Nivo charts
npm install @nivo/bar
```

## Your first chart

Every example in this guide lives in a real, type-checked `.tsx` file under `docs/guide/snippets/` and is copied here unchanged. The imports are exactly what you write in your own project: `lumagrid` for the core, `lumagrid/viz` for the built-in charts.

<!-- snippet: quickstart#basic -->

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { nativeBarPlugin, nativeTablePlugin } from 'lumagrid/viz';

// 1. Register the plugins your views refer to, once, at application startup.
registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);

// 2. Data already in the library's shape: rows plus a description of each field.
const sales: TransformedData = {
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
};

// 3. Name the columns by role: revenue is the value, region is the label.
const views = [
  { id: 'bar', label: 'Bar chart', config: { valueField: 'revenue', labelField: 'region' } },
  { id: 'table', label: 'Table' },
];

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={sales} title="Revenue by region" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={views} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

What happens here:

- `ThemeProvider` supplies the theme. `'light'` and `'dark'` are shorthands; see [Theming](./theming.md) for custom themes.
- `WidgetContainer` runs `data` through the optional `transforms` pipeline and hands the result, plus the pixel width and height, to its render function. With numeric `width` and `height` it uses them as given; with CSS strings such as `'100%'` it measures the element with a `ResizeObserver`.
- `ViewSwitcher` draws a tab strip, one tab per entry in `views`, and renders the plugin whose id matches the active tab. `config` on a view is forwarded to that plugin.

## How the data model works

Charts do not read your raw objects. They read `TransformedData`, a small, uniform shape:

| Property | Type | Meaning |
|----------|------|---------|
| `rows` | `DataRow[]` | The tabular data. A `DataRow` maps string keys to string, number, boolean or `null`. Always present. |
| `fields` | `FieldMeta[]` | One entry per column: its `key`, a `type` (`'string'`, `'number'`, `'boolean'` or `'date'`) and an optional `label`. |
| `hierarchy` | `HierarchyNode` | Optional tree of nodes with `id`, `label`, an optional `value` and optional `children`. Produced by `groupBy`, read by the tree chart. |
| `geo` | `GeoData` | Optional GeoJSON feature collection. Produced by `geoNormalize`, read by the choropleth. |
| `meta` | `Record<string, unknown>` | Optional free-form metadata that transforms carry along. |

If your data is already in this shape, as in the example above, pass it straight to `WidgetContainer`. If it is not, pass the raw data and a `transforms` list; the first transform turns it into `TransformedData`. The [Transforms](./transforms.md) chapter covers the five built-in transforms.

When a chart is not told which columns to use, it infers them from `fields`; the bar and pie charts take the first `number` field as the value and the first `string` field as the label. Naming the columns explicitly, as the example does, is clearer and survives reordered columns.

## Role field names

Native charts name their columns by role, and the same role name means the same thing in every chart. Pass them in a view's `config`, for example `config: { valueField: 'revenue', labelField: 'region' }`.

| Chart (plugin id) | `valueField` | `labelField` | `idField` | `colorField` |
|-------------------|--------------|--------------|-----------|--------------|
| Bar (`bar`) | bar length | bar label | | |
| Line (`line`) | y value | x category | | series split |
| Pie (`pie`) | slice size | slice label | | |
| Choropleth (`choropleth`) | color value (`valueProperty` wins) | | | |
| Force graph (`force-graph`) | | node label | node id | |

A role prop that is left out falls back to the legacy alias if the chart has one, and then to a column inferred from `fields`. The force graph falls back to the literal `id` and `label` columns, and the choropleth to `value`. The full resolution rules are in [STABILITY](../STABILITY.md#field-props).

The older `xField` and `yField` props still work but are deprecated and will be removed in 2.0. When a role name and its alias are both passed, the role name wins.

## Registering plugins

A view refers to a chart by plugin id, and `ViewSwitcher` can only draw ids that have been registered. Call `registerPlugin` once at startup, before the first render. Registering the same id twice replaces the earlier plugin (outside production builds it also logs a console warning). If a view names an id that is not registered, `ViewSwitcher` shows a message asking you to call `registerPlugin`.

The seven built-in plugins come from `lumagrid/viz`:

| Plugin id | Preset | Chart | Data it needs |
|-----------|--------|-------|---------------|
| `table` | `nativeTablePlugin` | `DataTable` | any rows |
| `bar` | `nativeBarPlugin` | `HorizontalBarChart` | a label field and a number field |
| `line` | `nativeLinePlugin` | `LineChart` | a label (string or date) and a number field |
| `pie` | `nativePiePlugin` | `PieChart` | a label field and a number field |
| `tree` | `nativeTreePlugin` | `TreeView` | `hierarchy`, for example from `groupBy` |
| `choropleth` | `nativeChoroplethPlugin` | `Choropleth` | `geo`, from `geoNormalize` |
| `force-graph` | `nativeForceGraphPlugin` | `ForceGraph` | node rows with `id` and `label`, plus edge rows with `source` and `target` |

To draw with D3, Recharts or Nivo instead, or to write your own plugin, see [Plugins and adapters](./plugins-and-adapters.md).

## Next steps

- [Charts](./charts/README.md): one reference page per native chart, with props, examples and rendered images.
- [Transforms](./transforms.md): reshape raw data with `flatten`, `aggregate`, `pivot`, `groupBy` and `geoNormalize`.
- [Theming](./theming.md): `ThemeProvider`, `ThemeDefinition` and the color scale helpers.
- [Plugins and adapters](./plugins-and-adapters.md): the plugin contract and the D3, Recharts and Nivo adapters.
- [Troubleshooting](./troubleshooting.md): common problems and their fixes.
