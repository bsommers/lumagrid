import React, { useEffect, useRef, useState } from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

interface Node {
  id: string;
  label: string;
  group: string | undefined;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number | undefined;
}

function runSimulation(nodes: Node[], edges: Edge[], iterations = 60): Node[] {
  const result = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(result.map((n) => [n.id, n]));
  const k = Math.sqrt(result.length);

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    // Repulsion
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]!;
        const b = result[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (k * k) / dist * alpha * 0.5;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }
    }
    // Attraction along edges
    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist / k) * alpha * 0.5;
      s.vx += (dx / dist) * force;
      s.vy += (dy / dist) * force;
      t.vx -= (dx / dist) * force;
      t.vy -= (dy / dist) * force;
    }
    // Apply velocity
    for (const n of result) {
      n.x += n.vx * 0.85;
      n.y += n.vy * 0.85;
      n.vx *= 0.8;
      n.vy *= 0.8;
    }
  }
  return result;
}

export function ForceGraph({ data, width, height, xField, yField, ariaLabel, theme }: NativeChartProps): React.ReactElement {
  // Expect data.rows to have: id, label, [group], and optionally source/target for edges
  const nodeRows = data.rows.filter((r) => r['source'] === undefined || r['source'] === null);
  const edgeRows = data.rows.filter((r) => r['source'] !== undefined && r['source'] !== null);

  const idField = xField ?? 'id';
  const labelField = yField ?? 'label';

  const initialNodes: Node[] = nodeRows.map((r) => ({
    id: String(r[idField] ?? r['id'] ?? ''),
    label: String(r[labelField] ?? r['label'] ?? ''),
    group: r['group'] !== undefined ? String(r['group']) : undefined,
    // Math.random() is intentional here: used only for visual initial placement,
    // not for security-sensitive ID generation. If you need unpredictable IDs,
    // use crypto.randomUUID() or crypto.getRandomValues() instead.
    x: width / 2 + (Math.random() - 0.5) * width * 0.6,
    y: height / 2 + (Math.random() - 0.5) * height * 0.6,
    vx: 0,
    vy: 0,
  }));

  const edges: Edge[] = edgeRows.map((r) => ({
    source: String(r['source'] ?? ''),
    target: String(r['target'] ?? ''),
    weight: typeof r['weight'] === 'number' ? r['weight'] : undefined,
  }));

  const [nodes, setNodes] = useState<Node[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setNodes(runSimulation(initialNodes, edges));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const groups = [...new Set(nodes.map((n) => n.group ?? 'default'))];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const pad = 24;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, width);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, height);
  const scaleX = (x: number) => pad + ((x - minX) / (maxX - minX)) * (width - pad * 2);
  const scaleY = (y: number) => pad + ((y - minY) / (maxY - minY)) * (height - pad * 2);

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? 'Force-directed graph'} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      {edges.map((edge, i) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) return null;
        return (
          <line key={i}
            x1={scaleX(s.x)} y1={scaleY(s.y)}
            x2={scaleX(t.x)} y2={scaleY(t.y)}
            stroke={theme.surface.border} strokeWidth={edge.weight ? Math.max(1, edge.weight) : 1.5}
            opacity={0.6} />
        );
      })}
      {nodes.map((node, i) => {
        const gIdx = groups.indexOf(node.group ?? 'default');
        return (
          <g key={node.id} transform={`translate(${scaleX(node.x)},${scaleY(node.y)})`}>
            <circle r={10} fill={categoricalColor(theme, gIdx)} stroke={theme.surface.background} strokeWidth={2} opacity={0.9}>
              <title>{node.label}</title>
            </circle>
            <text y={18} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
              fill={theme.text.secondary}>{node.label.slice(0, 12)}</text>
          </g>
        );
      })}
    </svg>
  );
}
