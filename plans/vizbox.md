> Historical document — written before Phase 5; names have since been updated to Lumagrid, but the content describes the earlier codebase.

# Lumagrid — Build Plan

## Stack
- React + TypeScript (strict mode)
- Open-source npm package
- General-purpose data (tabular, hierarchical, geographic, time-series)

## Architecture (bottom → top)

```
┌─────────────────────────────────────────┐
│  UI Widget Layout Layer                 │
│  /src/core/  (container, view-switcher, │
│   collapse-manager, registry)           │
├─────────────────────────────────────────┤
│  Visualization Layer                    │
│  /src/viz/  (line, bar, pie, choropleth,│
│   graph, tree, table, plugin registry)  │
├─────────────────────────────────────────┤
│  Theme / Styling Layer                  │
│  /src/theme/  (ThemeProvider, palettes, │
│   color scales, light/dark themes)      │
├─────────────────────────────────────────┤
│  Data Transformation Layer              │
│  /src/transforms/  (flatten, aggregate, │
│   pivot, group-by, geo-normalize,       │
│   pipeline)                             │
└─────────────────────────────────────────┘
```

## Implementation Order

1. Scaffold repo (package.json, tsconfig.json)
2. Transform layer — interfaces + 5 built-ins + pipeline + tests
3. Theme layer — ThemeDefinition, ThemeProvider, useTheme, light/dark
4. Core layer — WidgetContainer, WidgetRegistry, ViewSwitcher, CollapseManager
5. Viz layer — 7 built-in visualizations + plugin registry + D3 adapter
6. Public barrel export (`/src/index.ts`)
7. README

## Success Criteria

The following must type-check and render:

```tsx
import { WidgetContainer, ViewSwitcher, ThemeProvider } from 'lumagrid';
import { HorizontalBarChart, DataTable, registerVisualization } from 'lumagrid/viz';
import { groupBy } from 'lumagrid/transforms';

registerVisualization('bar', HorizontalBarChart);
registerVisualization('table', DataTable);

<ThemeProvider theme="dark">
  <WidgetContainer data={myData} transforms={[groupBy('category')]}>
    <ViewSwitcher views={['bar', 'table']} />
  </WidgetContainer>
</ThemeProvider>
```

## Code Standards
- No `any`, no `as unknown`
- Each file ≤ 200 lines
- No runtime deps beyond React / react-dom (D3 is optional peer dep)
- All props fully typed with exported interfaces
- No default exports except React components

## File Structure

```
lumagrid/
  package.json
  tsconfig.json
  README.md
  src/
    transforms/
      types.ts
      flatten.ts
      aggregate.ts
      pivot.ts
      group-by.ts
      geo-normalize.ts
      pipeline.ts
      index.ts
      __tests__/
    theme/
      types.ts
      light.ts
      dark.ts
      color-scale.ts
      provider.tsx
      index.ts
    core/
      registry.ts
      container.tsx
      view-switcher.tsx
      collapse-manager.tsx
      index.ts
    viz/
      types.ts
      registry.ts
      line-chart.tsx
      horizontal-bar-chart.tsx
      pie-chart.tsx
      choropleth.tsx
      force-graph.tsx
      tree-view.tsx
      data-table.tsx
      index.ts
    plugins/
      d3-adapter.tsx
      index.ts
    index.ts
```
