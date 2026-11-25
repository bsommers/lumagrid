import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';

const h = vi.hoisted(() => ({ frames: [] as Array<() => void> }));
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => <div data-testid="canvas">{children}</div>,
  useFrame: (cb: () => void) => {
    h.frames.push(cb);
  },
  useThree: () => ({}),
}));
vi.mock('@react-three/drei', () => ({ Text: () => null }));

// Default primitives need real three objects behind refs (covered in components.test.tsx); stub them here.
vi.mock('../components.js', () => ({
  InstancedNodes: () => <i data-testid="default-nodes" />,
  EdgeLines: () => <i data-testid="default-edges" />,
  NodeLabels: () => <i data-testid="default-labels" />,
  CameraRig: () => null,
}));

import { createR3FGraphPlugin } from '../plugin.js';
import { graphSampleData } from '../../testing/index.js';
import { lightTheme } from '../../theme/light.js';
import type { InstancedNodesProps, EdgeLinesProps, NodeLabelsProps, CameraRigProps } from '../components.js';

const seen = { nodes: [] as InstancedNodesProps[], edges: [] as EdgeLinesProps[], labels: [] as NodeLabelsProps[], rig: [] as CameraRigProps[] };
const Nodes = (p: InstancedNodesProps) => {
  seen.nodes.push(p);
  return <button data-testid="nodes" onClick={() => p.onNodeClick?.({ id: 'n1', label: 'N1' })} />;
};
const Edges = (p: EdgeLinesProps) => {
  seen.edges.push(p);
  return null;
};
const Labels = (p: NodeLabelsProps) => {
  seen.labels.push(p);
  return null;
};
const Rig = (p: CameraRigProps) => {
  seen.rig.push(p);
  return null;
};

const mount = (opts: Parameters<typeof createR3FGraphPlugin>[0] = {}) => {
  const plugin = createR3FGraphPlugin(opts);
  const data = plugin.dataAdapter(graphSampleData);
  const theme = plugin.themeAdapter(lightTheme);
  const { Renderer } = plugin;
  return { data, theme, ...render(<Renderer data={data} theme={theme} width={320} height={200} config={{}} />) };
};

beforeEach(() => {
  h.frames.length = 0;
  seen.nodes.length = seen.edges.length = seen.labels.length = seen.rig.length = 0;
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('R3F plugin Renderer', () => {
  it('labels the container with node and link counts and sizes it', () => {
    const { data } = mount({ label: 'My graph' });
    const el = screen.getByRole('img');
    expect(el).toHaveAttribute('aria-label', `My graph: ${data.nodes.length} nodes, ${data.links.length} links`);
    expect(el).toHaveStyle({ width: '320px', height: '200px' });
  });

  it('renders the default scene without throwing', () => {
    mount({ id: 'custom' });
    expect(screen.getByTestId('canvas')).toBeInTheDocument();
    for (const id of ['default-nodes', 'default-edges', 'default-labels']) expect(screen.getByTestId(id)).toBeInTheDocument();
  });

  it('wires custom primitives with shared graph, positions and theme; labels toggle off', () => {
    const { data, theme } = mount({ nodes: Nodes, edges: Edges, labels: Labels, rig: Rig, showLabels: false });
    expect(seen.labels).toHaveLength(0);
    expect(seen.edges[0]!.graph).toBe(data);
    expect(seen.edges[0]!.theme).toBe(theme);
    expect(seen.nodes[0]!.positions).toBe(seen.edges[0]!.positions);
    expect(seen.nodes[0]!.positions.size).toBe(data.nodes.length);
    expect(seen.rig[0]!.focusId).toBeNull();
  });

  it('shows labels by default, and the driver ticks the layout every frame', () => {
    mount({ nodes: Nodes, edges: Edges, labels: Labels, rig: Rig });
    expect(seen.labels).toHaveLength(1);
    const pos = seen.nodes[0]!.positions;
    const before = JSON.stringify([...pos]);
    act(() => h.frames.forEach((f) => f()));
    expect(JSON.stringify([...pos])).not.toBe(before);
  });

  it('node click selects, fires callbacks and focuses the camera', () => {
    const onNodeClick = vi.fn();
    const onSelectionChange = vi.fn();
    mount({ nodes: Nodes, edges: Edges, labels: Labels, rig: Rig, onNodeClick, onSelectionChange });
    act(() => screen.getByTestId('nodes').click());
    expect(onNodeClick).toHaveBeenCalledWith({ id: 'n1', label: 'N1' });
    expect(onSelectionChange).toHaveBeenCalledWith(['n1']);
    expect(seen.nodes.at(-1)!.selectedId).toBe('n1');
    expect(seen.rig.at(-1)!.focusId).toBe('n1');
  });

  it('click works without callbacks; explicit focusId wins over selection', () => {
    mount({ nodes: Nodes, edges: Edges, labels: Labels, rig: Rig, focusId: 'fixed' });
    act(() => screen.getByTestId('nodes').click());
    expect(seen.nodes.at(-1)!.selectedId).toBe('n1');
    expect(seen.rig.at(-1)!.focusId).toBe('fixed');
  });
});
