import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { createReagraphPlugin, reagraphThemeAdapter, toReagraphData, reagraphPresets } from '../reagraph-adapter.js';
import type { ReagraphData } from '../reagraph-adapter.js';
import { toGraph } from '../../transforms/to-graph.js';
import { graphThemeAdapter } from '../graph-theme.js';
import { lightTheme } from '../../theme/light.js';
import { darkTheme } from '../../theme/dark.js';
import { graphSampleData, assertPluginConformance } from '../../testing/index.js';

// The library never imports reagraph; the stub stands in for GraphCanvas.
vi.mock('reagraph', () => ({ GraphCanvas: () => null }));

const g = graphThemeAdapter(lightTheme);

describe('toReagraphData', () => {
  const data = toReagraphData(toGraph(graphSampleData), g);
  it('colors nodes by group from the theme', () => {
    const fill = (id: string) => data.nodes.find((n) => n.id === id)?.fill;
    expect(fill('a')).toBe(g.nodeColors[0]);
    expect(fill('b')).toBe(g.nodeColors[0]);
    expect(fill('c')).toBe(g.nodeColors[1]);
  });
  it('sizes by degree', () => {
    const hub = toReagraphData(toGraph({ rows: [
      { source: 'h', target: 'a' }, { source: 'h', target: 'b' }, { source: 'h', target: 'c' },
    ], fields: [] }), g);
    const size = (id: string) => hub.nodes.find((n) => n.id === id)!.size;
    expect(size('h')).toBeGreaterThan(size('a'));
  });
  it('maps edges', () => {
    expect(data.edges).toHaveLength(4);
    expect(data.edges[0]).toMatchObject({ source: 'a', target: 'b', size: 2 });
  });
  it('uses the default color for ungrouped nodes and handles empty data', () => {
    const one = toReagraphData(toGraph({ rows: [{ id: 'x' }], fields: [] }), g);
    expect(one.nodes[0]?.fill).toBe(g.nodeDefault);
    expect(toReagraphData(toGraph({ rows: [], fields: [] }), g)).toEqual({ nodes: [], edges: [] });
  });
});

describe('reagraphThemeAdapter', () => {
  it('differs between light and dark', () => {
    const l = reagraphThemeAdapter(lightTheme);
    const d = reagraphThemeAdapter(darkTheme);
    expect(l.canvas.background).not.toBe(d.canvas.background);
    expect(l.node.label.color).not.toBe(d.node.label.color);
  });
});

describe('createReagraphPlugin', () => {
  const Stub = ({ data, width, height, config }: { data: ReagraphData; width: number; height: number; config?: { mode?: string } }) =>
    createElement('div', { 'aria-label': 'graph', 'data-mode': config?.mode, style: { width, height } }, `${data.nodes.length} nodes`);

  it('applies preset defaults and lets config win', () => {
    const p = createReagraphPlugin({ preset: 'reagraph-3d', Renderer: Stub });
    expect(p.id).toBe('reagraph-3d');
    expect(reagraphPresets['reagraph-3d'].mode).toBe('3d');
    expect(p.dataAdapter(graphSampleData, { maxNodes: 2 }).nodes).toHaveLength(2);
  });

  it('passes conformance with a stub renderer', () => {
    const p = createReagraphPlugin({ Renderer: Stub });
    const report = assertPluginConformance(p, { data: graphSampleData });
    expect(report.ok).toBe(true);
  });
});
