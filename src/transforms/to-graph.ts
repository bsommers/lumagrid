import type { DataRow, TransformedData } from './types.js';

/**
 * A node of a {@link Graph}.
 *
 * @beta
 * @experimental
 */
export interface GraphNode {
  id: string;
  label: string;
  group?: string;
  /** Number of edges touching the node. */
  degree: number;
  /** Source row for node rows; absent for nodes implied by an edge. */
  data?: DataRow;
}

/**
 * An edge of a {@link Graph}.
 *
 * @beta
 * @experimental
 */
export interface GraphLink {
  /** Stable id: `source->target#index`. */
  id: string;
  source: string;
  target: string;
  weight?: number;
}

/**
 * Engine-neutral node and edge lists produced by {@link toGraph}.
 *
 * @beta
 * @experimental
 */
export interface Graph {
  nodes: GraphNode[];
  links: GraphLink[];
  /** Rows or edges dropped (empty ids, dangling edges when `implicitNodes` is false, cap overflow). */
  dropped: number;
}

/**
 * Options for {@link toGraph}. Field names follow the native ForceGraph rows:
 * node rows carry `id`, `label`, `group`; rows with a non-null `source` are edges.
 *
 * @beta
 * @experimental
 */
export interface ToGraphOptions {
  idField?: string;
  labelField?: string;
  groupField?: string;
  sourceField?: string;
  targetField?: string;
  weightField?: string;
  /** Create a node for an edge endpoint that has no node row. Default `true`. */
  implicitNodes?: boolean;
  /** Keep at most this many nodes (highest degree first, ties by id). Edges to dropped nodes are dropped. */
  maxNodes?: number;
}

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

/**
 * Converts `TransformedData` rows into a `{ nodes, links }` graph that every graph engine
 * (Reagraph, react-force-graph, R3F scenes) can consume. Pure and deterministic; never mutates its input.
 * Duplicate node ids keep the first row. Edges keep input order.
 *
 * @beta
 * @experimental
 */
export function toGraph(data: TransformedData, options: ToGraphOptions = {}): Graph {
  const {
    idField = 'id', labelField = 'label', groupField = 'group',
    sourceField = 'source', targetField = 'target', weightField = 'weight',
    implicitNodes = true, maxNodes,
  } = options;

  let dropped = 0;
  const nodes = new Map<string, GraphNode>();
  const edgeRows: DataRow[] = [];

  for (const row of data.rows) {
    if (row[sourceField] !== undefined && row[sourceField] !== null) {
      edgeRows.push(row);
      continue;
    }
    const id = str(row[idField]);
    if (id === '' || nodes.has(id)) { dropped++; continue; }
    const group = row[groupField];
    const node: GraphNode = { id, label: str(row[labelField]) || id, degree: 0, data: row };
    if (group !== undefined && group !== null) node.group = String(group);
    nodes.set(id, node);
  }

  let links: GraphLink[] = [];
  edgeRows.forEach((row, i) => {
    const source = str(row[sourceField]);
    const target = str(row[targetField]);
    if (source === '' || target === '') { dropped++; return; }
    for (const end of [source, target]) {
      if (nodes.has(end)) continue;
      if (implicitNodes) nodes.set(end, { id: end, label: end, degree: 0 });
    }
    if (!nodes.has(source) || !nodes.has(target)) { dropped++; return; }
    const link: GraphLink = { id: `${source}->${target}#${i}`, source, target };
    const w = row[weightField];
    if (typeof w === 'number' && Number.isFinite(w)) link.weight = w;
    links.push(link);
  });

  for (const l of links) {
    nodes.get(l.source)!.degree++;
    nodes.get(l.target)!.degree++;
  }

  let list = [...nodes.values()];
  if (maxNodes !== undefined && list.length > maxNodes) {
    const keep = new Set(
      [...list].sort((a, b) => b.degree - a.degree || (a.id < b.id ? -1 : 1)).slice(0, Math.max(0, maxNodes)).map((n) => n.id),
    );
    dropped += list.length - keep.size;
    list = list.filter((n) => keep.has(n.id));
    const before = links.length;
    links = links.filter((l) => keep.has(l.source) && keep.has(l.target));
    dropped += before - links.length;
    const deg = new Map<string, number>();
    for (const l of links) {
      deg.set(l.source, (deg.get(l.source) ?? 0) + 1);
      deg.set(l.target, (deg.get(l.target) ?? 0) + 1);
    }
    list = list.map((n) => ({ ...n, degree: deg.get(n.id) ?? 0 }));
  }

  return { nodes: list, links, dropped };
}
