# VizBox

A layered React + TypeScript UI library for data visualization widgets. Works with tabular, hierarchical, geographic, and time-series data. Plug in any chart library — built-in SVG charts, D3, Recharts, Nivo, or your own.

## Install

```bash
npm install vizbox
# peer deps
npm install react react-dom
# optional: for D3-based charts
npm install d3
# optional: for Recharts-based charts
npm install recharts
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
import { ThemeProvider, WidgetContainer, ViewSwitcher, groupBy, registerPlugin } from 'vizbox';
import { nativeBarPlugin, nativeTablePlugin } from 'vizbox/viz';

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
<WidgetContainer data={raw} transforms={[flatten, aggregate({ groupBy: ['x'], aggregations: { y: 'sum' } })]}>
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
import { TransformPipeline, flatten, aggregate, groupBy } from 'vizbox';

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
import { registerPlugin } from 'vizbox';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
  nativeChoroplethPlugin,
  nativeForceGraphPlugin,
} from 'vizbox/viz';

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
| `line` | LineChart | rows with x (string/date) and y (number) fields |
| `bar` | HorizontalBarChart | rows with a label (string) and value (number) field |
| `pie` | PieChart | rows with a label and value field |
| `choropleth` | Choropleth | `TransformedData` with `.geo` from `geoNormalize` |
| `force-graph` | ForceGraph | rows with `id`/`label`, plus edge rows with `source`/`target` |
| `tree` | TreeView | `TransformedData` with `.hierarchy` from `groupBy` |
| `table` | DataTable | any rows |

---

## Plugging in a D3 chart

```tsx
import * as d3 from 'd3';
import { createD3Plugin, registerPlugin } from 'vizbox';

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

The `D3Theme` passed to mount/update has: `colors`, `sequentialColors`, `fontFamily`, `fontSize`, `background`, `foreground`, `border`. It's derived automatically from the active VizBox theme.

---

## Plugging in a Recharts chart

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { createRechartsPlugin, registerPlugin } from 'vizbox';

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

## Writing a custom plugin from scratch

```tsx
import { registerPlugin } from 'vizbox';
import type { ChartPlugin } from 'vizbox';

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
import type { ThemeDefinition } from 'vizbox';
import { lightTheme, ThemeProvider } from 'vizbox';

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

## License

MIT
