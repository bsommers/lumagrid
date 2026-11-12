[← Project README](../../README.md)

# Plugins and adapters

Every chart in Lumagrid is a plugin. This chapter explains the plugin contract, how the registry hands plugins to `ViewSwitcher`, how to write your own, and how to bring D3, Recharts or Nivo charts in through the adapter factories.

## Contents

- [The ChartPlugin contract](#the-chartplugin-contract)
- [The registry](#the-registry)
- [The eleven native plugins](#the-eleven-native-plugins)
- [Writing your own plugin](#writing-your-own-plugin)
- [Adapters](#adapters)
  - [D3](#d3)
  - [Recharts](#recharts)
  - [Nivo](#nivo)

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

## The eleven native plugins

The built-in SVG charts are plugins too. `createNativePlugin(id, Component, label?)` wraps a chart component as a plugin with identity adapters, so the data and the theme pass straight through to the chart and the view's `config` becomes its props. The eleven presets that `lumagrid/viz` exports are registered under these ids:

| Plugin id | Preset | Chart |
|-----------|--------|-------|
| `table` | `nativeTablePlugin` | `DataTable` |
| `bar` | `nativeBarPlugin` | `HorizontalBarChart` |
| `line` | `nativeLinePlugin` | `LineChart` |
| `pie` | `nativePiePlugin` | `PieChart` |
| `tree` | `nativeTreePlugin` | `TreeView` |
| `choropleth` | `nativeChoroplethPlugin` | `Choropleth` |
| `force-graph` | `nativeForceGraphPlugin` | `ForceGraph` |
| `scatter` | `nativeScatterPlugin` | `ScatterChart` |
| `area` | `nativeAreaPlugin` | `AreaChart` |
| `column` | `nativeColumnPlugin` | `ColumnChart` |
| `heatmap` | `nativeHeatmapPlugin` | `Heatmap` |

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

To see a plugin written for a new engine from scratch, and to check any plugin (this one, the D3, Recharts and Nivo adapters, or your own) against the contract with `checkPluginConformance` from `lumagrid/testing`, read [Bring your own engine](./bring-your-own-engine.md).

## Adapters

Three factories turn an existing chart library into a plugin, so you write only the library-specific drawing code. Each factory supplies the theme adapter for you.

| Factory | Library | You supply | Install in your app |
|---------|---------|------------|---------------------|
| `createD3Plugin` | D3 | `dataAdapter`, and the `mount`, `update` and `destroy` callbacks | `npm install d3` |
| `createRechartsPlugin` | Recharts | a `Renderer` component (the `dataAdapter` is optional) | `npm install recharts` |
| `createNivoPlugin` | Nivo | a `dataAdapter` and a `Renderer` component | `npm install @nivo/bar` (or another Nivo chart package) |

The factories live in `lumagrid/plugins`. Lumagrid does not bundle d3, recharts or Nivo: install the ones you use in your own project. The examples below were written against d3 7.9.2, recharts 3.10.1 and @nivo/bar 0.99.0. The factories themselves do not import those libraries; your own drawing code does, so install a library only if you use its adapter.

**Stability.** The three factory functions are stable. The adapter config and theme types are experimental and may change in a minor release: `D3Theme`, `D3PluginOptions`, `RechartsTheme`, `RechartsRow`, `RechartsConfig`, `NivoTheme` and `NivoPluginOptions`, plus the `rechartsThemeAdapter` and `nivoThemeAdapter` helpers. See [STABILITY](../STABILITY.md) for the full list.

### D3

`createD3Plugin` gives D3 an element to draw into and an imperative lifecycle. `mount` runs once when the chart first appears, `update` runs when data, size or theme change, and `destroy` runs when it unmounts. The theme passed to `mount` and `update` is a `D3Theme` with `colors`, `sequentialColors`, `fontFamily`, `fontSize`, `background`, `foreground` and `border`.

Build the chart with D3's `append`, `attr` and `text` calls, as below, so that chart text is always inserted as text and never parsed as markup.

<!-- snippet: adapters-d3#d3-bars -->

```tsx
import { select, scaleBand, scaleLinear } from 'd3';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createD3Plugin } from 'lumagrid/plugins';
import type { D3Theme } from 'lumagrid/plugins';

interface Bar {
  label: string;
  value: number;
}

// Draw (or redraw) the bars. D3 builds elements with append, attr and text only.
function draw(el: HTMLDivElement, bars: Bar[], theme: D3Theme, width: number, height: number): void {
  const x = scaleBand<string>().domain(bars.map((b) => b.label)).range([0, width]).padding(0.2);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const y = scaleLinear().domain([0, max]).range([height - 20, 0]);

  const svg = select(el).selectAll<SVGSVGElement, null>('svg').data([null]).join('svg')
    .attr('width', width)
    .attr('height', height);

  svg.selectAll<SVGRectElement, Bar>('rect')
    .data(bars)
    .join('rect')
    .attr('x', (d) => x(d.label) ?? 0)
    .attr('y', (d) => y(d.value))
    .attr('width', x.bandwidth())
    .attr('height', (d) => height - 20 - y(d.value))
    .attr('fill', theme.colors[0] ?? 'steelblue');

  svg.selectAll<SVGTextElement, Bar>('text')
    .data(bars)
    .join('text')
    .attr('x', (d) => (x(d.label) ?? 0) + x.bandwidth() / 2)
    .attr('y', height - 6)
    .attr('text-anchor', 'middle')
    .attr('fill', theme.foreground)
    .attr('font-family', theme.fontFamily)
    .attr('font-size', theme.fontSize)
    .text((d) => d.label);
}

const d3BarsPlugin = createD3Plugin<Bar[]>({
  id: 'd3-bars',
  label: 'Bars (D3)',
  // Reshape TransformedData into the array the D3 code wants.
  dataAdapter: (data: TransformedData) =>
    data.rows.map((row) => ({ label: String(row['region'] ?? ''), value: Number(row['revenue'] ?? 0) })),
  // mount runs once, update on every data, size or theme change, destroy on unmount.
  mount: draw,
  update: draw,
  destroy(el) {
    select(el).selectAll('*').remove();
  },
});

registerPlugin(d3BarsPlugin);

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
      <WidgetContainer data={sales} title="D3 bars" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'd3-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

### Recharts

`createRechartsPlugin` takes your `Renderer`. The default `dataAdapter` turns each row into an object with a `name` (the first string column, or `config.nameKey`) and a `value` (the first number column, or `config.dataKey`), and keeps the original columns too. The `RechartsTheme` has `colors`, `fontFamily`, `fontSize`, `gridColor`, `textColor` and `background`.

Use a fixed-size chart such as `BarChart` and pass it the `width` and `height` that the plugin receives. A `ResponsiveContainer` measures its parent, and measures zero in a test renderer such as jsdom.

<!-- snippet: adapters-recharts#recharts-bars -->

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createRechartsPlugin } from 'lumagrid/plugins';

// The default data adapter finds the first string column (name) and the first number
// column (value). Pass config.nameKey and config.dataKey to choose columns yourself.
const rechartsBarsPlugin = createRechartsPlugin({
  id: 'recharts-bars',
  label: 'Bars (Recharts)',
  Renderer: ({ data, theme, width, height, config }) => (
    // A fixed-size BarChart takes its size from the props the plugin receives.
    <BarChart width={width} height={height} data={data}>
      <CartesianGrid stroke={theme.gridColor} />
      <XAxis
        dataKey={config?.nameKey ?? 'name'}
        tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }}
      />
      <YAxis tick={{ fill: theme.textColor }} />
      <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0] ?? '#3b82f6'} />
    </BarChart>
  ),
});

registerPlugin(rechartsBarsPlugin);

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
      <WidgetContainer data={sales} title="Recharts bars" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'recharts-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

### Nivo

`createNivoPlugin` requires a `dataAdapter`, because Nivo chart types disagree about their data shape (a bar chart wants flat rows, a pie chart wants `{ id, value }` items, a line chart wants series of points). The `NivoTheme` matches the shape of Nivo's own `theme` prop (`background`, `text`, `axis`, `grid` and `tooltip`) and adds a `colors` array for Nivo's separate `colors` prop, so you pass both straight through.

Use the fixed-size component (`Bar`) with the plugin's `width` and `height` rather than `ResponsiveBar`, which also measures its parent.

<!-- snippet: adapters-nivo#nivo-bars -->

```tsx
import { Bar } from '@nivo/bar';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createNivoPlugin } from 'lumagrid/plugins';

// A type alias (not an interface) so the rows satisfy Nivo's BarDatum index signature.
type Row = { region: string; revenue: number };

// dataAdapter is required: Nivo chart types disagree about the data shape they expect.
const nivoBarsPlugin = createNivoPlugin<Row[]>({
  id: 'nivo-bars',
  label: 'Bars (Nivo)',
  dataAdapter: (data: TransformedData) =>
    data.rows.map((row) => ({ region: String(row['region'] ?? ''), revenue: Number(row['revenue'] ?? 0) })),
  Renderer: ({ data, theme, width, height }) => (
    // The fixed-size Bar component takes its size from the props the plugin receives.
    <Bar
      data={data}
      width={width}
      height={height}
      keys={['revenue']}
      indexBy="region"
      margin={{ top: 20, right: 20, bottom: 40, left: 60 }}
      theme={theme}
      colors={theme.colors}
    />
  ),
});

registerPlugin(nivoBarsPlugin);

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
      <WidgetContainer data={sales} title="Nivo bars" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'nivo-bars' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```
