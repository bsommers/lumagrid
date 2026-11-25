[← Project README](../../README.md)

# Network graphs

Lumagrid draws node-and-edge data through three engines that you bring yourself: Reagraph, react-force-graph and React Three Fiber. All three read the same rows, are themed from the same tokens and register as ordinary plugins, so one `ViewSwitcher` can flip between them. This chapter covers the shared data and theme layer and the first two engines. The React Three Fiber toolkit has its own chapter, [3D graphs with React Three Fiber](./r3f.md).

## Contents

- [Data: rows to a graph](#data-rows-to-a-graph)
- [Theming](#theming)
- [The three engines](#the-three-engines)
  - [Reagraph](#reagraph)
  - [react-force-graph](#react-force-graph)
  - [React Three Fiber](#react-three-fiber)
- [Choosing an engine](#choosing-an-engine)
- [Events](#events)
- [Stability and installation](#stability-and-installation)

## Data: rows to a graph

Graph data is ordinary `TransformedData`, the same rows the native `ForceGraph` reads. A row with a non-null `source` is an edge (`source`, `target`, optional `weight`). Every other row is a node (`id`, optional `label` and `group`).

`toGraph` from `lumagrid/transforms` turns those rows into an engine-neutral `Graph` of `nodes`, `links` and a `dropped` count. It is pure, has no React dependency, never mutates its input and gives the same output for the same input.

<!-- snippet: r3f-graph#to-graph -->

```tsx
import { graphSampleData } from 'lumagrid/testing';

const sampleGraph = toGraph(graphSampleData, { maxNodes: 100 });
// sampleGraph.nodes: { id, label, group?, degree, data? }[]
// sampleGraph.links: { id, source, target, weight? }[]
// sampleGraph.dropped: rows or edges that were skipped
```

| Behavior | Detail |
|----------|--------|
| Duplicate node ids | The first row wins; the rest count in `dropped`. |
| Empty ids and empty edge endpoints | Dropped and counted. |
| Edge endpoint with no node row | A node is created for it (label = id) unless `implicitNodes` is `false`, in which case the edge is dropped. |
| `degree` | The number of edges touching the node. |
| `maxNodes` | Keeps at most that many nodes, highest degree first (ties broken by id), and drops edges to the removed nodes. Use it to bound what an engine has to draw. |
| Column names | `idField`, `labelField`, `groupField`, `sourceField`, `targetField` and `weightField` rename the role columns. |

`graphSampleData` in `lumagrid/testing` is a four-node ring you can use in tests and demos. The three graph plugins call `toGraph` for you through their `dataAdapter`; call it yourself when you build a scene from scratch. Options that `toGraph` understands (the `ToGraphOptions`) can also be passed through the plugin config, for example `maxNodes` on the react-force-graph plugin.

## Theming

`graphThemeAdapter` from `lumagrid/plugins` maps a `ThemeDefinition` to a `GraphTheme`:

| `GraphTheme` field | Taken from |
|--------------------|------------|
| `background` | `surface.background` |
| `nodeColors`, `nodeDefault` | the categorical color scale; the first color is the default |
| `edge` | `surface.border` |
| `edgeActive` | `text.secondary` |
| `label`, `labelBackground` | `text.primary`, `surface.surface` |
| `highlight` | the second categorical color (selection and hover) |
| `fontFamily`, `fontSize` | the theme typography |

Each engine has a thin adapter on top, so the plugin hands your `Renderer` a theme already shaped for that library: `reagraphThemeAdapter` returns a Reagraph `theme` object, `forceGraphThemeAdapter` returns the colors react-force-graph takes as props, and the R3F plugin uses `GraphTheme` directly. Switching `ThemeProvider` between `light` and `dark` re-themes all three. See [Theming](./theming.md) for the token model.

## The three engines

Like the D3, Recharts and Nivo adapters, the factories do not import the engine. You import it in the `Renderer` you pass in, so each engine is an optional peer you install only when you use it.

| Engine | Factory | Entry point | Install in your app |
|--------|---------|-------------|---------------------|
| Reagraph | `createReagraphPlugin` | `lumagrid/plugins` | `npm install reagraph` |
| react-force-graph | `createForceGraphPlugin` | `lumagrid/plugins` | `npm install react-force-graph-2d` (or `react-force-graph-3d`) |
| React Three Fiber | `createR3FGraphPlugin` and primitives | `lumagrid/r3f` | `npm install three @react-three/fiber @react-three/drei d3-force-3d` |

### Reagraph

`createReagraphPlugin` takes a `Renderer` and an optional `preset`. The `Renderer` receives `data` shaped for Reagraph (`nodes` with `fill` and `size`, `edges`), a Reagraph-shaped `theme`, and `config`. The presets only set config defaults, which your own `config` overrides:

| Preset | Defaults |
|--------|----------|
| `reagraph-2d` | `mode: '2d'`, `layoutType: 'forceDirected2d'` |
| `reagraph-3d` | `mode: '3d'`, `layoutType: 'forceDirected3d'` |
| `reagraph-clustered` | 2D force layout with `clusterAttribute: 'group'` |

The plugin id defaults to the preset name (or `reagraph` with no preset); pass `id` to choose your own. `ReagraphConfig` also carries `selection` (`single`, `multi` or `lasso`), `pathSelectionType` and the `toGraph` options. The config is yours to forward to `GraphCanvas`; Lumagrid does not interpret it.

<!-- snippet: adapters-reagraph#reagraph-network -->

```tsx
import { GraphCanvas } from 'reagraph';
import type { LayoutTypes } from 'reagraph';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createReagraphPlugin } from 'lumagrid/plugins';

// Presets: 'reagraph-2d', 'reagraph-3d' and 'reagraph-clustered' only set config defaults.
const reagraphPlugin = createReagraphPlugin({
  id: 'reagraph-network',
  label: 'Network (Reagraph)',
  preset: 'reagraph-clustered',
  Renderer: ({ data, theme, width, height, config }) => (
    <div style={{ position: 'relative', width, height }}>
      <GraphCanvas
        nodes={data.nodes}
        edges={data.edges}
        theme={theme}
        layoutType={(config?.layoutType ?? 'forceDirected2d') as LayoutTypes}
        clusterAttribute={config?.clusterAttribute ?? 'group'}
      />
    </div>
  ),
});

registerPlugin(reagraphPlugin);

const network: TransformedData = {
  rows: [
    { id: 'a', label: 'Alpha', group: 'x' },
    { id: 'b', label: 'Beta', group: 'x' },
    { id: 'c', label: 'Gamma', group: 'y' },
    { source: 'a', target: 'b' },
    { source: 'b', target: 'c' },
  ],
  fields: [
    { key: 'id', type: 'string' },
    { key: 'label', type: 'string' },
    { key: 'group', type: 'string' },
    { key: 'source', type: 'string' },
    { key: 'target', type: 'string' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="light">
      <WidgetContainer data={network} title="Reagraph network" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'reagraph-network' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

### react-force-graph

`createForceGraphPlugin` takes a `variant` (`'2d'` or `'3d'`, default plugin ids `rfg-2d` and `rfg-3d`) and a `Renderer`. The data it hands over is `{ nodes, links }` in react-force-graph's shape, with node `val` set from degree (or summed edge weight when `sizeBy` is `'weight'`). `themeRfgData(data, theme)` fills in the node colors from the theme, so the renderer can pass the result straight to `graphData`.

`RfgConfig` carries the knobs the example below forwards: `cooldownTicks`, `linkDistance`, `chargeStrength`, `particles`, `focusOnClick`, `sizeBy` and `maxNodes`.

<!-- snippet: adapters-force-graph#force-graph -->

```tsx
import { useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';

// The app owns the engine: Lumagrid supplies data, theme and size.
registerPlugin(
  createForceGraphPlugin({
    variant: '2d',
    Renderer: ({ data, theme, width, height, config }) => {
      const graphData = useMemo(() => themeRfgData(data, theme), [data, theme]);
      return (
        <ForceGraph2D
          graphData={graphData}
          width={width}
          height={height}
          backgroundColor={theme.backgroundColor}
          linkColor={() => theme.linkColor}
          nodeLabel="name"
          cooldownTicks={config?.cooldownTicks ?? 100}
          linkDirectionalParticles={config?.particles ? 2 : 0}
          linkDirectionalParticleColor={() => theme.linkActiveColor}
        />
      );
    },
  }),
);

const network: TransformedData = {
  rows: [
    { id: 'a', label: 'Alpha', group: 'x' },
    { id: 'b', label: 'Beta', group: 'x' },
    { id: 'c', label: 'Gamma', group: 'y' },
    { source: 'a', target: 'b', weight: 2 },
    { source: 'b', target: 'c', weight: 1 },
  ],
  fields: [
    { key: 'id', type: 'string' },
    { key: 'label', type: 'string' },
    { key: 'group', type: 'string' },
    { key: 'source', type: 'string' },
    { key: 'target', type: 'string' },
    { key: 'weight', type: 'number' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={network} title="Network" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'rfg-2d', config: { particles: true } }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

**VR and AR.** Lumagrid ships no code for `react-force-graph-vr` or `-ar`. They accept the same `graphData`, so you register the 3D variant with your own `Renderer`:

<!-- snippet: adapters-force-graph-vr#force-graph-vr -->

```tsx
import type { ComponentType } from 'react';
import { registerPlugin } from 'lumagrid';
import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';

// In an app: import ForceGraphVR from 'react-force-graph-vr';
interface VrProps {
  graphData: { nodes: object[]; links: object[] };
  backgroundColor: string;
  linkColor: () => string;
  nodeLabel: string;
}
declare const ForceGraphVR: ComponentType<VrProps>;

// The VR canvas fills the headset, so width and height are ignored.
registerPlugin(
  createForceGraphPlugin({
    id: 'rfg-vr',
    label: 'Force graph (VR)',
    variant: '3d',
    Renderer: ({ data, theme }) => (
      <ForceGraphVR
        graphData={themeRfgData(data, theme)}
        backgroundColor={theme.backgroundColor}
        linkColor={() => theme.linkColor}
        nodeLabel="name"
      />
    ),
  }),
);
```

### React Three Fiber

`lumagrid/r3f` is a toolkit rather than a single chart: a force layout hook, scene primitives and a ready-made plugin. It is covered in [3D graphs with React Three Fiber](./r3f.md).

## Choosing an engine

| You want | Use |
|----------|-----|
| The most built-in features: 2D and 3D, clustering, lasso selection, path highlighting | Reagraph |
| A familiar force layout with particle flow along edges, and 2D, 3D, VR or AR from one data shape | react-force-graph |
| Your own geometry, shaders or camera behavior, with Lumagrid supplying data, layout and theme | React Three Fiber |
| A small SVG graph with no extra dependency | the native `ForceGraph` ([page](./charts/force-graph.md)) |

All three engines draw with WebGL, which the server-render check in the conformance kit cannot exercise. Test your own `Renderer` by stubbing the engine, as the library's tests do.

**Node counts.** Lumagrid has not measured frame rates for any of the three engines, and this guide gives no node-count thresholds. How many nodes stay smooth depends on the engine, layout, device and labels. Measure on your target hardware, and use `maxNodes` (in `toGraph` or the plugin config) to bound the input.

## Events

`GraphEvents` is shared by the graph configs: `onNodeClick({ id, label })` and `onSelectionChange(ids)`. Pass them in the plugin `config` (Reagraph and react-force-graph) or in the plugin options (R3F), and call them from your `Renderer` or from the primitives.

## Stability and installation

Everything on this page is experimental: `toGraph`, `graphThemeAdapter`, the plugin factories, their theme adapters and the `lumagrid/r3f` exports are tagged `@beta` and `@experimental` and may change in a minor release. See [STABILITY](../STABILITY.md).

The engines are optional peer dependencies: `reagraph`, `react-force-graph-2d` and `react-force-graph-3d`, plus the R3F set listed in the table above. Install only what you use. Reagraph and react-force-graph are WebGL libraries, so load them lazily if bundle size matters. For the testing side, see [Bring your own engine](./bring-your-own-engine.md).
