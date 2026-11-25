import { describe, it, expect, vi } from 'vitest';
import { createElement } from 'react';
import { createForceGraphPlugin, forceGraphThemeAdapter, toRfgData, themeRfgData } from '../force-graph-adapter.js';
import type { RfgConfig, RfgData, RfgTheme } from '../force-graph-adapter.js';
import { toGraph } from '../../transforms/to-graph.js';
import { lightTheme } from '../../theme/light.js';
import { darkTheme } from '../../theme/dark.js';
import { graphSampleData, checkPluginConformance } from '../../testing/index.js';
import type { RendererProps } from '../../registry/types.js';

// The engine is supplied by the app; a stub stands in for react-force-graph-2d.
vi.mock('react-force-graph-2d', () => ({ default: () => null }));

function Stub({ data, theme, width, height }: RendererProps<RfgData, RfgTheme, RfgConfig>) {
  const t = themeRfgData(data, theme);
  return createElement('div', { 'aria-label': 'Force graph', style: { width, height, background: theme.backgroundColor }, 'data-nodes': t.nodes.length, 'data-colors': t.nodes.map((n) => n.color).join(',') });
}

describe('toRfgData', () => {
  const graph = toGraph(graphSampleData);
  const theme = forceGraphThemeAdapter(lightTheme);

  it('maps nodes and links', () => {
    const d = toRfgData(graph, theme);
    expect(d.nodes).toHaveLength(4);
    expect(d.nodes[0]).toMatchObject({ id: 'a', name: 'Alpha', val: 2, group: 'x' });
    expect(d.links[0]).toEqual({ source: 'a', target: 'b', value: 2 });
  });

  it('colors by group from the theme', () => {
    const d = toRfgData(graph, theme);
    expect(d.nodes[0]!.color).toBe(theme.nodeColors[0]);
    expect(d.nodes[0]!.color).toBe(d.nodes[1]!.color);
    expect(d.nodes[2]!.color).toBe(theme.nodeColors[1]);
  });

  it('sizes by summed weight and defaults link value to 1', () => {
    const d = toRfgData(graph, theme, 'weight');
    expect(d.nodes.find((n) => n.id === 'a')!.val).toBe(3);
    const noW = toRfgData(toGraph({ rows: [{ source: 'p', target: 'q' }], fields: [] }), theme);
    expect(noW.links[0]!.value).toBe(1);
    expect(noW.nodes[0]!.color).toBe(theme.nodeDefaultColor);
  });
});

describe('forceGraphThemeAdapter', () => {
  it('differs between light and dark', () => {
    const l = forceGraphThemeAdapter(lightTheme);
    const d = forceGraphThemeAdapter(darkTheme);
    expect(l.backgroundColor).not.toBe(d.backgroundColor);
    expect(l.nodeLabelColor).not.toBe(d.nodeLabelColor);
    expect(l.linkColor).toBeTruthy();
  });
});

describe('createForceGraphPlugin', () => {
  it('derives id from variant and honors maxNodes and sizeBy', () => {
    expect(createForceGraphPlugin({ Renderer: Stub }).id).toBe('rfg-2d');
    const p = createForceGraphPlugin({ variant: '3d', Renderer: Stub });
    expect(p.id).toBe('rfg-3d');
    expect(p.dataAdapter(graphSampleData, { maxNodes: 2 }).nodes).toHaveLength(2);
    expect(p.dataAdapter(graphSampleData, { sizeBy: 'weight' }).nodes[0]!.val).toBe(3);
  });

  it('passes conformance with a stub Renderer', () => {
    const report = checkPluginConformance(createForceGraphPlugin({ Renderer: Stub }), { data: graphSampleData });
    expect(report.checks.filter((c) => c.status === 'fail')).toEqual([]);
    expect(report.ok).toBe(true);
  });
});
