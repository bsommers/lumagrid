import React, { useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { ChartPlugin, RendererProps } from '../registry/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import { toGraph } from '../transforms/to-graph.js';
import type { Graph, ToGraphOptions } from '../transforms/to-graph.js';
import type { TransformedData } from '../transforms/types.js';
import { graphThemeAdapter } from '../plugins/graph-theme.js';
import type { GraphEvents, GraphTheme } from '../plugins/graph-theme.js';
import { useForceLayout3D } from './layout.js';
import type { ForceLayout3DOptions, Vec3 } from './layout.js';
import { CameraRig, EdgeLines, InstancedNodes, NodeLabels } from './components.js';
import type { CameraRigProps, EdgeLinesProps, InstancedNodesProps, NodeLabelsProps } from './components.js';

/**
 * Options for {@link createR3FGraphPlugin}. Pass your own primitives (custom shaders, geometries)
 * through `nodes`, `edges`, `labels` and `rig`.
 *
 * @beta
 * @experimental
 */
export interface R3FGraphPluginOptions extends GraphEvents {
  /** Plugin id. Default `r3f-graph`. */
  id?: string;
  /** Display label. Default `3D graph (R3F)`. */
  label?: string;
  /** Forwarded to `toGraph`. */
  graph?: ToGraphOptions;
  /** Forwarded to `useForceLayout3D`. */
  layout?: ForceLayout3DOptions;
  /** Draw labels. Default true. */
  showLabels?: boolean;
  /** Node to fly the camera to. */
  focusId?: string | null;
  /** Replacement primitives. */
  nodes?: React.ComponentType<InstancedNodesProps>;
  edges?: React.ComponentType<EdgeLinesProps>;
  labels?: React.ComponentType<NodeLabelsProps>;
  rig?: React.ComponentType<CameraRigProps>;
}

function Driver({ tick }: { tick: () => void }): null {
  useFrame(tick);
  return null;
}

function Scene({ graph, theme, options }: { graph: Graph; theme: GraphTheme; options: R3FGraphPluginOptions }): React.ReactElement {
  const { positions, tick } = useForceLayout3D(graph, options.layout);
  const [selected, setSelected] = useState<string | null>(null);
  const Nodes = options.nodes ?? InstancedNodes;
  const Edges = options.edges ?? EdgeLines;
  const Labels = options.labels ?? NodeLabels;
  const Rig = options.rig ?? CameraRig;
  const onNodeClick = (node: { id: string; label: string }): void => {
    setSelected(node.id);
    options.onNodeClick?.(node);
    options.onSelectionChange?.([node.id]);
  };
  const shared = { graph, positions: positions as Map<string, Vec3>, theme };
  return (
    <>
      <Driver tick={tick} />
      <color attach="background" args={[theme.background]} />
      <ambientLight intensity={0.8} />
      <pointLight position={[50, 50, 50]} intensity={1.2} />
      <Edges {...shared} />
      <Nodes {...shared} selectedId={selected} onNodeClick={onNodeClick} />
      {options.showLabels === false ? null : <Labels {...shared} />}
      <Rig positions={positions} focusId={options.focusId ?? selected} />
    </>
  );
}

/**
 * Creates a ChartPlugin that renders a force-directed 3D graph with React Three Fiber:
 * `toGraph` for data, `graphThemeAdapter` for theme, then {@link useForceLayout3D},
 * {@link InstancedNodes}, {@link EdgeLines}, {@link NodeLabels} and {@link CameraRig} inside a `Canvas`.
 *
 * @example
 * ```tsx
 * import { createR3FGraphPlugin } from 'lumagrid/r3f';
 * registerPlugin(createR3FGraphPlugin({ layout: { seed: 7 } }));
 * ```
 *
 * @beta
 * @experimental
 */
export function createR3FGraphPlugin(options: R3FGraphPluginOptions = {}): ChartPlugin<Graph, GraphTheme, Record<string, unknown>> {
  const id = options.id ?? 'r3f-graph';
  const label = options.label ?? '3D graph (R3F)';
  function Renderer({ data, theme, width, height }: RendererProps<Graph, GraphTheme, Record<string, unknown>>): React.ReactElement {
    return (
      <div role="img" aria-label={`${label}: ${data.nodes.length} nodes, ${data.links.length} links`} style={{ width, height, position: 'relative' }}>
        <Canvas camera={{ position: [0, 0, 120], fov: 50 }} style={{ width, height }}>
          <Scene graph={data} theme={theme} options={options} />
        </Canvas>
      </div>
    );
  }
  return {
    id,
    label,
    dataAdapter: (data: TransformedData) => toGraph(data, options.graph),
    themeAdapter: (theme: ThemeDefinition) => graphThemeAdapter(theme),
    Renderer,
  };
}
