import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

/**
 * Props for {@link ColumnChart}.
 *
 * @public
 */
export interface ColumnChartProps extends NativeChartProps {
  /** How multiple series (from `colorField`) are drawn. Default: `'grouped'`. */
  mode?: 'grouped' | 'stacked';
  /** Render a series legend. Default: true. */
  showLegend?: boolean;
  /** Render the value on each bar (when it fits). Default: false. */
  showValues?: boolean;
}

const MARGIN = { top: 16, right: 16, bottom: 36, left: 48 };
const LEGEND_H = 22;

function luminance(color: string): number {
  const c = color.trim();
  let r: number, g: number, b: number;
  const hex = /^#?([0-9a-f]{6})$/i.exec(c);
  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)/i.exec(c);
  if (hex) {
    const n = parseInt(hex[1]!, 16);
    [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  } else if (rgb) {
    [r, g, b] = [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
  } else return 0.5;
  const lin = (v: number) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastText(fill: string, a: string, b: string): string {
  const lf = luminance(fill);
  const ratio = (t: string) => {
    const [hi, lo] = [lf, luminance(t)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
  };
  return ratio(a) >= ratio(b) ? a : b;
}

/** "Nice" tick values spanning [min, max], always including 0. */
function niceTicks(min: number, max: number, count = 5): number[] {
  const lo = Math.min(min, 0);
  const hi = Math.max(max, 0) === lo ? lo + 1 : Math.max(max, 0);
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const start = Math.floor(lo / step) * step;
  const end = Math.ceil(hi / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v / step) * step);
  return ticks;
}

interface Bar { category: string; series: string; value: number; y0: number; y1: number; si: number; }

/**
 * Column chart: vertical bars with categories (`labelField`) on x and values (`valueField`) on y.
 * With `colorField`, series are drawn side by side (`mode="grouped"`, default) or stacked.
 *
 * @public
 */
export function ColumnChart({
  data,
  width,
  height,
  valueField,
  labelField,
  colorField,
  xField,
  yField,
  ariaLabel,
  theme,
  mode = 'grouped',
  showLegend = true,
  showValues = false,
}: ColumnChartProps): React.ReactElement {
  const valueKey = valueField ?? yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const labelKey = labelField ?? xField ?? data.fields.find((f) => f.type === 'string')?.key ?? '';

  const categories: string[] = [];
  const series: string[] = [];
  const cells = new Map<string, number>();
  for (const r of data.rows) {
    const value = Number(r[valueKey] ?? 0);
    if (!Number.isFinite(value)) continue;
    const cat = String(r[labelKey] ?? '');
    const ser = colorField ? String(r[colorField] ?? '') : '';
    if (!categories.includes(cat)) categories.push(cat);
    if (!series.includes(ser)) series.push(ser);
    cells.set(`${cat}\u0000${ser}`, (cells.get(`${cat}\u0000${ser}`) ?? 0) + value);
  }

  const stacked = mode === 'stacked';
  const bars: Bar[] = [];
  categories.forEach((cat) => {
    let pos = 0;
    let neg = 0;
    series.forEach((ser, si) => {
      const value = cells.get(`${cat}\u0000${ser}`);
      if (value === undefined) return;
      let y0 = 0;
      let y1 = value;
      if (stacked) {
        if (value >= 0) { y0 = pos; pos += value; y1 = pos; } else { y0 = neg; neg += value; y1 = neg; }
      }
      bars.push({ category: cat, series: ser, value, y0, y1, si });
    });
  });

  const showLeg = showLegend && colorField !== undefined && series.length > 0;
  const top = MARGIN.top + (showLeg ? LEGEND_H : 0);
  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = Math.max(0, height - top - MARGIN.bottom);

  const ticks = niceTicks(Math.min(0, ...bars.map((b) => Math.min(b.y0, b.y1))), Math.max(0, ...bars.map((b) => Math.max(b.y0, b.y1))));
  const yMin = ticks[0]!;
  const yMax = ticks[ticks.length - 1]!;
  const yPos = (v: number) => innerH - ((v - yMin) / (yMax - yMin)) * innerH;

  const band = categories.length > 0 ? innerW / categories.length : 0;
  const groupW = band * 0.8;
  const slot = stacked ? groupW : groupW / Math.max(series.length, 1);
  const fmt = (v: number) => v.toLocaleString();

  return (
    <svg
      width={width}
      height={height}
      aria-label={ariaLabel ?? `Column chart of ${valueKey}`}
      role="img"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      {showLeg && (
        <g data-testid="column-chart-legend" fontSize={theme.typography.fontSizeSm} fill={theme.text.primary}>
          {series.map((s, i) => (
            <g key={s} transform={`translate(${MARGIN.left + i * 110},${MARGIN.top - 4})`}>
              <rect width={10} height={10} rx={2} fill={categoricalColor(theme, i)} />
              <text x={14} y={9}>{s.length > 12 ? s.slice(0, 11) + '…' : s}</text>
            </g>
          ))}
        </g>
      )}
      <g transform={`translate(${MARGIN.left},${top})`}>
        {ticks.map((t) => (
          <g key={t} data-testid="column-chart-tick">
            <line x1={0} x2={innerW} y1={yPos(t)} y2={yPos(t)} stroke={theme.surface.border} strokeWidth={t === 0 ? 1.5 : 1} />
            <text x={-8} y={yPos(t)} textAnchor="end" dominantBaseline="middle"
              fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>{fmt(t)}</text>
          </g>
        ))}
        {categories.map((cat, ci) => (
          <text key={cat} x={ci * band + band / 2} y={innerH + 18} textAnchor="middle"
            fontSize={theme.typography.fontSizeSm} fill={theme.text.primary}>
            {cat.length > 12 ? cat.slice(0, 11) + '…' : cat}
          </text>
        ))}
        {bars.map((b) => {
          const ci = categories.indexOf(b.category);
          const x = ci * band + (band - groupW) / 2 + (stacked ? 0 : b.si * slot);
          const yA = yPos(b.y0);
          const yB = yPos(b.y1);
          const h = Math.abs(yA - yB);
          const y = Math.min(yA, yB);
          const fill = categoricalColor(theme, b.si);
          const label = b.series ? `${b.category}, ${b.series}: ${fmt(b.value)}` : `${b.category}: ${fmt(b.value)}`;
          return (
            <g key={`${b.category}-${b.series}`}>
              <rect x={x} y={y} width={Math.max(0, slot - (stacked ? 0 : 2))} height={h} fill={fill} rx={2}
                role="img" aria-label={label}>
                <title>{label}</title>
              </rect>
              {showValues && h >= 14 && slot >= 24 && (
                <text x={x + (slot - (stacked ? 0 : 2)) / 2} y={y + h / 2} textAnchor="middle"
                  dominantBaseline="middle" pointerEvents="none" fontSize={theme.typography.fontSizeSm}
                  fill={contrastText(fill, theme.text.primary, theme.text.inverse)}>
                  {fmt(b.value)}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </svg>
  );
}
