import React from 'react';
import { useTheme } from '../theme/provider.js';
import { categoricalColor } from '../theme/color-scale.js';
import type { VisualizationProps } from './types.js';

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function slicePath(cx: number, cy: number, r: number, innerR: number, startAngle: number, endAngle: number): string {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const si = polarToCartesian(cx, cy, innerR, startAngle);
  const ei = polarToCartesian(cx, cy, innerR, endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${si.x} ${si.y}`,
    'Z',
  ].join(' ');
}

export interface PieChartProps extends VisualizationProps {
  /** If true, renders as a donut chart. Default: false. */
  donut?: boolean;
}

export function PieChart({
  data,
  width,
  height,
  xField,
  yField,
  ariaLabel,
  donut = false,
}: PieChartProps): React.ReactElement {
  const theme = useTheme();

  const valueField = yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const labelField = xField ?? data.fields.find((f) => f.type === 'string')?.key ?? '';

  const slices = data.rows.map((r) => ({
    label: String(r[labelField] ?? ''),
    value: Math.max(0, Number(r[valueField] ?? 0)),
  })).filter((s) => s.value > 0);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) * 0.82;
  const innerR = donut ? r * 0.5 : 0;

  let cursor = -Math.PI / 2;
  const paths = slices.map((slice, i) => {
    const angle = (slice.value / total) * (2 * Math.PI);
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    const mid = (start + end) / 2;
    const labelR = r * 0.7;
    const lp = polarToCartesian(cx, cy, labelR, mid);
    const pct = ((slice.value / total) * 100).toFixed(1);
    return { slice, i, start, end, lp, pct, path: slicePath(cx, cy, r, innerR, start, end) };
  });

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? `Pie chart of ${valueField}`} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      {paths.map(({ slice, i, lp, pct, path }) => (
        <g key={i}>
          <path d={path} fill={categoricalColor(theme, i)} stroke={theme.surface.background} strokeWidth={2}>
            <title>{slice.label}: {slice.value.toLocaleString()} ({pct}%)</title>
          </path>
          {slice.value / total > 0.04 && (
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={theme.typography.fontSizeSm} fill={theme.text.inverse} fontWeight={theme.typography.fontWeightBold}>
              {pct}%
            </text>
          )}
        </g>
      ))}
      {donut && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize={theme.typography.fontSizeLg} fill={theme.text.primary} fontWeight={theme.typography.fontWeightBold}>
          {total.toLocaleString()}
        </text>
      )}
    </svg>
  );
}
