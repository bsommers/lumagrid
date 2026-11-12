import React, { useState } from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import { legendHeight, niceTicks } from './ticks.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

const MARGIN = { top: 24, right: 24, bottom: 40, left: 56 };

/**
 * Props for {@link ScatterChart}.
 *
 * @public
 */
export interface ScatterChartProps extends NativeChartProps {
  /** Numeric field plotted on the x axis. Inferred from the first number field if omitted. */
  xValueField?: string;
  /** Optional numeric field mapped to point (bubble) radius. */
  sizeField?: string;
  /** Render a color legend when `colorField` yields series. Default: true. */
  showLegend?: boolean;
  /** Called with the source row when a point is clicked or activated with Enter/Space. */
  onSelect?: (row: Record<string, unknown>) => void;
}

/**
 * Scatter (or bubble) chart: x from `xValueField`, y from `valueField`, one series per distinct
 * `colorField` value and optional bubble radius from `sizeField`.
 *
 * Every point is keyboard focusable (visible focus ring) with an aria-label of
 * "series, x, y"; a visually hidden data table gives a full text alternative.
 *
 * @public
 */
export function ScatterChart({
  data,
  width,
  height,
  xValueField,
  valueField,
  yField,
  xField,
  colorField,
  sizeField,
  ariaLabel,
  theme,
  showLegend = true,
  onSelect,
}: ScatterChartProps): React.ReactElement {
  const [focused, setFocused] = useState<number | null>(null);
  const numeric = data.fields.filter((f) => f.type === 'number').map((f) => f.key);
  const xKey = xValueField ?? xField ?? numeric[0] ?? '';
  const yKey = valueField ?? yField ?? numeric.find((k) => k !== xKey) ?? '';

  const seriesKeys: string[] = [];
  const points = data.rows
    .map((row, i) => {
      const series = colorField ? String(row[colorField] ?? 'default') : 'default';
      const size = sizeField ? Number(row[sizeField]) : NaN;
      return { row, i, series, x: Number(row[xKey]), y: Number(row[yKey]), size };
    })
    .filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y));
  for (const p of points) if (!seriesKeys.includes(p.series)) seriesKeys.push(p.series);

  const innerW = width - MARGIN.left - MARGIN.right;
  const hasLegend = showLegend && !!colorField && seriesKeys.length > 0;
  // The legend sits below the plot; shrink the plot so both fit the given height.
  const legendH = hasLegend ? legendHeight(seriesKeys, width - MARGIN.left - 8) : 0;
  const svgH = Math.max(height - legendH, 0);
  const innerH = svgH - MARGIN.top - MARGIN.bottom;
  const xTicks = niceTicks(Math.min(...points.map((p) => p.x), 0), Math.max(...points.map((p) => p.x), 1));
  const yTicks = niceTicks(Math.min(...points.map((p) => p.y), 0), Math.max(...points.map((p) => p.y), 1));
  const xLo = xTicks[0]!, xHi = xTicks[xTicks.length - 1]!;
  const yLo = yTicks[0]!, yHi = yTicks[yTicks.length - 1]!;
  const scaleX = (v: number) => ((v - xLo) / (xHi - xLo)) * innerW;
  const scaleY = (v: number) => innerH - ((v - yLo) / (yHi - yLo)) * innerH;

  const sizes = points.map((p) => p.size).filter(Number.isFinite);
  const sMin = Math.min(...sizes), sMax = Math.max(...sizes);
  const radius = (s: number) =>
    !Number.isFinite(s) ? 5 : sMax === sMin ? 8 : 4 + ((s - sMin) / (sMax - sMin)) * 12;

  const fmt = (v: number) => v.toLocaleString(undefined, { maximumFractionDigits: 2 });
  const title = ariaLabel ?? `Scatter chart of ${yKey} by ${xKey}`;
  const focusColor = theme.text.primary;

  return (
    <>
      <svg width={width} height={svgH} aria-label={title} role="group"
        style={{ fontFamily: theme.typography.fontFamily }}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {yTicks.map((v) => (
            <g key={`y${v}`}>
              <line x1={0} y1={scaleY(v)} x2={innerW} y2={scaleY(v)} stroke={theme.surface.border} strokeDasharray="3,3" />
              <text x={-8} y={scaleY(v)} textAnchor="end" dominantBaseline="middle"
                fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>{fmt(v)}</text>
            </g>
          ))}
          {xTicks.map((v) => (
            <g key={`x${v}`}>
              <line x1={scaleX(v)} y1={0} x2={scaleX(v)} y2={innerH} stroke={theme.surface.border} strokeDasharray="3,3" />
              <text x={scaleX(v)} y={innerH + 16} textAnchor="middle"
                fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>{fmt(v)}</text>
            </g>
          ))}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={theme.surface.border} />
          <line x1={0} y1={0} x2={0} y2={innerH} stroke={theme.surface.border} />
          {points.map((p) => {
            const r = radius(p.size);
            const cx = scaleX(p.x), cy = scaleY(p.y);
            const label = `${p.series}, ${fmt(p.x)}, ${fmt(p.y)}`;
            return (
              <g key={p.i} tabIndex={0} role="img" aria-label={label} data-scatter-point=""
                style={{ outline: 'none', cursor: onSelect ? 'pointer' : 'default' }}
                onFocus={() => setFocused(p.i)}
                onBlur={() => setFocused((f) => (f === p.i ? null : f))}
                onClick={() => onSelect?.(p.row)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelect?.(p.row);
                  }
                }}>
                <circle cx={cx} cy={cy} r={r} fill={categoricalColor(theme, seriesKeys.indexOf(p.series))}
                  fillOpacity={0.75} stroke={theme.surface.background} strokeWidth={1}>
                  <title>{label}</title>
                </circle>
                {focused === p.i && (
                  <circle data-focus-ring="" cx={cx} cy={cy} r={r + 4} fill="none" stroke={focusColor} strokeWidth={2} />
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {hasLegend && (
        <ul aria-label="Legend" style={{
          display: 'flex', flexWrap: 'wrap', gap: theme.spacing.md, listStyle: 'none', margin: 0,
        height: legendH, boxSizing: 'border-box', overflow: 'hidden', alignContent: 'center',
        rowGap: 0, lineHeight: '22px',
          padding: `0 8px 0 ${MARGIN.left}px`, fontFamily: theme.typography.fontFamily,
          fontSize: theme.typography.fontSizeSm, color: theme.text.secondary,
        }}>
          {seriesKeys.map((key, si) => (
            <li key={key} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
              <span aria-hidden="true" data-legend-swatch="" style={{
                width: 12, height: 12, borderRadius: 2, display: 'inline-block', background: categoricalColor(theme, si),
              }} />
              <span>{key}</span>
            </li>
          ))}
        </ul>
      )}
      <table data-scatter-chart-data="" style={{
        position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1,
      }}>
        <caption>{title} data</caption>
        <thead><tr><th scope="col">Series</th><th scope="col">{xKey}</th><th scope="col">{yKey}</th>
          {sizeField && <th scope="col">{sizeField}</th>}</tr></thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.i}><td>{p.series}</td><td>{fmt(p.x)}</td><td>{fmt(p.y)}</td>
              {sizeField && <td>{Number.isFinite(p.size) ? fmt(p.size) : 'n/a'}</td>}</tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
