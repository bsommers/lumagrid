[← Project README](../../README.md)

# Plugins and adapters

Every chart in Lumagrid is a plugin. This chapter explains the plugin contract, how the registry hands plugins to `ViewSwitcher`, how to write your own, and how to bring D3, Recharts or Nivo charts in through the adapter factories.

## Contents

- [The ChartPlugin contract](#the-chartplugin-contract)
- [The registry](#the-registry)
- [The seven native plugins](#the-seven-native-plugins)
- [Writing your own plugin](#writing-your-own-plugin)
- [Adapters](#adapters)

## The ChartPlugin contract

A `ChartPlugin` connects Lumagrid data and themes to a chart implementation. It has five fields:

| Field | Required | What it does |
|-------|----------|--------------|
| `id` | yes | The unique string that `registerPlugin` stores the plugin under and that a view's `id` refers to. |
| `label` | no | The text on the view's tab. It defaults to the `id`, and a view's own `label` overrides it. |
| `dataAdapter` | yes | `(data, config?) => TData`. Receives the `TransformedData` that reached the `ViewSwitcher` and the view's `config`, and returns whatever shape the chart wants. |
| `themeAdapter` | yes | `(theme, config?) => TTheme`. Receives the active `ThemeDefinition` and the view's `config`, and returns only the styling tokens the chart needs. |
| `Renderer` | yes | A React component that draws the chart. Note the capital `R`: the field is named `Renderer`, not `component`. |

`ChartPlugin` has three type parameters: `TData` (what `dataAdapter` returns), `TTheme` (what `themeAdapter` returns) and `TConfig` (the shape of a view's `config`, `Record<string, unknown>` by default).

The `Renderer` receives `RendererProps<TData, TTheme, TConfig>`:

| Prop | Meaning |
|------|---------|
| `data` | the result of `dataAdapter` |
| `theme` | the result of `themeAdapter` |
| `width`, `height` | the pixel size of the chart area. `ViewSwitcher` subtracts its 36 px tab strip from the height it was given. |
| `config` | the view's `config`, unchanged (optional) |

`ViewSwitcher` calls `dataAdapter` and `themeAdapter` on every render, so keep them cheap and free of side effects. A plugin never sees Lumagrid internals beyond these two inputs, which is what lets one chart library serve many themes.

## The registry

There is one global registry for the whole page. A view in `ViewSwitcher` names a plugin by `id`, and the switcher looks it up there.

- `registerPlugin(plugin)` stores the plugin under `plugin.id` and returns that id. Call it once at application startup, before the first render.
- Registering an id that already exists replaces the earlier plugin. Outside production (`NODE_ENV` other than `production`) it also logs a `console.warn` that starts with `[lumagrid]`; this is expected under hot reload. In production, or where `process` is undefined, the replacement is silent.
- `getPlugin(id)` returns the plugin or `undefined`.
- `listPlugins()` returns the ids of everything registered.
- If a view names an id that is not registered, `ViewSwitcher` draws a message instead of a chart: `No plugin registered for "<id>". Call registerPlugin(...) first.`

Tests that register plugins share this one registry across a whole test process, so they reset it between tests. That convention is described in [CONTRIBUTING.md](../../CONTRIBUTING.md) and the stability rules for the registry are in [STABILITY](../STABILITY.md#registry-semantics).

## The seven native plugins

The built-in SVG charts are plugins too. `createNativePlugin(id, Component, label?)` wraps a chart component as a plugin with identity adapters, so the data and the theme pass straight through to the chart and the view's `config` becomes its props. The seven presets that `lumagrid/viz` exports are registered under these ids:

| Plugin id | Preset | Chart |
|-----------|--------|-------|
| `table` | `nativeTablePlugin` | `DataTable` |
| `bar` | `nativeBarPlugin` | `HorizontalBarChart` |
| `line` | `nativeLinePlugin` | `LineChart` |
| `pie` | `nativePiePlugin` | `PieChart` |
| `tree` | `nativeTreePlugin` | `TreeView` |
| `choropleth` | `nativeChoroplethPlugin` | `Choropleth` |
| `force-graph` | `nativeForceGraphPlugin` | `ForceGraph` |

The `tree` view reads its expand and collapse state from a `CollapseManager`, so place one around the `ViewSwitcher` when you use it.

## Writing your own plugin

Define a `ChartPlugin` object, give it a unique `id`, and register it. The example below reshapes the data into a list of labelled values, picks three theme tokens, and draws plain React elements. It uses the real generic signature `ChartPlugin<Bar[], BarTheme, BarConfig>`, so the `Renderer` is checked against the adapters' return types.

<!-- snippet: custom-plugin#custom-plugin -->

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { ChartPlugin, TransformedData } from 'lumagrid';

// What the data adapter produces and the renderer consumes.
interface Bar {
  label: string;
  value: number;
}

// The few theme tokens the renderer needs, picked by the theme adapter.
interface BarTheme {
  bar: string;
  text: string;
  fontFamily: string;
}

// The per-view config the plugin understands.
interface BarConfig {
  labelKey?: string;
  valueKey?: string;
}

const stripePlugin: ChartPlugin<Bar[], BarTheme, BarConfig> = {
  id: 'stripe-bars',
  label: 'Stripes',

  // TransformedData in, whatever the renderer wants out. Called with the view's config.
  dataAdapter(data: TransformedData, config?: BarConfig): Bar[] {
    const labelKey = config?.labelKey ?? data.fields.find((f) => f.type === 'string')?.key ?? '';
    const valueKey = config?.valueKey ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
    return data.rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }));
  },

  // ThemeDefinition in, only the tokens this renderer reads out.
  themeAdapter(theme): BarTheme {
    return {
      bar: theme.colors.categorical[0] ?? '#3b82f6',
      text: theme.text.primary,
      fontFamily: theme.typography.fontFamily,
    };
  },

  // The contract field is named Renderer. It receives the adapted data and theme,
  // the pixel size, and the view's config.
  Renderer({ data, theme, width, height }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const rowHeight = height / Math.max(data.length, 1);
    return (
      <div style={{ width, height, fontFamily: theme.fontFamily, color: theme.text }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', height: rowHeight }}>
            <span style={{ width: 80 }}>{d.label}</span>
            <span
              style={{
                display: 'inline-block',
                height: rowHeight * 0.6,
                width: (d.value / max) * (width - 100),
                background: theme.bar,
              }}
            />
          </div>
        ))}
      </div>
    );
  },
};

// Register once at startup. The call returns the id.
registerPlugin(stripePlugin);

const sales: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000 },
    { region: 'South', revenue: 14200 },
    { region: 'East', revenue: 9300 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="light">
      <WidgetContainer data={sales} title="Custom plugin" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'stripe-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

Because the same typed `config` reaches `dataAdapter`, `themeAdapter` and `Renderer`, a view can steer all three with one object, for example `{ id: 'stripe-bars', config: { valueKey: 'revenue' } }`.

## Adapters
