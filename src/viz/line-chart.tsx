import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

const MARGIN = { top: 24, right: 24, bottom: 40, left: 56 };

/**
 * Line chart: y values from `valueField`, x categories from `labelField`, one series
 * per distinct `colorField` value. Legacy `yField` (value) and `xField` (category) are
 * accepted; role names win when both are given.
 *
 * A color legend (shown when `colorField` yields series; opt out with `showLegend={false}`)
 * and a visually hidden data table give every series and data point a text alternative.
 *
 * @public
 */
export function LineChart({
  data,
  width,
  height,
  valueField,
  labelField,
  xField,
  yField,
  colorField,
  ariaLabel,
  theme,
  showLegend = true,
}: NativeChartProps & { showLegend?: boolean }): React.ReactElement {
  // Role name, then legacy alias, then inference from data.fields
  const numericField = valueField ?? yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const categoryField = labelField ?? xField ?? data.fields.find((f) => f.type === 'string' || f.type === 'date')?.key ?? '';

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
  const allYValues = allSeries.flatMap((s) => s.points.map((p) => p.y)).filter(Number.isFinite);
  const minY = Math.min(...allYValues, 0);
  const maxY = Math.max(...allYValues, 1);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const xCount = Math.max(allXLabels.length - 1, 1);

  const scaleX = (i: number) => (i / xCount) * innerW;
  const scaleY = (v: number) => innerH - ((v - minY) / (maxY - minY)) * innerH;

  const toPath = (points: Series['points']) =>
    points
      .filter((p) => Number.isFinite(p.y))
      .sort((a, b) => a.x - b.x)
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x).toFixed(1)},${scaleY(p.y).toFixed(1)}`)
      .join(' ');

  // Show every label when few (<= 6) so none is dropped by rounding; else 5 evenly spaced.
  const tickCount = allXLabels.length <= 6 ? allXLabels.length : 5;
  const xTicks = tickCount <= 1
    ? (tickCount === 1 ? [0] : [])
    : Array.from({ length: tickCount }, (_, i) =>
        Math.round((i / (tickCount - 1)) * (allXLabels.length - 1)),
      );
  const yTicks = 5;

  const fmt = (v: number) => v.toLocaleString();
  const hasLegend = showLegend && !!colorField && allSeries.length > 0;

  return (
    <>
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
    {hasLegend && (
      <ul aria-label="Legend" style={{
        display: 'flex', flexWrap: 'wrap', gap: theme.spacing.md, listStyle: 'none', margin: 0,
        padding: `${theme.spacing.xs} ${MARGIN.left}px`, fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSizeSm, color: theme.text.secondary,
      }}>
        {allSeries.map((series, si) => (
          <li key={series.key} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
            <span aria-hidden="true" data-legend-swatch="" style={{
              width: 12, height: 12, borderRadius: 2, display: 'inline-block', background: categoricalColor(theme, si),
            }} />
            <span>{series.key}</span>
          </li>
        ))}
      </ul>
    )}
    <table data-line-chart-data="" style={{
      position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)',
      whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1,
    }}>
      <caption>{ariaLabel ?? `Line chart of ${numericField}`} data</caption>
      <thead><tr><th scope="col">Series</th><th scope="col">{categoryField}</th><th scope="col">{numericField}</th></tr></thead>
      <tbody>
        {allSeries.flatMap((series) => series.points.map((p, i) => (
          <tr key={`${series.key}-${i}`}><td>{series.key}</td><td>{p.label}</td><td>{Number.isFinite(p.y) ? fmt(p.y) : 'n/a'}</td></tr>
        )))}
      </tbody>
    </table>
    </>
  );
}
