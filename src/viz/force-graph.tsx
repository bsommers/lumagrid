import React, { useEffect, useMemo, useRef } from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

interface Node {
  id: string;
  label: string;
  group: string | undefined;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number | undefined;
}

/**
 * Force-directed layout via pairwise repulsion + edge attraction.
 * O(n^2) per iteration x `iterations` — fine at dashboard-widget scale
 * (tens to low hundreds of nodes), but avoid feeding it thousands of rows.
 */
function runSimulation(nodes: Node[], edges: Edge[], iterations = 60): Node[] {
  const result = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(result.map((n) => [n.id, n]));
  const k = Math.sqrt(result.length);

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    // Repulsion
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]!;
        const b = result[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (k * k) / dist * alpha * 0.5;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }
    }
    // Attraction along edges
    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist / k) * alpha * 0.5;
      s.vx += (dx / dist) * force;
      s.vy += (dy / dist) * force;
      t.vx -= (dx / dist) * force;
      t.vy -= (dy / dist) * force;
    }
    // Apply velocity
    for (const n of result) {
      n.x += n.vx * 0.85;
      n.y += n.vy * 0.85;
      n.vx *= 0.8;
      n.vy *= 0.8;
    }
  }
  return result;
}

/** Deterministic 32-bit string hash (FNV-1a). */
function hashString(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Deterministic pseudo-random number in [0, 1) for a given seed + key (mulberry32 step). */
function seededUnit(seed: number, key: string): number {
  let t = (hashString(key) ^ Math.imul(seed | 0, 0x9e3779b1)) + 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/**
 * Props for {@link ForceGraph}.
 *
 * @public
 */
export interface ForceGraphProps extends NativeChartProps {
  /**
   * Re-run the layout simulation when the graph's nodes or edges change.
   * Default `true`. When `false`, the layout is computed once; on later data
   * changes existing nodes keep their positions, new nodes are placed at their
   * seeded initial position, and removed nodes are dropped — no re-simulation.
   * Resizing never triggers a relayout (positions are rescaled to fit).
   *
   * @beta
   * @experimental
   */
  relayout?: boolean;
  /**
   * Seed for the deterministic initial node placement. Default `1`.
   *
   * @beta
   * @experimental
   */
  seed?: number;
  /**
   * Simulation iterations per layout run. Default `60`.
   *
   * @beta
   * @experimental
   */
  iterations?: number;
}

/**
 * Force-directed graph: node rows carry an id (`idField`) and a label (`labelField`);
 * rows with a `source` column are edges. Legacy `xField` (id) and `yField` (label) are
 * accepted; role names win when both are given.
 *
 * @public
 */
export function ForceGraph({
  data, width, height, idField, labelField, xField, yField, ariaLabel, theme,
  relayout = true, seed = 1, iterations = 60,
}: ForceGraphProps): React.ReactElement {
  // Expect data.rows to have: id, label, [group], and optionally source/target for edges
  const nodeRows = data.rows.filter((r) => r['source'] === undefined || r['source'] === null);
  const edgeRows = data.rows.filter((r) => r['source'] !== undefined && r['source'] !== null);

  // Role name, then legacy alias, then the literal column name
  const idKey = idField ?? xField ?? 'id';
  const labelKey = labelField ?? yField ?? 'label';

  const baseNodes = nodeRows.map((r) => ({
    id: String(r[idKey] ?? r['id'] ?? ''),
    label: String(r[labelKey] ?? r['label'] ?? ''),
    group: r['group'] !== undefined ? String(r['group']) : undefined,
  }));

  const edges: Edge[] = edgeRows.map((r) => ({
    source: String(r['source'] ?? ''),
    target: String(r['target'] ?? ''),
    weight: typeof r['weight'] === 'number' ? r['weight'] : undefined,
  }));

  // Content key: only a change in graph structure (or seed/iterations) triggers a
  // new layout. Width/height are excluded on purpose — the render step rescales
  // positions to fit, so a resize must not reshuffle the graph.
  const layoutKey = JSON.stringify([
    baseNodes.map((n) => n.id),
    edges.map((e) => [e.source, e.target]),
    seed,
    iterations,
  ]);

  // Positions from the previous layout, keyed by node id. Used to warm-start a
  // relayout (so the graph evolves instead of jumping) and to hold positions
  // when relayout is disabled.
  const prevPositions = useRef<Map<string, { x: number; y: number }> | null>(null);

  const positioned = useMemo(() => {
    const prev = prevPositions.current;
    const initial: Node[] = baseNodes.map((n) => {
      const p = prev?.get(n.id);
      return {
        ...n,
        x: p ? p.x : width / 2 + (seededUnit(seed, `${n.id}:x`) - 0.5) * width * 0.6,
        y: p ? p.y : height / 2 + (seededUnit(seed, `${n.id}:y`) - 0.5) * height * 0.6,
        vx: 0,
        vy: 0,
      };
    });
    if (prev && !relayout) return initial;
    return runSimulation(initial, edges, iterations);
    // Recompute only when graph structure changes (layoutKey), not on every new
    // rows array identity or resize; labels/groups are applied below without relayout.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutKey]);

  useEffect(() => {
    prevPositions.current = new Map(positioned.map((n) => [n.id, { x: n.x, y: n.y }]));
  }, [positioned]);

  // Labels/groups may change without a structural change; take them from current data.
  const meta = new Map(baseNodes.map((n) => [n.id, n]));
  const nodes: Node[] = positioned.map((n) => ({ ...n, ...meta.get(n.id) }));

  const groups = [...new Set(nodes.map((n) => n.group ?? 'default'))];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Fit the layout into the viewport with a uniform scale (aspect ratio preserved)
  // and centre it. The fit depends only on the nodes' own extent, so a resize
  // rescales the same layout instead of distorting or cornering it.
  const pad = 24;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = xs.length ? Math.min(...xs) : 0;
  const minY = ys.length ? Math.min(...ys) : 0;
  const spanX = xs.length ? Math.max(...xs) - minX : 0;
  const spanY = ys.length ? Math.max(...ys) - minY : 0;
  const availW = Math.max(width - pad * 2, 0);
  const availH = Math.max(height - pad * 2, 0);
  const fit = Math.min(spanX > 0 ? availW / spanX : Infinity, spanY > 0 ? availH / spanY : Infinity);
  const k = Number.isFinite(fit) ? fit : 0;
  const offX = pad + (availW - spanX * k) / 2;
  const offY = pad + (availH - spanY * k) / 2;
  const scaleX = (x: number) => offX + (x - minX) * k;
  const scaleY = (y: number) => offY + (y - minY) * k;

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? 'Force-directed graph'} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      {edges.map((edge, i) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) return null;
        return (
          <line key={i}
            x1={scaleX(s.x)} y1={scaleY(s.y)}
            x2={scaleX(t.x)} y2={scaleY(t.y)}
            stroke={theme.surface.border} strokeWidth={edge.weight ? Math.max(1, edge.weight) : 1.5}
            opacity={0.6} />
        );
      })}
      {nodes.map((node) => {
        const gIdx = groups.indexOf(node.group ?? 'default');
        return (
          <g key={node.id} transform={`translate(${scaleX(node.x)},${scaleY(node.y)})`}>
            <circle r={10} fill={categoricalColor(theme, gIdx)} stroke={theme.surface.background} strokeWidth={2} opacity={0.9}>
              <title>{node.label}</title>
            </circle>
            <text y={18} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
              fill={theme.text.secondary}>{node.label.slice(0, 12)}</text>
          </g>
        );
      })}
    </svg>
  );
}
