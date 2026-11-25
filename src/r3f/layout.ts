import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { forceCenter, forceLink, forceManyBody, forceSimulation } from 'd3-force-3d';
import type { Simulation } from 'd3-force-3d';
import type { Graph } from '../transforms/to-graph.js';

/**
 * A node position in 3D space.
 *
 * @beta
 * @experimental
 */
export type Vec3 = [number, number, number];

/**
 * Options shared by {@link layoutGraph3D} and {@link useForceLayout3D}.
 *
 * @beta
 * @experimental
 */
export interface ForceLayout3DOptions {
  /** Seed for the initial node positions and the simulation's random source. Default 1. */
  seed?: number;
  /** Maximum number of simulation ticks. Default 300. */
  iterations?: number;
  /** Alpha decay per tick; larger settles sooner. Default 0.0228 (d3 default). */
  alphaDecay?: number | undefined;
  /** Target link length. Default 30. */
  linkDistance?: number;
  /** Many-body strength; negative repels. Default -30. */
  charge?: number;
  /** Hook only: when true the simulation does not advance. Default false. */
  stopped?: boolean;
}

/**
 * Result of {@link useForceLayout3D}.
 *
 * @beta
 * @experimental
 */
export interface ForceLayout3DResult {
  /** Node id to position. The map instance is stable and updated in place by `tick`; read it inside `useFrame`. */
  positions: Map<string, Vec3>;
  /** Advances the simulation one step (no-op when stopped or settled). Call it from `useFrame`. */
  tick: () => void;
  /** True once the simulation has cooled or `iterations` ticks have run. */
  settled: boolean;
}

/** Small seeded PRNG (mulberry32). */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Sim {
  sim: Simulation;
  positions: Map<string, Vec3>;
  ids: string[];
}

function createSim(graph: Graph, opts: ForceLayout3DOptions): Sim {
  const { seed = 1, alphaDecay, linkDistance = 30, charge = -30 } = opts;
  const rand = rng(seed);
  const spread = linkDistance * Math.cbrt(graph.nodes.length + 1);
  const ids = graph.nodes.map((n) => n.id);
  const known = new Set(ids);
  const nodes = ids.map((id) => ({
    id,
    x: (rand() - 0.5) * spread,
    y: (rand() - 0.5) * spread,
    z: (rand() - 0.5) * spread,
  }));
  const links = graph.links.filter((l) => known.has(l.source) && known.has(l.target)).map((l) => ({ source: l.source, target: l.target }));
  const sim = forceSimulation(nodes, 3)
    .randomSource(rng(seed ^ 0x9e3779b9))
    .force('link', forceLink(links).id((n) => String(n.id)).distance(linkDistance))
    .force('charge', forceManyBody().strength(charge))
    .force('center', forceCenter(0, 0, 0))
    .stop();
  if (alphaDecay !== undefined) sim.alphaDecay(alphaDecay);
  const positions = new Map<string, Vec3>();
  const sync = (): void => {
    for (const n of sim.nodes()) positions.set(String(n.id), [n.x, n.y, n.z]);
  };
  sync();
  const advance = sim.tick.bind(sim);
  sim.tick = () => {
    advance();
    sync();
    return sim;
  };
  return { sim, positions, ids };
}

/**
 * Runs a fixed number of force-simulation ticks synchronously and returns the node positions.
 * Deterministic for a given graph and `seed`; never mutates `graph`. Useful for tests, static
 * renders and warm starts.
 *
 * @beta
 * @experimental
 */
export function layoutGraph3D(graph: Graph, options: ForceLayout3DOptions = {}): Map<string, Vec3> {
  const { sim, positions } = createSim(graph, options);
  const iterations = Math.max(0, Math.floor(options.iterations ?? 300));
  for (let i = 0; i < iterations && sim.alpha() >= sim.alphaMin(); i++) sim.tick();
  return positions;
}

/**
 * React hook running a seeded, stoppable 3D force simulation over a `Graph`.
 * Initial positions come from `seed` (no `Math.random`), so a given graph and seed always settle
 * to the same layout. Drive it with `tick()` from `useFrame`. The graph is never mutated.
 *
 * @beta
 * @experimental
 */
export function useForceLayout3D(graph: Graph, options: ForceLayout3DOptions = {}): ForceLayout3DResult {
  const { seed = 1, iterations = 300, alphaDecay, linkDistance = 30, charge = -30, stopped = false } = options;
  const key = `${seed}|${alphaDecay ?? ''}|${linkDistance}|${charge}|${graph.nodes.map((n) => n.id).join('\u0001')}|${graph.links.map((l) => `${l.source}>${l.target}`).join('\u0001')}`;
  const graphRef = useRef(graph);
  graphRef.current = graph;
  const state = useMemo(
    () => createSim(graphRef.current, { seed, linkDistance, charge, ...(alphaDecay === undefined ? {} : { alphaDecay }) }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key],
  );
  const count = useRef(0);
  const [settled, setSettled] = useState(false);
  useEffect(() => {
    count.current = 0;
    setSettled(false);
  }, [state]);
  const tick = useCallback(() => {
    if (stopped || count.current >= iterations) return;
    if (state.sim.alpha() < state.sim.alphaMin()) {
      count.current = iterations;
      setSettled(true);
      return;
    }
    state.sim.tick();
    count.current += 1;
    if (count.current >= iterations) setSettled(true);
  }, [state, stopped, iterations]);
  return { positions: state.positions, tick, settled };
}
