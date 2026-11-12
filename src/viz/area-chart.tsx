import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import { legendHeight, niceTicks } from './ticks.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

const MARGIN = { top: 24, right: 24, bottom: 40, left: 56 };

/**
 * Props for {@link AreaChart}.
 *
 * @public
 */
export interface AreaChartProps extends NativeChartProps {
  /** Stack series on top of each other instead of overlaying them. Default: false. */
  stacked?: boolean;
  /** Render a color legend when `colorField` yields series. Default: true. */
  showLegend?: boolean;
}

/**
 * Area chart: like LineChart with filled areas. y values from `valueField`, x categories from
 * `labelField`, one series per distinct `colorField` value. Set `stacked` to stack series.
 * Legacy `yField` (value) and `xField` (category) are accepted; role names win when both are given.
 *
 * A legend (opt out with `showLegend={false}`) and a visually hidden data table give every
 * series and data point a text alternative.
 *
 * @public
 */
export function AreaChart({
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
  stacked = false,
  showLegend = true,
}: AreaChartProps): React.ReactElement {
  const numericField = valueField ?? yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const categoryField = labelField ?? xField ?? data.fields.find((f) => f.type === 'string' || f.type === 'date')?.key ?? '';

  const allXLabels = [...new Set(data.rows.map((r) => String(r[categoryField] ?? '')))];
  const seriesKeys = colorField
    ? [...new Set(data.rows.map((r) => String(r[colorField] ?? 'default')))]
    : ['default'];

  // values[series][xIndex]; missing or non-finite cells count as 0
  const values = seriesKeys.map(() => allXLabels.map(() => 0));
  data.rows.forEach((r) => {
    const s = colorField ? seriesKeys.indexOf(String(r[colorField] ?? 'default')) : 0;
    const x = allXLabels.indexOf(String(r[categoryField] ?? ''));
    const v = Number(r[numericField] ?? 0);
    values[s]![x] = (values[s]![x] ?? 0) + (Number.isFinite(v) ? v : 0);
  });

  // Baseline/top per series and x
  const tops = values.map((row, si) =>
    row.map((v, xi) => (stacked ? values.slice(0, si + 1).reduce((sum, s) => sum + s[xi]!, 0) : v)));
  const bases = values.map((_, si) =>
    allXLabels.map((_x, xi) => (stacked && si > 0 ? tops[si - 1]![xi]! : 0)));

  const yTickValues = niceTicks(Math.min(...tops.flat(), 0), Math.max(...tops.flat(), 1));
  const minY = yTickValues[0]!;
  const maxY = yTickValues[yTickValues.length - 1]!;
  const hasLegend = showLegend && !!colorField && seriesKeys.length > 0;
  // The legend sits below the plot; shrink the plot so both fit the given height.
  const legendH = hasLegend ? legendHeight(seriesKeys, width - MARGIN.left - 8) : 0;
  const svgH = Math.max(height - legendH, 0);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = svgH - MARGIN.top - MARGIN.bottom;
  const xCount = Math.max(allXLabels.length - 1, 1);
  const scaleX = (i: number) => (i / xCount) * innerW;
  const scaleY = (v: number) => innerH - ((v - minY) / (maxY - minY)) * innerH;

  const areaPath = (si: number) => {
    if (allXLabels.length === 0) return '';
    const top = allXLabels.map((_, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(tops[si]![i]!).toFixed(1)}`);
    const back = allXLabels.map((_, k) => {
      const i = allXLabels.length - 1 - k;
      return `L${scaleX(i).toFixed(1)},${scaleY(bases[si]![i]!).toFixed(1)}`;
    });
    return `${top.join(' ')} ${back.join(' ')} Z`;
  };
  const linePath = (si: number) =>
    allXLabels.map((_, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i).toFixed(1)},${scaleY(tops[si]![i]!).toFixed(1)}`).join(' ');

  // Show every label when few (<= 6); else 5 evenly spaced.
  const tickCount = allXLabels.length <= 6 ? allXLabels.length : 5;
  const xTicks = tickCount <= 1
    ? (tickCount === 1 ? [0] : [])
    : Array.from({ length: tickCount }, (_, i) =>
        Math.round((i / (tickCount - 1)) * (allXLabels.length - 1)));

  const fmt = (v: number) => v.toLocaleString();
  const title = ariaLabel ?? `Area chart of ${numericField}`;

  return (
    <>
      <svg width={width} height={svgH} aria-label={title} role="img"
        style={{ fontFamily: theme.typography.fontFamily }}>
        <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
          {yTickValues.map((v, i) => {
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
          {xTicks.map((idx) => (
            <text key={idx} x={scaleX(idx)} y={innerH + 16} textAnchor="middle"
              fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>
              {(allXLabels[idx] ?? '').slice(0, 8)}
            </text>
          ))}
          {seriesKeys.map((key, si) => (
            <g key={key}>
              <path data-area="" d={areaPath(si)} fill={categoricalColor(theme, si)} fillOpacity={stacked ? 0.8 : 0.35} stroke="none" />
              <path data-area-line="" d={linePath(si)} fill="none" stroke={categoricalColor(theme, si)}
                strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            </g>
          ))}
          <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={theme.surface.border} />
          <line x1={0} y1={0} x2={0} y2={innerH} stroke={theme.surface.border} />
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
      <table data-area-chart-data="" style={{
        position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)',
        whiteSpace: 'nowrap', border: 0, padding: 0, margin: -1,
      }}>
        <caption>{title} data</caption>
        <thead><tr><th scope="col">Series</th><th scope="col">{categoryField}</th><th scope="col">{numericField}</th></tr></thead>
        <tbody>
          {seriesKeys.flatMap((key, si) => allXLabels.map((label, xi) => (
            <tr key={`${key}-${xi}`}><td>{key}</td><td>{label}</td><td>{fmt(values[si]![xi]!)}</td></tr>
          )))}
        </tbody>
      </table>
    </>
  );
}
