import type React from 'react';
import { createElement } from 'react';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import { toGraph } from '../transforms/to-graph.js';
import type { Graph, ToGraphOptions } from '../transforms/to-graph.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';
import { graphThemeAdapter } from './graph-theme.js';
import type { GraphEvents, GraphTheme } from './graph-theme.js';

/**
 * Theme object shaped like Reagraph's `Theme` (typed locally so lumagrid does not import `reagraph`),
 * plus `colors` and `nodeDefault` conveniences. Pass it to `<GraphCanvas theme={theme} />`.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface ReagraphTheme {
  canvas: { background: string; fog?: string };
  node: {
    fill: string;
    activeFill: string;
    opacity: number;
    selectedOpacity: number;
    inactiveOpacity: number;
    label: { color: string; stroke?: string; activeColor: string };
  };
  ring: { fill: string; activeFill: string };
  edge: {
    fill: string;
    activeFill: string;
    opacity: number;
    selectedOpacity: number;
    inactiveOpacity: number;
    label: { color: string; stroke?: string; activeColor: string; fontSize?: number };
  };
  arrow: { fill: string; activeFill: string };
  lasso: { background: string; border: string };
  cluster?: { stroke?: string; fill?: string; label?: { color: string; stroke?: string } };
  /** Convenience: categorical node colors, indexed by group. */
  colors: string[];
  /** Convenience: fill for nodes without a group. */
  nodeDefault: string;
}

/**
 * Maps a Lumagrid theme to a Reagraph theme.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export function reagraphThemeAdapter(theme: ThemeDefinition): ReagraphTheme {
  const g = graphThemeAdapter(theme);
  return {
    canvas: { background: g.background },
    node: {
      fill: g.nodeDefault,
      activeFill: g.highlight,
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.2,
      label: { color: g.label, stroke: g.background, activeColor: g.label },
    },
    ring: { fill: g.edge, activeFill: g.highlight },
    edge: {
      fill: g.edge,
      activeFill: g.edgeActive,
      opacity: 1,
      selectedOpacity: 1,
      inactiveOpacity: 0.1,
      label: { color: g.label, stroke: g.background, activeColor: g.label, fontSize: g.fontSize },
    },
    arrow: { fill: g.edge, activeFill: g.edgeActive },
    lasso: { background: `${g.highlight}22`, border: g.highlight },
    cluster: { stroke: g.edge, fill: g.labelBackground, label: { color: g.label, stroke: g.background } },
    colors: g.nodeColors,
    nodeDefault: g.nodeDefault,
  };
}

/**
 * A node in Reagraph's input shape.
 *
 * @beta
 * @experimental
 */
export interface ReagraphNode {
  id: string;
  label: string;
  fill: string;
  size: number;
  /** Original group, usable as Reagraph's `clusterAttribute`. */
  data: { group?: string; degree: number };
}

/**
 * An edge in Reagraph's input shape.
 *
 * @beta
 * @experimental
 */
export interface ReagraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  size?: number;
}

/**
 * Reagraph's `{ nodes, edges }` input.
 *
 * @beta
 * @experimental
 */
export interface ReagraphData {
  nodes: ReagraphNode[];
  edges: ReagraphEdge[];
}

/**
 * Configuration for the Reagraph plugin, mapped to `GraphCanvas` props, plus {@link GraphEvents}
 * and the {@link ToGraphOptions} field names.
 *
 * @beta
 * @experimental
 */
export interface ReagraphConfig extends GraphEvents, ToGraphOptions {
  layoutType?: string;
  mode?: '2d' | '3d';
  /** Node `data` key to cluster by, e.g. `'group'`. */
  clusterAttribute?: string;
  selection?: 'single' | 'multi' | 'lasso';
  pathSelectionType?: 'direct' | 'out' | 'in' | 'all';
}

const MIN_SIZE = 4;
const MAX_SIZE = 20;

/**
 * Maps a {@link Graph} to Reagraph input. Node color comes from the node's group (by order of first
 * appearance, cycling through `theme.nodeColors`); size grows with degree. Pure.
 *
 * @beta
 * @experimental
 */
export function toReagraphData(graph: Graph, theme: Pick<GraphTheme, 'nodeColors' | 'nodeDefault'>): ReagraphData {
  const groupIndex = new Map<string, number>();
  for (const n of graph.nodes) {
    if (n.group !== undefined && !groupIndex.has(n.group)) groupIndex.set(n.group, groupIndex.size);
  }
  const palette = theme.nodeColors;
  const nodes = graph.nodes.map((n): ReagraphNode => {
    const idx = n.group === undefined ? undefined : groupIndex.get(n.group);
    const fill = idx === undefined || palette.length === 0 ? theme.nodeDefault : (palette[idx % palette.length] as string);
    const data: ReagraphNode['data'] = { degree: n.degree };
    if (n.group !== undefined) data.group = n.group;
    return { id: n.id, label: n.label, fill, size: Math.min(MAX_SIZE, MIN_SIZE + n.degree * 2), data };
  });
  const edges = graph.links.map((l): ReagraphEdge => {
    const e: ReagraphEdge = { id: l.id, source: l.source, target: l.target };
    if (l.weight !== undefined) e.size = l.weight;
    return e;
  });
  return { nodes, edges };
}

/**
 * Config defaults for the three documented presets. Spread into a config or pass as `preset`.
 *
 * @beta
 * @experimental
 */
export const reagraphPresets = {
  'reagraph-2d': { mode: '2d', layoutType: 'forceDirected2d' },
  'reagraph-3d': { mode: '3d', layoutType: 'forceDirected3d' },
  'reagraph-clustered': { mode: '2d', layoutType: 'forceDirected2d', clusterAttribute: 'group' },
} as const satisfies Record<string, ReagraphConfig>;

/**
 * Options for {@link createReagraphPlugin}.
 *
 * @beta
 * @experimental
 */
export interface ReagraphPluginOptions {
  /** Defaults to the preset name, else `reagraph`. */
  id?: string;
  label?: string;
  /** Config defaults; explicit view config wins. */
  preset?: keyof typeof reagraphPresets;
  /** Renderer supplied by the app, typically wrapping Reagraph's `GraphCanvas`. */
  Renderer: React.ComponentType<RendererProps<ReagraphData, ReagraphTheme, ReagraphConfig>>;
}

/**
 * Creates a ChartPlugin backed by Reagraph (WebGL 2D/3D graphs). The app supplies the `Renderer`
 * (so `reagraph` stays the app's dependency); it receives Reagraph-shaped data and theme.
 *
 * @example
 * ```tsx
 * import { GraphCanvas } from 'reagraph';
 * import { createReagraphPlugin } from 'lumagrid/plugins';
 *
 * registerPlugin(createReagraphPlugin({
 *   preset: 'reagraph-clustered',
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <div style={{ position: 'relative', width, height }}>
 *       <GraphCanvas nodes={data.nodes} edges={data.edges} theme={theme}
 *         layoutType={config?.layoutType as never} clusterAttribute={config?.clusterAttribute} />
 *     </div>
 *   ),
 * }));
 * ```
 *
 * @beta
 * @experimental
 */
export function createReagraphPlugin(
  options: ReagraphPluginOptions,
): ChartPlugin<Graph, ReagraphTheme, ReagraphConfig> {
  const defaults: ReagraphConfig = options.preset ? reagraphPresets[options.preset] : {};
  const Inner = options.Renderer;
  const Renderer: React.ComponentType<RendererProps<Graph, ReagraphTheme, ReagraphConfig>> = ({ data, theme, width, height, config }) =>
    createElement(Inner, {
      data: toReagraphData(data, { nodeColors: theme.colors, nodeDefault: theme.nodeDefault }),
      theme,
      width,
      height,
      config: { ...defaults, ...config },
    });
  return {
    id: options.id ?? options.preset ?? 'reagraph',
    label: options.label ?? options.id ?? options.preset ?? 'reagraph',
    dataAdapter: (data: TransformedData, config?: ReagraphConfig) => toGraph(data, { ...defaults, ...config }),
    themeAdapter: reagraphThemeAdapter,
    Renderer,
  };
}
