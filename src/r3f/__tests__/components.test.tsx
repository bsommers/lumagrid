import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import * as THREE from 'three';

const h = vi.hoisted(() => ({
  frames: [] as Array<(state: unknown, delta: number) => void>,
  camera: undefined as unknown,
  hostProps: {} as Record<string, Record<string, unknown>>,
  refTargets: {} as Record<string, unknown>,
  texts: [] as Array<{ text: string; props: Record<string, unknown> }>,
}));

vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children?: React.ReactNode }) => children,
  useFrame: (cb: (state: unknown, delta: number) => void) => {
    h.frames.push(cb);
  },
  useThree: (sel: (s: unknown) => unknown) => sel({ camera: h.camera }),
}));
vi.mock('@react-three/drei', () => ({
  Text: ({ children, ...props }: { children?: React.ReactNode }) => {
    h.texts.push({ text: String(children), props });
    return null;
  },
}));

const THREE_HOSTS = new Set(['instancedMesh', 'lineSegments', 'sphereGeometry', 'meshStandardMaterial', 'lineBasicMaterial', 'group']);
// Host elements like <instancedMesh> are not DOM: record their props, attach a real three object
// to the ref, and render a plain div in their place.
vi.mock('react/jsx-dev-runtime', async () => {
  const actual = await vi.importActual<typeof import('react/jsx-dev-runtime')>('react/jsx-dev-runtime');
  const jsxDEV = ((type: unknown, props: Record<string, unknown>, ...rest: unknown[]) => {
    if (typeof type === 'string' && THREE_HOSTS.has(type)) {
      h.hostProps[type] = props;
      const ref = props['ref'] as { current: unknown } | undefined;
      const target = h.refTargets[type];
      const next: Record<string, unknown> = { children: props['children'] };
      if (ref && target) next['ref'] = () => (ref.current = target);
      return (actual.jsxDEV as (...a: unknown[]) => unknown)('div', next, ...rest);
    }
    return (actual.jsxDEV as (...a: unknown[]) => unknown)(type, props, ...rest);
  }) as typeof actual.jsxDEV;
  return { ...actual, jsxDEV };
});

import { InstancedNodes, EdgeLines, NodeLabels, CameraRig } from '../components.js';
import type { Graph } from '../../transforms/to-graph.js';
import type { GraphTheme } from '../../plugins/graph-theme.js';
import type { Vec3 } from '../layout.js';

const theme: GraphTheme = {
  background: '#000000',
  nodeColors: ['#ff0000', '#00ff00'],
  nodeDefault: '#0000ff',
  edge: '#888888',
  edgeActive: '#999999',
  label: '#ffffff',
  labelBackground: '#111111',
  highlight: '#ffff00',
  fontFamily: 'sans-serif',
  fontSize: 12,
};
const graph: Graph = {
  nodes: [
    { id: 'a', label: 'A', group: 'g1', degree: 2 },
    { id: 'b', label: 'B', group: 'g2', degree: 1 },
    { id: 'c', label: 'C', degree: 1 },
    { id: 'd', label: 'D', group: 'g1', degree: 0 },
  ],
  links: [
    { source: 'a', target: 'b' },
    { source: 'a', target: 'c' },
  ],
  dropped: 0,
} as unknown as Graph;
const positions = new Map<string, Vec3>([
  ['a', [10, 20, 30]],
  ['b', [-1, -2, -3]],
  ['c', [5, 5, 5]],
]);

const run = (): void => h.frames.forEach((f) => f({ camera: h.camera }, 0.1));

beforeEach(() => {
  h.frames.length = 0;
  h.texts.length = 0;
  h.hostProps = {};
  h.refTargets = {};
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.restoreAllMocks());

describe('InstancedNodes', () => {
  function setup(extra: Partial<React.ComponentProps<typeof InstancedNodes>> = {}) {
    const mesh = new THREE.InstancedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial(), graph.nodes.length);
    h.refTargets['instancedMesh'] = mesh;
    const onNodeClick = vi.fn();
    const utils = render(<InstancedNodes graph={graph} positions={positions} theme={theme} onNodeClick={onNodeClick} {...extra} />);
    return { mesh, onNodeClick, ...utils };
  }
  const colorAt = (m: THREE.InstancedMesh, i: number): string => {
    const c = new THREE.Color();
    m.getColorAt(i, c);
    return `#${c.getHexString()}`;
  };

  it('colors instances by group, default for ungrouped, highlight for selection', () => {
    const { mesh, rerender } = setup();
    expect([0, 1, 2, 3].map((i) => colorAt(mesh, i))).toEqual(['#ff0000', '#00ff00', '#0000ff', '#ff0000']);
    rerender(<InstancedNodes graph={graph} positions={positions} theme={theme} selectedId="b" />);
    expect(colorAt(mesh, 1)).toBe('#ffff00');
  });

  it('falls back to nodeDefault with an empty palette', () => {
    const { mesh } = setup({ theme: { ...theme, nodeColors: [] } });
    expect(colorAt(mesh, 0)).toBe('#0000ff');
  });

  it('writes instance matrices from positions and degree each frame', () => {
    const { mesh } = setup({ radius: 2, degreeScale: 0.5 });
    mesh.instanceMatrix.needsUpdate = false;
    run();
    const pos = new THREE.Vector3();
    const scale = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const m = new THREE.Matrix4();
    mesh.getMatrixAt(0, m);
    m.decompose(pos, q, scale);
    expect(pos.toArray()).toEqual([10, 20, 30]);
    expect(scale.x).toBeCloseTo(2 * (1 + 2 * 0.5));
    mesh.getMatrixAt(3, m); // 'd' has no position: origin
    m.decompose(pos, q, scale);
    expect(pos.toArray()).toEqual([0, 0, 0]);
    expect(scale.x).toBeCloseTo(2);
    expect(mesh.instanceMatrix.version).toBeGreaterThan(0);
  });

  it('does nothing without a mounted mesh', () => {
    h.refTargets = {};
    render(<InstancedNodes graph={graph} positions={positions} theme={theme} />);
    expect(() => run()).not.toThrow();
  });

  it('click handler reports the clicked node and stops propagation', () => {
    const { onNodeClick } = setup();
    const onClick = h.hostProps['instancedMesh']!['onClick'] as (e: unknown) => void;
    const stopPropagation = vi.fn();
    onClick({ instanceId: 1, stopPropagation });
    expect(onNodeClick).toHaveBeenCalledWith({ id: 'b', label: 'B' });
    expect(stopPropagation).toHaveBeenCalled();
    onNodeClick.mockClear();
    onClick({ instanceId: undefined, stopPropagation });
    onClick({ instanceId: 99, stopPropagation });
    expect(onNodeClick).not.toHaveBeenCalled();
  });

  it('click without a handler is a no-op', () => {
    setup({ onNodeClick: undefined });
    const onClick = h.hostProps['instancedMesh']!['onClick'] as (e: unknown) => void;
    const stopPropagation = vi.fn();
    onClick({ instanceId: 0, stopPropagation });
    expect(stopPropagation).not.toHaveBeenCalled();
  });
});

describe('EdgeLines', () => {
  it('allocates 2*links*3 floats and fills endpoints from positions', () => {
    render(<EdgeLines graph={graph} positions={positions} theme={theme} />);
    const geometry = h.hostProps['lineSegments']!['geometry'] as THREE.BufferGeometry;
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    expect(attr.array.length).toBe(graph.links.length * 2 * 3);
    run();
    expect(Array.from(attr.array)).toEqual([10, 20, 30, -1, -2, -3, 10, 20, 30, 5, 5, 5]);
  });

  it('uses the origin for unknown endpoints and disposes geometry on unmount', () => {
    const g = { ...graph, links: [{ source: 'a', target: 'zzz' }] } as unknown as Graph;
    const { unmount } = render(<EdgeLines graph={g} positions={positions} theme={theme} opacity={0.3} />);
    const geometry = h.hostProps['lineSegments']!['geometry'] as THREE.BufferGeometry;
    const dispose = vi.spyOn(geometry, 'dispose');
    run();
    expect(Array.from((geometry.getAttribute('position') as THREE.BufferAttribute).array)).toEqual([10, 20, 30, 0, 0, 0]);
    expect(h.hostProps['lineBasicMaterial']).toMatchObject({ color: '#888888', opacity: 0.3 });
    unmount();
    expect(dispose).toHaveBeenCalled();
  });
});

describe('NodeLabels', () => {
  it('labels the highest-degree nodes, ties broken by id, capped by maxLabels', () => {
    render(<NodeLabels graph={graph} positions={positions} theme={theme} maxLabels={3} />);
    expect(h.texts.map((t) => t.text)).toEqual(['A', 'B', 'C']);
    expect(h.texts[0]!.props).toMatchObject({ fontSize: 1.5, color: '#ffffff' });
  });

  it('passes the font URL to drei Text, and leaves it undefined by default', () => {
    render(<NodeLabels graph={graph} positions={positions} theme={theme} maxLabels={1} font="/fonts/inter.woff" />);
    expect(h.texts[0]!.props['font']).toBe('/fonts/inter.woff');
    h.texts.length = 0;
    render(<NodeLabels graph={graph} positions={positions} theme={theme} maxLabels={1} />);
    expect(h.texts[0]!.props['font']).toBeUndefined();
  });

  it('renders nothing for maxLabels <= 0', () => {
    render(<NodeLabels graph={graph} positions={positions} theme={theme} maxLabels={-4} />);
    expect(h.texts).toHaveLength(0);
  });

  it('places each label above its node and faces the camera', () => {
    const group = new THREE.Group();
    h.refTargets['group'] = group;
    render(<NodeLabels graph={graph} positions={positions} theme={theme} maxLabels={1} offset={3} size={2} />);
    const camera = new THREE.PerspectiveCamera();
    camera.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), 1);
    h.frames.forEach((f) => f({ camera }, 0.1));
    expect(group.position.toArray()).toEqual([10, 23, 30]);
    expect(group.quaternion.equals(camera.quaternion)).toBe(true);
    expect(h.texts[0]!.props['fontSize']).toBe(2);
  });

  it('skips labels whose node has no position or no mounted group', () => {
    const group = new THREE.Group();
    h.refTargets['group'] = group;
    render(<NodeLabels graph={graph} positions={new Map()} theme={theme} maxLabels={1} />);
    h.frames.forEach((f) => f({ camera: new THREE.PerspectiveCamera() }, 0.1));
    expect(group.position.toArray()).toEqual([0, 0, 0]);
    h.refTargets = {};
    h.frames.length = 0;
    render(<NodeLabels graph={graph} positions={positions} theme={theme} maxLabels={1} />);
    expect(() => h.frames.forEach((f) => f({ camera: new THREE.PerspectiveCamera() }, 0.1))).not.toThrow();
  });
});

describe('CameraRig', () => {
  it('flies toward the focused node, looks at it, and converges', () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(0, 0, 200);
    h.camera = camera;
    render(<CameraRig positions={positions} focusId="a" distance={40} speed={3} />);
    const dest = new THREE.Vector3(10, 20, 70);
    const d0 = camera.position.distanceTo(dest);
    h.frames.forEach((f) => f({}, 0.1));
    const d1 = camera.position.distanceTo(dest);
    expect(d1).toBeLessThan(d0);
    expect(d1).toBeCloseTo(d0 * Math.exp(-0.3), 5);
    for (let i = 0; i < 200; i++) h.frames.forEach((f) => f({}, 0.1));
    expect(camera.position.distanceTo(dest)).toBeLessThan(1e-6);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    expect(dir.dot(new THREE.Vector3(10, 20, 30).sub(camera.position).normalize())).toBeCloseTo(1, 5);
  });

  it('leaves the camera alone without a focus or for an unknown node', () => {
    const camera = new THREE.PerspectiveCamera();
    camera.position.set(1, 2, 3);
    h.camera = camera;
    const { rerender } = render(<CameraRig positions={positions} focusId={null} />);
    run();
    rerender(<CameraRig positions={positions} focusId="nope" />);
    h.frames.forEach((f) => f({}, 0.1));
    expect(camera.position.toArray()).toEqual([1, 2, 3]);
  });
});
