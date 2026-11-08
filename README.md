# Lumagrid

A layered React + TypeScript UI library for data visualization widgets. Works with tabular, hierarchical, geographic, and time-series data. Plug in any chart library — built-in SVG charts, D3, Recharts, Nivo, or your own.

## Install

```bash
npm install lumagrid
# peer deps
npm install react react-dom
# optional: for D3-based charts
npm install d3
# optional: for Recharts-based charts
npm install recharts
# optional: for Nivo-based charts
npm install @nivo/bar
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CONTAINER LAYER                                        │
│  WidgetContainer  (ResizeObserver, pipeline, title)     │
│  ViewSwitcher     (tab strip, delegates to plugin)      │
│  CollapseManager  (expand/collapse drill-down)          │
├─────────────────────────────────────────────────────────┤
│  PLUGIN REGISTRY  src/registry/                         │
│  ChartPlugin<TData, TTheme, TConfig>                    │
│    dataAdapter:  TransformedData → TData                │
│    themeAdapter: ThemeDefinition → TTheme               │
│    Renderer:     { data, theme, width, height, config } │
├─────────────────────────────────────────────────────────┤
│  THEME LAYER  src/theme/                                │
│  ThemeProvider · useTheme · lightTheme · darkTheme      │
│  categoricalColor · sequentialColor · divergingColor    │
├─────────────────────────────────────────────────────────┤
│  TRANSFORM LAYER  src/transforms/                       │
│  flatten · aggregate · pivot · groupBy · geoNormalize   │
│  TransformPipeline                                      │
└─────────────────────────────────────────────────────────┘
```

Each layer may only import from layers below it. The transform layer has zero React dependencies.

---

## 5-minute quickstart

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, groupBy, registerPlugin } from 'lumagrid';
import { nativeBarPlugin, nativeTablePlugin } from 'lumagrid/viz';

// 1. Register the plugins you want to switch between (once at app startup)
registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);

// 2. Your raw data — any shape
const salesData = [
  { region: 'North', product: 'Widget A', revenue: 12000 },
  { region: 'North', product: 'Widget B', revenue: 8500 },
  { region: 'South', product: 'Widget A', revenue: 9300 },
  { region: 'South', product: 'Widget B', revenue: 14200 },
];

// 3. Wrap in ThemeProvider + WidgetContainer
export function SalesWidget() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer
        data={salesData}
        transforms={[groupBy('region', 'revenue')]}
        title="Revenue by Region"
        width={600}
        height={400}
      >
        {(data, width, height) => (
          <ViewSwitcher
            views={[{ id: 'bar', label: 'Bar Chart' }, { id: 'table', label: 'Table' }]}
            data={data}
            width={width}
            height={height}
          />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

---

## Core concepts

### WidgetContainer

Runs data through a transform pipeline and provides the result to children via a render prop. Supports fluid sizing via ResizeObserver — pass `width="100%"` and let the DOM drive the dimensions.

```tsx
<WidgetContainer data={raw} transforms={[flatten, groupBy('x', 'y')]}>
  {(transformedData, width, height) => (
    <ViewSwitcher views={[{ id: 'bar' }]} data={transformedData} width={width} height={height} />
  )}
</WidgetContainer>
```

### ViewSwitcher

Renders a tab strip and the active plugin. Controlled or uncontrolled.

```tsx
<ViewSwitcher
  views={[
    { id: 'bar', label: 'Bar Chart' },
    { id: 'table', label: 'Table' },
    { id: 'my-d3-chart', label: 'Custom' },
  ]}
  data={data}
  width={600}
  height={400}
  activeView="bar"
  onViewChange={(id) => setActiveView(id)}
/>
```

### CollapseManager

Provides expand/collapse state and drill-down/roll-up navigation for hierarchical widgets.

```tsx
<CollapseManager defaultExpanded={['root']}>
  <TreeView data={hierarchicalData} width={400} height={500} theme={theme} />
</CollapseManager>
```

Access from any descendant:

```tsx
const { drillDown, rollUp, drillPath, isExpanded, toggle } = useCollapse();
```

### Transform pipeline

```tsx
import { TransformPipeline, flatten, aggregate, groupBy } from 'lumagrid';

const pipeline = new TransformPipeline([
  flatten,                            // normalize nested objects
  groupBy('category', 'revenue'),     // group + build hierarchy
]);

const result = pipeline.run(rawData); // → TransformedData
```

---

## Built-in visualizations

Register any of the pre-built native plugins at startup:

```tsx
import { registerPlugin } from 'lumagrid';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
  nativeChoroplethPlugin,
  nativeForceGraphPlugin,
} from 'lumagrid/viz';

registerPlugin(nativeBarPlugin);    // id: 'bar'
registerPlugin(nativeLinePlugin);   // id: 'line'
registerPlugin(nativePiePlugin);    // id: 'pie'
registerPlugin(nativeTablePlugin);  // id: 'table'
registerPlugin(nativeTreePlugin);   // id: 'tree'
registerPlugin(nativeChoroplethPlugin); // id: 'choropleth'
registerPlugin(nativeForceGraphPlugin); // id: 'force-graph'
```

| Plugin id | Chart | Required data shape |
|-----------|-------|---------------------|
| `line` | LineChart | rows with a label (string/date) and a value (number) field |
| `bar` | HorizontalBarChart | rows with a label (string) and value (number) field |
| `pie` | PieChart | rows with a label and value field |
| `choropleth` | Choropleth | `TransformedData` with `.geo` from `geoNormalize` |
| `force-graph` | ForceGraph | rows with `id`/`label`, plus edge rows with `source`/`target` |
| `tree` | TreeView | `TransformedData` with `.hierarchy` from `groupBy` |
| `table` | DataTable | any rows |

`ForceGraph` re-runs its layout when the set of nodes or edges changes (warm-started from the previous positions, so the graph evolves rather than jumps). Resizing never re-runs it. Experimental options (see [Stability](#stability)), passed via the view's `config`:

| Option | Default | Effect |
|--------|---------|--------|
| `relayout` | `true` | `false` keeps existing node positions on data changes; new nodes get their seeded start position, removed nodes are dropped |
| `seed` | `1` | Deterministic initial placement |
| `iterations` | `60` | Simulation steps per layout run |

### Field props

Charts name their columns by role. Pass them in the view's `config`, for example `config: { valueField: 'revenue', labelField: 'region' }`. A role prop that is omitted falls back to a column inferred from the data (see [docs/STABILITY.md](docs/STABILITY.md#field-props)).

| Chart (plugin id) | `valueField` | `labelField` | `idField` | `colorField` |
|-------------------|--------------|--------------|-----------|--------------|
| Bar (`bar`) | bar length | bar label | | |
| Line (`line`) | y value | x category | | series split |
| Pie (`pie`) | slice size | slice label | | |
| Choropleth (`choropleth`) | color value (`valueProperty` wins) | | | |
| Force graph (`force-graph`) | | node label | node id | |

The legacy `xField` and `yField` props still work but are deprecated and will be removed in 2.0. The role name wins when both are passed. The mapping per chart is in [docs/STABILITY.md](docs/STABILITY.md#field-props).

---

## Plugging in a D3 chart

```tsx
import * as d3 from 'd3';
import { createD3Plugin, registerPlugin } from 'lumagrid';

registerPlugin(createD3Plugin({
  id: 'bubble',
  label: 'Bubble Chart',
  dataAdapter: (data) => data.rows,    // reshape for D3
  mount(el, rows, theme, w, h) {
    const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);
    svg.selectAll('circle')
      .data(rows)
      .join('circle')
      .attr('cx', (d) => Number(d['x'] ?? 0))
      .attr('cy', (d) => Number(d['y'] ?? 0))
      .attr('r', 6)
      .attr('fill', theme.colors[0] ?? 'steelblue');  // theme is D3Theme
  },
  update(el, rows, theme, w, h) {
    // d3 update pattern
  },
  destroy(el) {
    d3.select(el).selectAll('*').remove();
  },
}));
```

The `D3Theme` passed to mount/update has: `colors`, `sequentialColors`, `fontFamily`, `fontSize`, `background`, `foreground`, `border`. It's derived automatically from the active Lumagrid theme.

---

## Plugging in a Recharts chart

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { createRechartsPlugin, registerPlugin } from 'lumagrid';

registerPlugin(createRechartsPlugin({
  id: 'recharts-bar',
  label: 'Bar (Recharts)',
  Renderer: ({ data, theme, width, height, config }) => (
    <BarChart width={width} height={height} data={data}>
      <CartesianGrid stroke={theme.gridColor} />
      <XAxis dataKey={config?.nameKey ?? 'name'} tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
      <YAxis tick={{ fill: theme.textColor }} />
      <Tooltip />
      <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0]} />
    </BarChart>
  ),
}));
```

---

## Plugging in a Nivo chart

```tsx
import { ResponsiveBar } from '@nivo/bar';
import { createNivoPlugin, registerPlugin } from 'lumagrid';

registerPlugin(createNivoPlugin<{ name: string; value: number }[], { dataKey?: string; nameKey?: string }>({
  id: 'nivo-bar',
  label: 'Bar (Nivo)',
  dataAdapter: (data) => data.rows as { name: string; value: number }[],
  Renderer: ({ data, theme, width, height, config }) => (
    <div style={{ width, height }}>
      <ResponsiveBar
        data={data}
        keys={[config?.dataKey ?? 'value']}
        indexBy={config?.nameKey ?? 'name'}
        theme={theme}
        colors={theme.colors}
      />
    </div>
  ),
}));
```

`createNivoPlugin` requires `dataAdapter` — Nivo chart types disagree too much on
data shape (bar wants flat rows, pie wants `{id, value}[]`, line wants
`{id, data: [{x,y}]}[]`) for a safe default. The `NivoTheme` passed to `Renderer`
mirrors Nivo's own `theme` prop shape (`background`, `text`, `axis`, `grid`,
`tooltip`), plus a `colors` array for Nivo's separate `colors` prop — pass both
straight through with no reshaping.

---

## Writing a custom plugin from scratch

```tsx
import { registerPlugin } from 'lumagrid';
import type { ChartPlugin } from 'lumagrid';

const heatmapPlugin: ChartPlugin<number[][], HeatmapTheme, HeatmapConfig> = {
  id: 'heatmap',
  label: 'Heatmap',
  dataAdapter(data, config) {
    // reshape TransformedData → 2D number array
    return /* ... */;
  },
  themeAdapter(theme, config) {
    return { colors: theme.colors.sequential };
  },
  Renderer({ data, theme, width, height }) {
    return <canvas width={width} height={height} /* ... */ />;
  },
};

registerPlugin(heatmapPlugin);
```

---

## Custom theme

```tsx
import type { ThemeDefinition } from 'lumagrid';
import { lightTheme, ThemeProvider } from 'lumagrid';

const brandTheme: ThemeDefinition = {
  ...lightTheme,
  name: 'brand',
  colors: {
    ...lightTheme.colors,
    categorical: ['#0055ff', '#ff6600', '#00cc88', '#cc00ff'],
  },
  surface: {
    ...lightTheme.surface,
    borderRadius: '12px',
  },
};

<ThemeProvider theme={brandTheme}>
  ...
</ThemeProvider>
```

---

## Stability

The public API is being frozen for 1.0. Every export is tagged `@public` (frozen) or `@experimental` (may change in a minor release) in its TSDoc. The tag policy, the stable and experimental lists, the registry conventions and how the API surface is checked are in [docs/STABILITY.md](docs/STABILITY.md). Changes are recorded in [CHANGELOG.md](CHANGELOG.md).

## License

Apache License 2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
