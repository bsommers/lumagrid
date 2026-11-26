import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Graph } from '../transforms/to-graph.js';
import type { GraphTheme } from '../plugins/graph-theme.js';
import type { Vec3 } from './layout.js';

/**
 * Props of {@link InstancedNodes}.
 *
 * @beta
 * @experimental
 */
export interface InstancedNodesProps {
  graph: Graph;
  /** Live positions from `useForceLayout3D`; read every frame. */
  positions: Map<string, Vec3>;
  theme: GraphTheme;
  /** Base sphere radius. Default 1. */
  radius?: number;
  /** Scale nodes by degree: radius * (1 + degree * degreeScale). Default 0.15. */
  degreeScale?: number;
  /** Highlighted node id. */
  selectedId?: string | null;
  onNodeClick?: (node: { id: string; label: string }) => void;
}

/**
 * All nodes as one `InstancedMesh` (one draw call), colored by group from the theme.
 *
 * @beta
 * @experimental
 */
export function InstancedNodes({ graph, positions, theme, radius = 1, degreeScale = 0.15, selectedId, onNodeClick }: InstancedNodesProps): React.ReactElement {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const groups = useMemo(() => {
    const m = new Map<string, number>();
    for (const n of graph.nodes) if (n.group !== undefined && !m.has(n.group)) m.set(n.group, m.size);
    return m;
  }, [graph]);

  useEffect(() => {
    const m = mesh.current;
    if (!m) return;
    graph.nodes.forEach((n, i) => {
      const palette = theme.nodeColors;
      const g = n.group === undefined ? undefined : groups.get(n.group);
      const base = g === undefined || palette.length === 0 ? theme.nodeDefault : palette[g % palette.length] ?? theme.nodeDefault;
      m.setColorAt(i, color.set(n.id === selectedId ? theme.highlight : base));
    });
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [graph, groups, theme, selectedId, color]);

  useFrame(() => {
    const m = mesh.current;
    if (!m) return;
    graph.nodes.forEach((n, i) => {
      const p = positions.get(n.id) ?? [0, 0, 0];
      dummy.position.set(p[0], p[1], p[2]);
      dummy.scale.setScalar(radius * (1 + n.degree * degreeScale));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh
      key={graph.nodes.length}
      ref={mesh}
      args={[undefined, undefined, graph.nodes.length]}
      frustumCulled={false}
      onClick={(e) => {
        const node = e.instanceId === undefined ? undefined : graph.nodes[e.instanceId];
        if (node && onNodeClick) {
          e.stopPropagation();
          onNodeClick({ id: node.id, label: node.label });
        }
      }}
    >
      <sphereGeometry args={[1, 16, 12]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}

/**
 * Props of {@link EdgeLines}.
 *
 * @beta
 * @experimental
 */
export interface EdgeLinesProps {
  graph: Graph;
  positions: Map<string, Vec3>;
  theme: GraphTheme;
  /** Line opacity, 0 to 1. Default 0.6. */
  opacity?: number;
}

/**
 * All edges as a single `LineSegments` draw call.
 *
 * @beta
 * @experimental
 */
export function EdgeLines({ graph, positions, theme, opacity = 0.6 }: EdgeLinesProps): React.ReactElement {
  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(graph.links.length * 6), 3));
    return g;
  }, [graph]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(() => {
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const a = attr.array as Float32Array;
    graph.links.forEach((l, i) => {
      const s = positions.get(l.source) ?? [0, 0, 0];
      const t = positions.get(l.target) ?? [0, 0, 0];
      a.set(s, i * 6);
      a.set(t, i * 6 + 3);
    });
    attr.needsUpdate = true;
  });

  return (
    <lineSegments geometry={geometry} frustumCulled={false}>
      <lineBasicMaterial color={theme.edge} transparent opacity={opacity} />
    </lineSegments>
  );
}

/**
 * Props of {@link NodeLabels}.
 *
 * @beta
 * @experimental
 */
export interface NodeLabelsProps {
  graph: Graph;
  positions: Map<string, Vec3>;
  theme: GraphTheme;
  /** Label only the highest-degree nodes. Default 100. */
  maxLabels?: number;
  /** World-space text size. Default 1.5. */
  size?: number;
  /** Vertical offset above the node. Default 2. */
  offset?: number;
  /**
   * URL of a ttf, otf or woff font file for the labels (troika does not support woff2).
   * Without it drei fetches a default font from a CDN at runtime, which fails offline or under a
   * strict CSP and leaks a request to a third party. Self-host a font and pass its URL.
   */
  font?: string;
}

function Label({ id, text, positions, theme, size, offset, font }: { id: string; text: string; positions: Map<string, Vec3>; theme: GraphTheme; size: number; offset: number; font?: string | undefined }): React.ReactElement {
  const group = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    const g = group.current;
    const p = positions.get(id);
    if (!g || !p) return;
    g.position.set(p[0], p[1] + offset, p[2]);
    g.quaternion.copy(camera.quaternion);
  });
  return (
    <group ref={group}>
      <Text {...(font ? { font } : {})} fontSize={size} color={theme.label} anchorX="center" anchorY="bottom">
        {text}
      </Text>
    </group>
  );
}

/**
 * Camera-facing text labels (drei `Text`) for the highest-degree nodes.
 *
 * @beta
 * @experimental
 */
export function NodeLabels({ graph, positions, theme, maxLabels = 100, size = 1.5, offset = 2, font }: NodeLabelsProps): React.ReactElement {
  const shown = useMemo(
    () => [...graph.nodes].sort((a, b) => b.degree - a.degree || (a.id < b.id ? -1 : 1)).slice(0, Math.max(0, maxLabels)),
    [graph, maxLabels],
  );
  return (
    <>
      {shown.map((n) => (
        <Label key={n.id} id={n.id} text={n.label} positions={positions} theme={theme} size={size} offset={offset} font={font} />
      ))}
    </>
  );
}

/**
 * Props of {@link CameraRig}.
 *
 * @beta
 * @experimental
 */
export interface CameraRigProps {
  positions: Map<string, Vec3>;
  /** Node to fly to; `null` or `undefined` leaves the camera alone. */
  focusId?: string | null;
  /** Distance from the node to stop at. Default 40. */
  distance?: number;
  /** Approach speed (higher is faster). Default 3. */
  speed?: number;
}

/**
 * Flies the camera to a node (smooth exponential approach, looking at it). Props only, no context
 * required beyond the R3F `Canvas`.
 *
 * @beta
 * @experimental
 */
export function CameraRig({ positions, focusId, distance = 40, speed = 3 }: CameraRigProps): null {
  const camera = useThree((s) => s.camera);
  const target = useMemo(() => new THREE.Vector3(), []);
  const dest = useMemo(() => new THREE.Vector3(), []);
  useFrame((_, delta) => {
    const p = focusId ? positions.get(focusId) : undefined;
    if (!p) return;
    target.set(p[0], p[1], p[2]);
    dest.copy(target).add(new THREE.Vector3(0, 0, distance));
    camera.position.lerp(dest, 1 - Math.exp(-speed * delta));
    camera.lookAt(target);
  });
  return null;
}
