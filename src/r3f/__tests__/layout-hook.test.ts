import { describe, it, expect } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useForceLayout3D, layoutGraph3D } from '../layout.js';
import type { ForceLayout3DOptions } from '../layout.js';
import { toGraph } from '../../transforms/to-graph.js';
import { graphSampleData } from '../../testing/index.js';

const graph = toGraph(graphSampleData);

describe('useForceLayout3D', () => {
  it('seeds positions for every node before any tick', () => {
    const { result } = renderHook(() => useForceLayout3D(graph, { seed: 3 }));
    expect(result.current.positions.size).toBe(graph.nodes.length);
    expect(result.current.settled).toBe(false);
  });

  it('tick advances positions and matches layoutGraph3D for the same seed', () => {
    const { result } = renderHook(() => useForceLayout3D(graph, { seed: 5, iterations: 40 }));
    const before = JSON.stringify([...result.current.positions]);
    act(() => {
      for (let i = 0; i < 40; i++) result.current.tick();
    });
    expect(JSON.stringify([...result.current.positions])).not.toBe(before);
    expect(result.current.settled).toBe(true);
    const ref = layoutGraph3D(graph, { seed: 5, iterations: 40 });
    expect([...result.current.positions]).toEqual([...ref]);
  });

  it('is deterministic across hook instances and differs across seeds', () => {
    const run = (seed: number) => {
      const { result } = renderHook(() => useForceLayout3D(graph, { seed, iterations: 10 }));
      act(() => {
        for (let i = 0; i < 10; i++) result.current.tick();
      });
      return JSON.stringify([...result.current.positions]);
    };
    expect(run(2)).toBe(run(2));
    expect(run(2)).not.toBe(run(9));
  });

  it('does nothing while stopped, then resumes', () => {
    const { result, rerender } = renderHook((o: ForceLayout3DOptions) => useForceLayout3D(graph, o), { initialProps: { stopped: true } as ForceLayout3DOptions });
    const before = JSON.stringify([...result.current.positions]);
    act(() => {
      for (let i = 0; i < 5; i++) result.current.tick();
    });
    expect(JSON.stringify([...result.current.positions])).toBe(before);
    rerender({ stopped: false });
    act(() => result.current.tick());
    expect(JSON.stringify([...result.current.positions])).not.toBe(before);
  });

  it('stops ticking once iterations are exhausted', () => {
    const { result } = renderHook(() => useForceLayout3D(graph, { iterations: 2 }));
    act(() => {
      result.current.tick();
      result.current.tick();
    });
    expect(result.current.settled).toBe(true);
    const frozen = JSON.stringify([...result.current.positions]);
    act(() => result.current.tick());
    expect(JSON.stringify([...result.current.positions])).toBe(frozen);
  });

  it('settles when the simulation cools below alphaMin before iterations run out', () => {
    const { result } = renderHook(() => useForceLayout3D(graph, { iterations: 100000, alphaDecay: 0.9 }));
    act(() => {
      for (let i = 0; i < 100; i++) result.current.tick();
    });
    expect(result.current.settled).toBe(true);
  });

  it('rebuilds the simulation and resets settled when the graph changes', () => {
    const small = { ...graph, nodes: graph.nodes.slice(0, 2), links: [] };
    const { result, rerender } = renderHook(({ g }) => useForceLayout3D(g, { iterations: 1 }), { initialProps: { g: graph } });
    act(() => result.current.tick());
    expect(result.current.settled).toBe(true);
    rerender({ g: small });
    expect(result.current.positions.size).toBe(2);
    expect(result.current.settled).toBe(false);
  });

  it('handles an empty graph and unmount cleanly', () => {
    const { result, unmount } = renderHook(() => useForceLayout3D({ nodes: [], links: [], dropped: 0 }));
    act(() => result.current.tick());
    expect(result.current.positions.size).toBe(0);
    expect(() => unmount()).not.toThrow();
  });
});
