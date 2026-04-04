# VizBox

A layered, open-source React + TypeScript UI library for data visualization widgets. General-purpose: works with tabular, hierarchical, geographic, and time-series data.

## Install

```bash
npm install vizbox
# peer deps
npm install react react-dom
# optional: for D3-based charts
npm install d3
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  CORE LAYER  (vizbox → WidgetContainer, ViewSwitcher │
│              CollapseManager, WidgetRegistry)        │
├─────────────────────────────────────────────────────┤
│  VISUALIZATION LAYER  (vizbox/viz)                  │
│  LineChart · HorizontalBarChart · PieChart          │
│  Choropleth · ForceGraph · TreeView · DataTable     │
│  + Plugin registry (registerVisualization)          │
│  + D3 adapter (createD3Visualization)               │
├─────────────────────────────────────────────────────┤
│  THEME LAYER  (vizbox/theme)                        │
│  ThemeProvider · useTheme · lightTheme · darkTheme  │
│  categoricalColor · sequentialColor · divergingColor│
├─────────────────────────────────────────────────────┤
│  TRANSFORM LAYER  (vizbox/transforms)               │
│  flatten · aggregate · pivot · groupBy              │
│  geoNormalize · TransformPipeline                   │
└─────────────────────────────────────────────────────┘
```

Each layer may only import from layers below it. The transform layer has zero React dependencies.

---

## 5-minute quickstart

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, groupBy } from 'vizbox';
import { HorizontalBarChart, DataTable, registerVisualization } from 'vizbox/viz';

// 1. Register the visualizations you want to switch between
registerVisualization('bar', HorizontalBarChart);
registerVisualization('table', DataTable);

// 2. Your raw data — any shape
const salesData = [
  { region: 'North', product: 'Widget A', revenue: 12000 },
  { region: 'North', product: 'Widget B', revenue: 8500 },
  { region: 'South', product: 'Widget A', revenue: 9300 },
  { region: 'South', product: 'Widget B', revenue: 14200 },
];

// 3. Wrap it all in ThemeProvider + WidgetContainer
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
        {(data) => (
          <ViewSwitcher
            views={['bar', 'table']}
            vizProps={{ data, width: 600, height: 360 }}
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

Runs data through a transform pipeline and provides the result to children via a render prop.

```tsx
<WidgetContainer data={raw} transforms={[flatten, aggregate({ groupBy: ['x'], aggregations: { y: 'sum' } })]}>
  {(transformedData) => <MyChart data={transformedData} width={500} height={300} />}
</WidgetContainer>
```

### ViewSwitcher

Renders a tab strip and the active visualization. Controlled or uncontrolled.

```tsx
<ViewSwitcher
  views={['bar', 'table', 'pie']}
  vizProps={{ data, width: 600, height: 400 }}
  activeView="bar"
  onViewChange={(view) => setActiveView(view)}
/>
```

### CollapseManager

Provides expand/collapse state and drill-down/roll-up navigation for hierarchical widgets.

```tsx
<CollapseManager defaultExpanded={['root']}>
  <TreeView data={hierarchicalData} width={400} height={500} />
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

| Key | Component | Required data shape |
|-----|-----------|---------------------|
| `line` | `LineChart` | rows with an x (string/date) and y (number) field |
| `bar` | `HorizontalBarChart` | rows with a label (string) and value (number) field |
| `pie` | `PieChart` | rows with a label and value field |
| `choropleth` | `Choropleth` | `TransformedData` with `.geo` from `geoNormalize` |
| `graph` | `ForceGraph` | rows with `id`/`label`, plus edge rows with `source`/`target` |
| `tree` | `TreeView` | `TransformedData` with `.hierarchy` (from `groupBy`) |
| `table` | `DataTable` | any rows |

All components accept `VisualizationProps` and infer `xField`/`yField` from field metadata when not specified.

---

## Adding a custom visualization

```tsx
import { registerVisualization } from 'vizbox';
import type { VisualizationProps } from 'vizbox/viz';

function BubbleChart({ data, width, height }: VisualizationProps) {
  // ... your SVG/canvas implementation
  return <svg width={width} height={height}>...</svg>;
}

registerVisualization('bubble', BubbleChart);

// Now use it in ViewSwitcher
<ViewSwitcher views={['bubble', 'table']} vizProps={...} />
```

---

## Plugging in a D3 chart

```tsx
import * as d3 from 'd3';
import { createD3Visualization, registerVisualization } from 'vizbox';
import type { D3ChartLifecycle } from 'vizbox/plugins';

const D3AreaChart: D3ChartLifecycle = {
  mount(container, data, width, height) {
    const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
    // ... initial render using data.rows
  },
  update(container, data, width, height) {
    // ... diff and update the existing SVG
  },
  destroy(container) {
    d3.select(container).selectAll('*').remove();
  },
};

registerVisualization('d3-area', createD3Visualization(D3AreaChart));
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
