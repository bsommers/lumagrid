import React from 'react';
import { useTheme } from '../theme/provider.js';
import { categoricalColor } from '../theme/color-scale.js';
import type { VisualizationProps } from './types.js';

const MARGIN = { top: 24, right: 24, bottom: 40, left: 56 };

export function LineChart({
  data,
  width,
  height,
  xField,
  yField,
  colorField,
  ariaLabel,
}: VisualizationProps): React.ReactElement {
  const theme = useTheme();

  const numericField = yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const categoryField = xField ?? data.fields.find((f) => f.type === 'string' || f.type === 'date')?.key ?? '';

  // Group rows by colorField if provided
  type Series = { key: string; points: Array<{ x: number; y: number; label: string }> };
  const seriesMap = new Map<string, Series>();

  const allXLabels = [...new Set(data.rows.map((r) => String(r[categoryField] ?? '')))];

  if (colorField) {
    for (const row of data.rows) {
      const seriesKey = String(row[colorField] ?? 'default');
      if (!seriesMap.has(seriesKey)) seriesMap.set(seriesKey, { key: seriesKey, points: [] });
      seriesMap.get(seriesKey)!.points.push({
        x: allXLabels.indexOf(String(row[categoryField] ?? '')),
        y: Number(row[numericField] ?? 0),
        label: String(row[categoryField] ?? ''),
      });
    }
  } else {
    const series: Series = { key: 'default', points: data.rows.map((r, i) => ({
      x: i, y: Number(r[numericField] ?? 0), label: String(r[categoryField] ?? i),
    })) };
    seriesMap.set('default', series);
  }

  const allSeries = [...seriesMap.values()];
  const allYValues = allSeries.flatMap((s) => s.points.map((p) => p.y));
  const minY = Math.min(...allYValues, 0);
  const maxY = Math.max(...allYValues, 1);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const xCount = Math.max(allXLabels.length - 1, 1);

  const scaleX = (i: number) => (i / xCount) * innerW;
  const scaleY = (v: number) => innerH - ((v - minY) / (maxY - minY)) * innerH;

  const toPath = (points: Series['points']) =>
    points
      .sort((a, b) => a.x - b.x)
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x).toFixed(1)},${scaleY(p.y).toFixed(1)}`)
      .join(' ');

  const tickCount = Math.min(5, allXLabels.length);
  const xTicks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((i / (tickCount - 1)) * (allXLabels.length - 1)),
  );
  const yTicks = 5;

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? `Line chart of ${numericField}`} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Y grid + ticks */}
        {Array.from({ length: yTicks }, (_, i) => {
          const v = minY + (i / (yTicks - 1)) * (maxY - minY);
          const y = scaleY(v);
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke={theme.surface.border} strokeDasharray="3,3" />
              <text x={-8} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>
                {v.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </text>
            </g>
          );
        })}
        {/* X ticks */}
        {xTicks.map((idx) => (
          <text key={idx} x={scaleX(idx)} y={innerH + 16} textAnchor="middle"
            fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>
            {(allXLabels[idx] ?? '').slice(0, 8)}
          </text>
        ))}
        {/* Lines */}
        {allSeries.map((series, si) => (
          <path key={series.key} d={toPath(series.points)}
            fill="none" stroke={categoricalColor(theme, si)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Axes */}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={theme.surface.border} />
        <line x1={0} y1={0} x2={0} y2={innerH} stroke={theme.surface.border} />
      </g>
    </svg>
  );
}
