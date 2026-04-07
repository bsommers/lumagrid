# Refactor: First-Class Plugin Architecture

## Why

The current codebase has these structural problems that need fixing:

1. **Dual registries** — `src/core/registry.ts` and `src/viz/registry.ts` are identical. Neither is authoritative. The `ViewSwitcher` uses core's, the public API exports both. Consumers don't know which one to call; in practice calling either silently goes to different maps.

2. **Layer violation** — `src/core/registry.ts` imports `VisualizationProps` from `../viz/types.js`. Core must not depend on Viz.

3. **No adapter contract** — Plugging in Recharts, Nivo, or Victory requires hand-mapping `TransformedData` to each library's format on every use. There's no standard interface.

4. **Theme is invisible to plugins** — Built-ins call `useTheme()`. External charts (D3, Recharts) get zero theme propagation. Every plugin either ignores theming or reimplements it from scratch.

5. **Two incompatible plugin interfaces** — Built-ins implement `VisualizationProps`. D3 implements `D3ChartLifecycle`. There is no unified concept of "a chart."

6. **No responsive sizing** — `width` and `height` are threaded as props. No `ResizeObserver` support when the container is fluid (`width: '100%'`).

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CONTAINER LAYER                                        │
│  WidgetContainer  (ResizeObserver, pipeline, title)     │
│  ViewSwitcher     (tab strip, delegates to plugin)      │
│  CollapseManager  (unchanged)                           │
├─────────────────────────────────────────────────────────┤
│  PLUGIN REGISTRY  src/registry/                         │
│  ChartPlugin<TData, TTheme, TConfig>                    │
│    dataAdapter:  TransformedData → TData                │
│    themeAdapter: ThemeDefinition → TTheme               │
│    Renderer:     { data, theme, width, height, config } │
├─────────────────────────────────────────────────────────┤
│  THEME LAYER  src/theme/  (unchanged)                   │
├─────────────────────────────────────────────────────────┤
│  TRANSFORM LAYER  src/transforms/  (unchanged)          │
└─────────────────────────────────────────────────────────┘
```

`ViewSwitcher` flow per render:
1. Look up active plugin from registry
2. Call `plugin.dataAdapter(transformedData, config)` → `TData`
3. Call `plugin.themeAdapter(theme)` → `TTheme`
4. Render `<plugin.Renderer data={libData} theme={libTheme} width={w} height={h} config={config} />`

---

## New Files to Create

### `src/registry/types.ts`

```ts
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';

export interface RendererProps<TData, TTheme, TConfig = Record<string, unknown>> {
  data: TData;
  theme: TTheme;
  width: number;
  height: number;
  config?: TConfig;
}

export interface ChartPlugin<
  TData = unknown,
  TTheme = unknown,
  TConfig = Record<string, unknown>,
> {
  /** Unique identifier used to register and look up this plugin. */
  id: string;
  /**
   * Converts VizBox TransformedData into whatever format this library expects.
   * Called on every render when data or config changes.
   */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  /**
   * Converts VizBox ThemeDefinition into the styling tokens this library expects.
   * Called on every render when the theme changes.
   */
  themeAdapter: (theme: ThemeDefinition, config?: TConfig) => TTheme;
  /** The actual chart component. Receives adapted data and theme — no VizBox internals. */
  Renderer: React.ComponentType<RendererProps<TData, TTheme, TConfig>>;
  /** Human-readable display name for the tab strip. Defaults to id. */
  label?: string;
}

/** Per-view config stored in ViewSwitcher's views prop. */
export interface ViewSpec<TConfig = Record<string, unknown>> {
  /** Registered plugin id. */
  id: string;
  /** Optional chart-specific config forwarded to dataAdapter, themeAdapter, and Renderer. */
  config?: TConfig;
  /** Override display label for this view's tab. */
  label?: string;
}
```

### `src/registry/index.ts`

```ts
import type { ChartPlugin } from './types.js';

// Single module-level registry — the only one in the codebase.
const plugins = new Map<string, ChartPlugin<unknown, unknown, unknown>>();

export function registerPlugin<TData, TTheme, TConfig>(
  plugin: ChartPlugin<TData, TTheme, TConfig>,
): void {
  plugins.set(plugin.id, plugin as ChartPlugin<unknown, unknown, unknown>);
}

export function getPlugin(id: string): ChartPlugin<unknown, unknown, unknown> | undefined {
  return plugins.get(id);
}

export function listPlugins(): string[] {
  return [...plugins.keys()];
}

/** Convenience: register a plugin and immediately return its id. */
export function registerAndGetId<TData, TTheme, TConfig>(
  plugin: ChartPlugin<TData, TTheme, TConfig>,
): string {
  registerPlugin(plugin);
  return plugin.id;
}
```

### `src/registry/native-plugin.tsx`

Helper that wraps any component that already uses VizBox internals (the existing built-in SVG charts) as a `ChartPlugin` with identity adapters. This lets built-ins participate in the registry without being rewritten.

```tsx
import React from 'react';
import type { ComponentType } from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { ChartPlugin, RendererProps } from './types.js';

/** Props that built-in SVG charts currently accept. */
export interface NativeChartProps {
  data: TransformedData;
  width: number;
  height: number;
  theme: ThemeDefinition;
  xField?: string;
  yField?: string;
  colorField?: string;
  labelField?: string;
  ariaLabel?: string;
  [key: string]: unknown;
}

export type NativeConfig = Omit<NativeChartProps, 'data' | 'width' | 'height' | 'theme'>;

/**
 * Wraps an existing VizBox native SVG chart component as a ChartPlugin.
 *
 * @example
 * registerPlugin(createNativePlugin('bar', HorizontalBarChart));
 */
export function createNativePlugin(
  id: string,
  Component: ComponentType<NativeChartProps>,
  label?: string,
): ChartPlugin<TransformedData, ThemeDefinition, NativeConfig> {
  function NativeRenderer({
    data, theme, width, height, config,
  }: RendererProps<TransformedData, ThemeDefinition, NativeConfig>): React.ReactElement {
    return <Component data={data} theme={theme} width={width} height={height} {...config} />;
  }
  NativeRenderer.displayName = `NativePlugin(${id})`;

  return {
    id,
    label: label ?? id,
    dataAdapter: (data) => data,
    themeAdapter: (theme) => theme,
    Renderer: NativeRenderer,
  };
}
```

---

## Files to Modify

### `src/core/view-switcher.tsx` — rewrite to use plugin registry

Key changes:
- Drop the `vizProps: VisualizationProps` prop
- Accept `views: ViewSpec[]` and `data: TransformedData` + `width/height`
- Look up plugin from registry on each render
- Call `dataAdapter` → `themeAdapter` → `Renderer`

```tsx
import React, { useState } from 'react';
import { useTheme } from '../theme/provider.js';
import { getPlugin } from '../registry/index.js';
import type { ViewSpec } from '../registry/types.js';
import type { TransformedData } from '../transforms/types.js';

export interface ViewSwitcherProps {
  views: ViewSpec[];
  data: TransformedData;
  width: number;
  height: number;
  activeView?: string;
  onViewChange?: (id: string) => void;
  tabPosition?: 'top' | 'bottom';
}

export function ViewSwitcher({
  views, data, width, height,
  activeView: controlled, onViewChange, tabPosition = 'top',
}: ViewSwitcherProps): React.ReactElement {
  const theme = useTheme();
  const [internal, setInternal] = useState(views[0]?.id ?? '');
  const activeId = controlled ?? internal;
  const tabH = 36;
  const chartH = height - tabH;

  const handleSelect = (id: string) => { setInternal(id); onViewChange?.(id); };

  const activeSpec = views.find((v) => v.id === activeId) ?? views[0];
  const plugin = activeSpec ? getPlugin(activeSpec.id) : undefined;

  let chart: React.ReactNode;
  if (!plugin) {
    chart = (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary }}>
        No plugin registered for "{activeId}". Call registerPlugin(...) first.
      </div>
    );
  } else {
    const libData = plugin.dataAdapter(data, activeSpec?.config);
    const libTheme = plugin.themeAdapter(theme, activeSpec?.config);
    chart = (
      <plugin.Renderer
        data={libData}
        theme={libTheme}
        width={width}
        height={chartH}
        config={activeSpec?.config}
      />
    );
  }

  const tabStrip = (
    <div role="tablist" style={{
      display: 'flex', gap: theme.spacing.xs, height: tabH,
      padding: `0 ${theme.spacing.sm}`, alignItems: 'center',
      borderBottom: tabPosition === 'top' ? `1px solid ${theme.surface.border}` : undefined,
      borderTop: tabPosition === 'bottom' ? `1px solid ${theme.surface.border}` : undefined,
      background: theme.surface.surface, flexShrink: 0,
    }}>
      {views.map((v) => {
        const p = getPlugin(v.id);
        const label = v.label ?? p?.label ?? v.id;
        const active = v.id === activeId;
        return (
          <button key={v.id} role="tab" aria-selected={active}
            onClick={() => handleSelect(v.id)}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`, border: 'none',
              borderRadius: theme.surface.borderRadius, cursor: 'pointer',
              fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSizeSm,
              fontWeight: active ? theme.typography.fontWeightBold : theme.typography.fontWeightNormal,
              background: active ? (theme.colors.categorical[0] ?? 'transparent') : 'transparent',
              color: active ? theme.text.inverse : theme.text.secondary,
              transition: 'background 0.15s, color 0.15s',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width, height }}>
      {tabPosition === 'top' && tabStrip}
      <div style={{ flex: 1, overflow: 'hidden' }}>{chart}</div>
      {tabPosition === 'bottom' && tabStrip}
    </div>
  );
}
```

### `src/core/container.tsx` — add ResizeObserver

Key change: when `width` is a string (e.g. `'100%'`), use a `ResizeObserver` to measure the DOM element and pass pixel dimensions down. The render prop now also receives `width` and `height` as resolved numbers.

```tsx
// Add to imports
import { useRef, useEffect, useState } from 'react';

// Change children signature:
children: (transformedData: TransformedData, width: number, height: number) => React.ReactNode;

// Inside the component, before the return:
const containerRef = useRef<HTMLDivElement>(null);
const [measuredSize, setMeasuredSize] = useState<{ w: number; h: number } | null>(null);

useEffect(() => {
  if (typeof width === 'number' && typeof height === 'number') return;
  const el = containerRef.current;
  if (!el) return;
  const ro = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    setMeasuredSize({ w: entry.contentRect.width, h: entry.contentRect.height });
  });
  ro.observe(el);
  return () => ro.disconnect();
}, [width, height]);

const resolvedW = typeof width === 'number' ? width : (measuredSize?.w ?? 0);
const resolvedH = typeof height === 'number' ? height : (measuredSize?.h ?? 0);

// Pass resolvedW, resolvedH to children:
{children(transformedData, resolvedW, resolvedH)}
```

### `src/core/registry.ts` — DELETE

Remove entirely. Replace all imports with `src/registry/index.js`.

### `src/viz/registry.ts` — DELETE

Remove entirely. Replace all imports with `src/registry/index.js`.

### `src/core/index.ts` — update exports

Remove registry exports. Add:
```ts
export { registerPlugin, getPlugin, listPlugins, registerAndGetId } from '../registry/index.js';
export type { ChartPlugin, ViewSpec, RendererProps } from '../registry/types.js';
export { createNativePlugin } from '../registry/native-plugin.js';
export type { NativeChartProps, NativeConfig } from '../registry/native-plugin.js';
```

### `src/viz/index.ts` — remove registry exports

Remove the three registry function exports (`registerVisualization`, `getVisualization`, `listVisualizations`) — they're gone. Add:
```ts
// Convenience: pre-built plugins for all native charts
export { nativeBarPlugin, nativeLinePlugin, nativePiePlugin,
         nativeTablePlugin, nativeTreePlugin, nativeChoroplethPlugin,
         nativeForceGraphPlugin } from './plugins.js';
```

### NEW `src/viz/plugins.ts` — pre-built native plugins

Create one file that instantiates `createNativePlugin` for each built-in chart and exports the plugin objects. Consumers can do:
```ts
import { nativeBarPlugin, nativeTablePlugin } from 'vizbox/viz';
registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);
```

### `src/viz/*.tsx` — update prop types

Each built-in chart currently takes `VisualizationProps` from `./types.js`. Change to `NativeChartProps` from `../registry/native-plugin.js`. The only practical difference: `theme: ThemeDefinition` is now an explicit prop (passed by `NativeRenderer`) rather than obtained from `useTheme()`. This removes the React context dependency from the chart components, making them pure functions of their props and easier to test.

### `src/plugins/d3-adapter.tsx` — rewrite as ChartPlugin factory

Replace `createD3Visualization` (which returned a React component) with `createD3Plugin` (which returns a `ChartPlugin`).

```ts
export function createD3Plugin<TData, TConfig = Record<string, unknown>>(options: {
  id: string;
  label?: string;
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  mount: (container: HTMLDivElement, data: TData, theme: D3Theme, width: number, height: number) => void;
  update: (container: HTMLDivElement, data: TData, theme: D3Theme, width: number, height: number) => void;
  destroy: (container: HTMLDivElement) => void;
}): ChartPlugin<TData, D3Theme, TConfig>
```

Where `D3Theme` is:
```ts
export interface D3Theme {
  colors: string[];          // categorical palette
  sequentialColors: string[]; // sequential palette
  fontFamily: string;
  fontSize: string;
  background: string;
  border: string;
}
```

The `themeAdapter` is built-in to `createD3Plugin` — it extracts the D3Theme from the VizBox ThemeDefinition automatically. Consumers don't have to write it.

### NEW `src/plugins/recharts-adapter.ts` — reference Recharts adapter

```ts
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import type { ChartPlugin } from '../registry/types.js';

export interface RechartsTheme {
  colors: string[];
  fontFamily: string;
  fontSize: string;
  gridColor: string;
  textColor: string;
}

export interface RechartsConfig {
  dataKey: string;
  nameKey?: string;
  layout?: 'horizontal' | 'vertical';
}

/** Shared theme adapter for all Recharts plugins. */
export function rechartsThemeAdapter(theme: ThemeDefinition): RechartsTheme {
  return {
    colors: theme.colors.categorical,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizeSm,
    gridColor: theme.surface.border,
    textColor: theme.text.secondary,
  };
}

/**
 * Creates a Recharts bar chart plugin.
 * Consumer provides only the Recharts-specific Renderer component;
 * data reshaping and theme bridging are handled automatically.
 *
 * @example
 * ```tsx
 * import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
 * import { createRechartsBarPlugin } from 'vizbox/plugins';
 *
 * const myBarPlugin = createRechartsBarPlugin({
 *   id: 'my-bar',
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <BarChart width={width} height={height} data={data}>
 *       <CartesianGrid stroke={theme.gridColor} />
 *       <XAxis dataKey={config?.nameKey ?? 'name'} tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
 *       <YAxis tick={{ fill: theme.textColor }} />
 *       <Tooltip />
 *       <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0]} />
 *     </BarChart>
 *   ),
 * });
 * registerPlugin(myBarPlugin);
 * ```
 */
export function createRechartsBarPlugin(options: {
  id: string;
  label?: string;
  Renderer: React.ComponentType<RendererProps<RechartsRow[], RechartsTheme, RechartsConfig>>;
}): ChartPlugin<RechartsRow[], RechartsTheme, RechartsConfig> {
  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: (data: TransformedData, config?: RechartsConfig): RechartsRow[] =>
      data.rows.map((r) => ({
        name: String(r[config?.nameKey ?? data.fields.find((f) => f.type === 'string')?.key ?? ''] ?? ''),
        value: Number(r[config?.dataKey ?? data.fields.find((f) => f.type === 'number')?.key ?? ''] ?? 0),
        ...r,
      })),
    themeAdapter: rechartsThemeAdapter,
    Renderer: options.Renderer,
  };
}

type RechartsRow = Record<string, string | number | null>;
```

### `src/index.ts` — update barrel exports

Remove the old `registerVisualization` / `getVisualization` / `VisualizationProps` exports.
Add:
```ts
export { registerPlugin, getPlugin, listPlugins, registerAndGetId } from './registry/index.js';
export type { ChartPlugin, ViewSpec, RendererProps } from './registry/types.js';
export { createNativePlugin } from './registry/native-plugin.js';
```

---

## Updated Quick-Start (how it looks after the refactor)

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, groupBy, registerPlugin } from 'vizbox';
import { nativeBarPlugin, nativeTablePlugin } from 'vizbox/viz';
import { createD3Plugin } from 'vizbox/plugins';

// Register built-ins once at app startup
registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);

// Register a D3 chart
registerPlugin(createD3Plugin({
  id: 'bubble',
  dataAdapter: (data) => data.rows,
  mount: (el, data, theme, w, h) => { /* d3 code */ },
  update: (el, data, theme, w, h) => { /* d3 code */ },
  destroy: (el) => { /* cleanup */ },
}));

// Register a Recharts chart
import { BarChart, Bar, XAxis, YAxis } from 'recharts';
import { createRechartsBarPlugin } from 'vizbox/plugins';
registerPlugin(createRechartsBarPlugin({
  id: 'recharts-bar',
  Renderer: ({ data, theme, width, height, config }) => (
    <BarChart width={width} height={height} data={data}>
      <XAxis dataKey="name" tick={{ fill: theme.textColor }} />
      <YAxis />
      <Bar dataKey="value" fill={theme.colors[0]} />
    </BarChart>
  ),
}));

// Usage — ViewSwitcher now takes ViewSpec[] not string[]
<ThemeProvider theme="dark">
  <WidgetContainer data={raw} transforms={[groupBy('region', 'revenue')]}>
    {(data, width, height) => (
      <ViewSwitcher
        data={data}
        width={width}
        height={height}
        views={[
          { id: 'bar', label: 'Bar Chart' },
          { id: 'recharts-bar', label: 'Recharts' },
          { id: 'bubble', label: 'Bubble' },
          { id: 'table', label: 'Table' },
        ]}
      />
    )}
  </WidgetContainer>
</ThemeProvider>
```

---

## Execution Order

1. Create `src/registry/types.ts`
2. Create `src/registry/index.ts`
3. Create `src/registry/native-plugin.tsx`
4. Update `src/viz/*.tsx` — change `useTheme()` to `theme` prop (from `NativeChartProps`)
5. Create `src/viz/plugins.ts` — instantiate native plugins
6. Rewrite `src/core/view-switcher.tsx`
7. Update `src/core/container.tsx` — add ResizeObserver
8. Delete `src/core/registry.ts` and `src/viz/registry.ts`
9. Update `src/core/index.ts`
10. Update `src/viz/index.ts`
11. Rewrite `src/plugins/d3-adapter.tsx`
12. Create `src/plugins/recharts-adapter.ts`
13. Update `src/plugins/index.ts`
14. Update `src/index.ts`
15. Run `tsc --noEmit` and fix any errors
16. Update `README.md` with new quick-start

## TypeCheck target

After the refactor, this must compile clean:

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, groupBy, registerPlugin } from 'vizbox';
import { nativeBarPlugin, nativeTablePlugin } from 'vizbox/viz';

registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);

<ThemeProvider theme="dark">
  <WidgetContainer data={rawData} transforms={[groupBy('region', 'revenue')]}>
    {(data, width, height) => (
      <ViewSwitcher
        data={data} width={width} height={height}
        views={[{ id: 'bar' }, { id: 'table' }]}
      />
    )}
  </WidgetContainer>
</ThemeProvider>
```
