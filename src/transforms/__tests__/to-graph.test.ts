import { describe, it, expect } from 'vitest';
import { toGraph } from '../to-graph.js';
import { graphSampleData } from '../../testing/fixtures.js';
import type { TransformedData } from '../types.js';

const td = (rows: TransformedData['rows']): TransformedData => ({ rows, fields: [] });

describe('toGraph', () => {
  it('splits node rows and edge rows', () => {
    const g = toGraph(graphSampleData);
    expect(g.nodes.map((n) => n.id)).toEqual(['a', 'b', 'c', 'd']);
    expect(g.links).toHaveLength(4);
    expect(g.nodes.every((n) => n.degree === 2)).toBe(true);
    expect(g.nodes[0]).toMatchObject({ label: 'Alpha', group: 'x' });
    expect(g.links[0]).toMatchObject({ source: 'a', target: 'b', weight: 2 });
    expect(g.dropped).toBe(0);
  });

  it('creates implicit nodes for edge endpoints', () => {
    const g = toGraph(td([{ source: 'p', target: 'q' }]));
    expect(g.nodes.map((n) => n.id)).toEqual(['p', 'q']);
  });

  it('drops dangling edges when implicitNodes is false', () => {
    const g = toGraph(td([{ id: 'p' }, { source: 'p', target: 'q' }]), { implicitNodes: false });
    expect(g.links).toHaveLength(0);
    expect(g.dropped).toBe(1);
  });

  it('keeps the first of duplicate ids and drops empty ids', () => {
    const g = toGraph(td([{ id: 'p', label: 'one' }, { id: 'p', label: 'two' }, { id: '' }]));
    expect(g.nodes).toHaveLength(1);
    expect(g.nodes[0]!.label).toBe('one');
    expect(g.dropped).toBe(2);
  });

  it('honours custom field names and ignores non-numeric weights', () => {
    const g = toGraph(td([{ k: 'a' }, { from: 'a', to: 'b', w: 'x' }]), { idField: 'k', sourceField: 'from', targetField: 'to', weightField: 'w' });
    expect(g.links[0]!.weight).toBeUndefined();
    expect(g.nodes.map((n) => n.id)).toEqual(['a', 'b']);
  });

  it('caps nodes by degree and recomputes degrees', () => {
    const rows = [{ source: 'h', target: 'a' }, { source: 'h', target: 'b' }, { source: 'h', target: 'c' }];
    const g = toGraph(td(rows), { maxNodes: 2 });
    expect(g.nodes.map((n) => n.id).sort()).toEqual(['a', 'h']);
    expect(g.links).toHaveLength(1);
    expect(g.nodes.find((n) => n.id === 'h')!.degree).toBe(1);
  });

  it('is deterministic and does not mutate input', () => {
    const frozen = JSON.parse(JSON.stringify(graphSampleData)) as TransformedData;
    frozen.rows.forEach(Object.freeze);
    Object.freeze(frozen.rows);
    expect(toGraph(frozen)).toEqual(toGraph(frozen));
  });

  it('handles empty data', () => {
    expect(toGraph(td([]))).toEqual({ nodes: [], links: [], dropped: 0 });
  });
});
