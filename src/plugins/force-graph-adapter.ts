import type React from 'react';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import { toGraph } from '../transforms/to-graph.js';
import type { Graph } from '../transforms/to-graph.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';
import { graphThemeAdapter } from './graph-theme.js';
import type { GraphEvents, GraphTheme } from './graph-theme.js';

/**
 * Theme tokens for `react-force-graph-2d` / `-3d`, named after the props they feed
 * (`backgroundColor`, `linkColor`, `linkDirectionalParticleColor`, ...).
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface RfgTheme {
  /** `backgroundColor` prop. */
  backgroundColor: string;
  /** `linkColor` prop. */
  linkColor: string;
  /** Color for particles and highlighted links. */
  linkActiveColor: string;
  /** Node label text color (draw it in `nodeCanvasObject`, or style the 3D tooltip). */
  nodeLabelColor: string;
  nodeLabelBackground: string;
  /** Color for nodes without a group. */
  nodeDefaultColor: string;
  /** Categorical node colors, indexed by group. */
  nodeColors: string[];
  /** Selection / hover highlight. */
  highlightColor: string;
  fontFamily: string;
  fontSize: number;
}

/**
 * Maps a Lumagrid theme to {@link RfgTheme}.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export function forceGraphThemeAdapter(theme: ThemeDefinition): RfgTheme {
  const g: GraphTheme = graphThemeAdapter(theme);
  return {
    backgroundColor: g.background,
    linkColor: g.edge,
    linkActiveColor: g.edgeActive,
    nodeLabelColor: g.label,
    nodeLabelBackground: g.labelBackground,
    nodeDefaultColor: g.nodeDefault,
    nodeColors: g.nodeColors,
    highlightColor: g.highlight,
    fontFamily: g.fontFamily,
    fontSize: g.fontSize,
  };
}

/**
 * A node in the shape react-force-graph expects.
 *
 * @beta
 * @experimental
 */
export interface RfgNode {
  id: string;
  name: string;
  /** Node size: degree, or the summed weight of its links when `sizeBy` is `'weight'`. */
  val: number;
  /** Resolved color; empty until {@link themeRfgData} (or a theme passed to {@link toRfgData}) fills it. */
  color: string;
  group?: string;
  /** Index of the node's group in order of first appearance, or -1 without a group. */
  colorIndex: number;
}

/**
 * A link in the shape react-force-graph expects.
 *
 * @beta
 * @experimental
 */
export interface RfgLink {
  source: string;
  target: string;
  value: number;
}

/**
 * The `graphData` prop of react-force-graph.
 *
 * @beta
 * @experimental
 */
export interface RfgData {
  nodes: RfgNode[];
  links: RfgLink[];
}

/**
 * Per-view config of the react-force-graph plugin. The knobs are hints: the `Renderer` you supply
 * decides how to pass them to the engine (d3-force settings, particles, camera).
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface RfgConfig extends GraphEvents {
  /** Which engine the Renderer mounts. Default `'2d'`. */
  variant?: '2d' | '3d';
  /** Maps to the `cooldownTicks` prop. */
  cooldownTicks?: number;
  /** d3-force link distance (`d3Force('link').distance`). */
  linkDistance?: number;
  /** d3-force charge strength (`d3Force('charge').strength`); negative repels. */
  chargeStrength?: number;
  /** Animate particles along links (`linkDirectionalParticles`). */
  particles?: boolean;
  /** Center or fly the camera to a node on click. */
  focusOnClick?: boolean;
  /** Keep at most this many nodes (highest degree first). */
  maxNodes?: number;
  /** Size nodes by degree (default) or by summed link weight. */
  sizeBy?: 'degree' | 'weight';
}

/**
 * Converts a `Graph` to react-force-graph data. Nodes get a categorical color per group
 * (order of first appearance) and fall back to the theme's default color.
 *
 * @beta
 * @experimental
 */
export function toRfgData(graph: Graph, theme?: RfgTheme, sizeBy: 'degree' | 'weight' = 'degree'): RfgData {
  const groups = new Map<string, number>();
  const weightSum = new Map<string, number>();
  if (sizeBy === 'weight') {
    for (const l of graph.links) {
      const w = l.weight ?? 1;
      weightSum.set(l.source, (weightSum.get(l.source) ?? 0) + w);
      weightSum.set(l.target, (weightSum.get(l.target) ?? 0) + w);
    }
  }
  const nodes = graph.nodes.map((n): RfgNode => {
    let colorIndex = -1;
    if (n.group !== undefined) {
      if (!groups.has(n.group)) groups.set(n.group, groups.size);
      colorIndex = groups.get(n.group)!;
    }
    const val = sizeBy === 'weight' ? (weightSum.get(n.id) ?? 0) : n.degree;
    const node: RfgNode = { id: n.id, name: n.label, val: Math.max(val, 1), color: '', colorIndex };
    if (n.group !== undefined) node.group = n.group;
    return node;
  });
  const links = graph.links.map((l): RfgLink => ({ source: l.source, target: l.target, value: l.weight ?? 1 }));
  const data: RfgData = { nodes, links };
  return theme ? themeRfgData(data, theme) : data;
}

/**
 * Fills node colors from the theme: one categorical color per group, the default color for
 * ungrouped nodes. Pure; returns new nodes. Call it in your `Renderer` (the plugin's `dataAdapter`
 * has no theme), memoized on `data` and `theme`.
 *
 * @beta
 * @experimental
 */
export function themeRfgData(data: RfgData, theme: RfgTheme): RfgData {
  const palette = theme.nodeColors;
  return {
    nodes: data.nodes.map((n) => ({
      ...n,
      color: n.colorIndex >= 0 && palette.length > 0 ? palette[n.colorIndex % palette.length]! : theme.nodeDefaultColor,
    })),
    links: data.links,
  };
}

/**
 * Options for {@link createForceGraphPlugin}.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface ForceGraphPluginOptions {
  /** Plugin id. Default `'rfg-2d'` or `'rfg-3d'` from `variant`. */
  id?: string;
  label?: string;
  /** Default variant when the view config does not set one. Default `'2d'`. */
  variant?: '2d' | '3d';
  /**
   * Your component that mounts `ForceGraph2D` or `ForceGraph3D` from react-force-graph with the
   * `data` and `theme` it receives. Lumagrid never imports the engine.
   */
  Renderer: React.ComponentType<RendererProps<RfgData, RfgTheme, RfgConfig>>;
}

/**
 * Creates a ChartPlugin backed by react-force-graph. The app supplies the engine inside `Renderer`
 * (optional peers `react-force-graph-2d` / `react-force-graph-3d`); data comes from `toGraph`.
 * Node colors are filled by {@link themeRfgData} in your Renderer. The same recipe works for react-force-graph-vr and -ar.
 *
 * Experimental: may change in a minor release.
 *
 * @example
 * ```tsx
 * import ForceGraph2D from 'react-force-graph-2d';
 * import { createForceGraphPlugin, themeRfgData } from 'lumagrid/plugins';
 *
 * registerPlugin(createForceGraphPlugin({
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <ForceGraph2D graphData={themeRfgData(data, theme)} width={width} height={height}
 *       backgroundColor={theme.backgroundColor} linkColor={() => theme.linkColor}
 *       cooldownTicks={config?.cooldownTicks} />
 *   ),
 * }));
 * ```
 *
 * @beta
 * @experimental
 */
export function createForceGraphPlugin(options: ForceGraphPluginOptions): ChartPlugin<RfgData, RfgTheme, RfgConfig> {
  const variant = options.variant ?? '2d';
  const id = options.id ?? `rfg-${variant}`;
  return {
    id,
    label: options.label ?? (variant === '3d' ? 'Force graph 3D (react-force-graph)' : 'Force graph 2D (react-force-graph)'),
    dataAdapter: (data: TransformedData, config?: RfgConfig) =>
      toRfgData(toGraph(data, config?.maxNodes === undefined ? {} : { maxNodes: config.maxNodes }), undefined, config?.sizeBy),
    themeAdapter: forceGraphThemeAdapter,
    Renderer: options.Renderer,
  };
}
