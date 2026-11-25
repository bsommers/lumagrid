import { describe, it, expect } from 'vitest';
import { layoutGraph3D } from '../layout.js';
import { toGraph } from '../../transforms/to-graph.js';
import { graphSampleData } from '../../testing/index.js';

const graph = toGraph(graphSampleData);

describe('layoutGraph3D', () => {
  it('is deterministic for a seed', () => {
    const a = layoutGraph3D(graph, { seed: 5, iterations: 50 });
    const b = layoutGraph3D(graph, { seed: 5, iterations: 50 });
    expect([...a]).toEqual([...b]);
  });
  it('differs across seeds', () => {
    const a = layoutGraph3D(graph, { seed: 1, iterations: 50 });
    const b = layoutGraph3D(graph, { seed: 2, iterations: 50 });
    expect([...a]).not.toEqual([...b]);
  });
  it('does not mutate the input graph', () => {
    const frozen = JSON.stringify(graph);
    layoutGraph3D(graph, { iterations: 20 });
    expect(JSON.stringify(graph)).toBe(frozen);
  });
  it('handles an empty graph', () => {
    expect(layoutGraph3D({ nodes: [], links: [], dropped: 0 }).size).toBe(0);
  });
  it('produces finite positions for every node', () => {
    const p = layoutGraph3D(graph, { iterations: 100 });
    expect(p.size).toBe(graph.nodes.length);
    for (const v of p.values()) expect(v.every(Number.isFinite)).toBe(true);
  });
  it('zero iterations returns seeded initial positions', () => {
    expect(layoutGraph3D(graph, { iterations: 0 }).size).toBe(graph.nodes.length);
  });
});
