[← Project README](../../README.md)

# 3D graphs with React Three Fiber

`lumagrid/r3f` is a toolkit for building a 3D graph scene with [React Three Fiber](https://docs.pmnd.rs/react-three-fiber). It gives you the data, layout and theme; you keep the scene. Use it when you want custom geometry, shaders or camera behavior. If a ready-made engine is enough, see [Network graphs](./network-graphs.md).

## Contents

- [Install](#install)
- [What is in the toolkit](#whats-in-the-toolkit)
- [The ready-made plugin](#the-ready-made-plugin)
- [A worked scene](#a-worked-scene)
- [Layout without React](#layout-without-react)
- [Stability and limits](#stability-and-limits)

## Install

`lumagrid/r3f` has four optional peer dependencies: `three`, `@react-three/fiber`, `@react-three/drei` and `d3-force-3d`.

```bash
npm install three @react-three/fiber @react-three/drei d3-force-3d
```

Pick the React Three Fiber major that matches your React:

| React | `@react-three/fiber` | `@react-three/drei` |
|-------|----------------------|---------------------|
| 18 | v8 | v9 |
| 19 | v9 | v10 |

Lumagrid's peer ranges (`@react-three/fiber >=8`, `@react-three/drei >=9`) accept both. The library's own tests run against fiber 8 and drei 9. Check the installed versions' peer requirements, because fiber v9 does not support React 18.

## What is in the toolkit

| Export | What it does |
|--------|--------------|
| `layoutGraph3D(graph, options)` | Runs a seeded `d3-force-3d` simulation to completion and returns `Map<id, [x, y, z]>`. No React. |
| `useForceLayout3D(graph, options)` | The same simulation as a hook. Returns a stable `positions` map, a `tick` function and a `settled` flag. |
| `InstancedNodes` | One instanced mesh for all nodes, sized by degree, colored by group, with click selection. |
| `EdgeLines` | All edges as a single line-segments object. |
| `NodeLabels` | Text labels (drei `Text`), capped by `maxLabels`. |
| `CameraRig` | Flies the camera to `focusId`. |
| `createR3FGraphPlugin(options)` | A `ChartPlugin` (default id `r3f-graph`) that composes the four primitives inside a `Canvas`. |

The primitives take `graph` (from `toGraph`), `positions` and `theme` (from `graphThemeAdapter`). `ForceLayout3DOptions` has `seed` (default 1), `iterations` (default 300), `alphaDecay`, `linkDistance`, `charge` and, for the hook only, `stopped`. The same seed gives the same layout.

## The ready-made plugin

`createR3FGraphPlugin` needs no `Renderer`: it converts rows with `toGraph`, themes with `graphThemeAdapter` and draws the scene. Forward `ToGraphOptions` with `graph`, layout options with `layout`, and swap any primitive by passing your own component as `nodes`, `edges`, `labels` or `rig`.

<!-- snippet: r3f-graph#r3f-plugin -->

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';
import type { TransformedData } from 'lumagrid';
import { createR3FGraphPlugin } from 'lumagrid/r3f';

// Composes the four primitives inside a Canvas. The seed makes the layout repeatable.
registerPlugin(createR3FGraphPlugin({ layout: { seed: 7 }, showLabels: true }));

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
    <ThemeProvider theme="dark">
      <WidgetContainer data={network} title="3D network" width={600} height={400}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'r3f-graph' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

## A worked scene

To own the scene, build it yourself inside a `Canvas`. The layout hook updates one `positions` map in place, so advance it once per frame with `useFrame(tick)` and pass the same map to every primitive. The snippet reuses the `network` rows from the example above.

<!-- snippet: r3f-graph#r3f-scene -->

```tsx
import { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { toGraph } from 'lumagrid/transforms';
import { graphThemeAdapter } from 'lumagrid/plugins';
import { lightTheme } from 'lumagrid/theme';
import { CameraRig, EdgeLines, InstancedNodes, NodeLabels, useForceLayout3D } from 'lumagrid/r3f';

const graph = toGraph(network);
const graphTheme = graphThemeAdapter(lightTheme);

// The layout hook updates one stable Map in place; advance it once per frame.
function Scene() {
  const { positions, tick } = useForceLayout3D(graph, { seed: 7 });
  const [selected, setSelected] = useState<string | null>(null);
  useFrame(tick);
  return (
    <>
      <color attach="background" args={[graphTheme.background]} />
      <ambientLight intensity={0.8} />
      <EdgeLines graph={graph} positions={positions} theme={graphTheme} />
      <InstancedNodes
        graph={graph}
        positions={positions}
        theme={graphTheme}
        selectedId={selected}
        onNodeClick={(node) => setSelected(node.id)}
      />
      <NodeLabels graph={graph} positions={positions} theme={graphTheme} maxLabels={50} />
      <CameraRig positions={positions} focusId={selected} />
    </>
  );
}

export function CustomScene() {
  return (
    <Canvas camera={{ position: [0, 0, 120], fov: 50 }} style={{ width: 600, height: 400 }}>
      <Scene />
    </Canvas>
  );
}
```

Selection state lives in your component: `InstancedNodes` reports clicks through `onNodeClick`, and `CameraRig` flies to `focusId`. Custom primitives only need the same props, so you can replace `InstancedNodes` with your own shader-based component and keep the rest.

## Layout without React

`layoutGraph3D` is deterministic and has no React or WebGL dependency, so it is the easy part to test: the same graph and options produce the same positions. Use it for static layouts, server-side precomputation or unit tests.

<!-- snippet: r3f-graph#r3f-layout -->

```tsx
import { layoutGraph3D } from 'lumagrid/r3f';

// Same graph and options, same positions: Map<id, [x, y, z]>.
export const positions = layoutGraph3D(sampleGraph, { seed: 7 });
```

## Stability and limits

- Every export of `lumagrid/r3f` is `@beta` and `@experimental`, so it may change in a minor release. See [STABILITY](../STABILITY.md).
- WebGL does not run in the conformance kit's server render. Test your scene with a stubbed `Canvas`, or in a real browser.
- Lumagrid has not measured how many nodes this scene draws smoothly, so the guide gives no figure. Use `toGraph`'s `maxNodes` and `NodeLabels`' `maxLabels` to bound the work, and measure on your own hardware.
