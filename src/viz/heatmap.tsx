import React from 'react';
import { sequentialColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

/**
 * A heatmap cell as reported to `onSelect`.
 *
 * @public
 */
export interface HeatmapCell {
  row: string;
  column: string;
  value: number;
}

/**
 * Props for {@link Heatmap}.
 *
 * @public
 */
export interface HeatmapProps extends NativeChartProps {
  /** Field naming the column of each cell. Default: `labelField`, then the first string field. */
  columnField?: string;
  /** Field naming the row of each cell. Default: the second string field. */
  rowField?: string;
  /** Render the value inside each cell. Default: true. */
  showValues?: boolean;
  /** Render a min..max color legend. Default: true. */
  showLegend?: boolean;
  /** Called when a cell is clicked or activated with Enter/Space. */
  onSelect?: (cell: HeatmapCell) => void;
}

const MARGIN = { top: 28, right: 16, bottom: 36, left: 80 };

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

/**
 * Heatmap: a rows x columns matrix of cells colored on the theme's sequential scale.
 * Cells are keyboard focusable (arrow keys, Home/End) in an ARIA grid.
 *
 * @public
 */
export function Heatmap({
  data,
  width,
  height,
  valueField,
  labelField,
  columnField,
  rowField,
  xField,
  yField,
  ariaLabel,
  theme,
  showValues = true,
  showLegend = true,
  onSelect,
}: HeatmapProps): React.ReactElement {
  const strings = data.fields.filter((f) => f.type === 'string').map((f) => f.key);
  const colKey = columnField ?? labelField ?? xField ?? strings[0] ?? '';
  const rowKey = rowField ?? yField ?? strings.find((k) => k !== colKey) ?? '';
  const valueKey = valueField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';

  const columns: string[] = [];
  const rows: string[] = [];
  const values = new Map<string, number>();
  for (const r of data.rows) {
    const v = Number(r[valueKey]);
    if (r[valueKey] === null || r[valueKey] === undefined || !Number.isFinite(v)) continue;
    const c = String(r[colKey] ?? '');
    const rw = String(r[rowKey] ?? '');
    if (!columns.includes(c)) columns.push(c);
    if (!rows.includes(rw)) rows.push(rw);
    values.set(`${rw}\u0000${c}`, v);
  }

  const all = [...values.values()];
  const minVal = all.length > 0 ? Math.min(...all) : 0;
  const maxVal = all.length > 0 ? Math.max(...all) : 0;
  const span = maxVal - minVal;

  const bottom = MARGIN.bottom + (showLegend ? 22 : 0);
  const innerW = Math.max(0, width - MARGIN.left - MARGIN.right);
  const innerH = Math.max(0, height - MARGIN.top - bottom);
  const cw = columns.length > 0 ? innerW / columns.length : 0;
  const ch = rows.length > 0 ? innerH / rows.length : 0;

  const [active, setActive] = React.useState<[number, number]>([0, 0]);
  const refs = React.useRef(new Map<string, SVGGElement>());
  const [focusKey, setFocusKey] = React.useState<string | null>(null);
  const gradId = React.useId();

  const focusCell = (ri: number, ci: number) => {
    const r = Math.max(0, Math.min(rows.length - 1, ri));
    const c = Math.max(0, Math.min(columns.length - 1, ci));
    setActive([r, c]);
    refs.current.get(`${r},${c}`)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, ri: number, ci: number, cell: HeatmapCell | null) => {
    switch (e.key) {
      case 'ArrowRight': focusCell(ri, ci + 1); break;
      case 'ArrowLeft': focusCell(ri, ci - 1); break;
      case 'ArrowDown': focusCell(ri + 1, ci); break;
      case 'ArrowUp': focusCell(ri - 1, ci); break;
      case 'Home': focusCell(ri, 0); break;
      case 'End': focusCell(ri, columns.length - 1); break;
      case 'Enter':
      case ' ':
        if (cell) onSelect?.(cell);
        break;
      default: return;
    }
    e.preventDefault();
  };

  const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + '…' : s);

  return (
    <svg
      width={width}
      height={height}
      aria-label={ariaLabel ?? `Heatmap of ${valueKey}`}
      role="grid"
      aria-rowcount={rows.length}
      aria-colcount={columns.length}
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {columns.map((c, ci) => (
          <text key={c} x={ci * cw + cw / 2} y={-8} textAnchor="middle" aria-hidden="true"
            fontSize={theme.typography.fontSizeSm} fill={theme.text.primary}>{trunc(c, Math.max(4, Math.floor(cw / 7)))}</text>
        ))}
        {rows.map((rw, ri) => (
          <g key={rw} role="row" aria-rowindex={ri + 1}>
            <text x={-8} y={ri * ch + ch / 2} textAnchor="end" dominantBaseline="middle" aria-hidden="true"
              fontSize={theme.typography.fontSizeSm} fill={theme.text.primary}>{trunc(rw, 12)}</text>
            {columns.map((c, ci) => {
              const v = values.get(`${rw}\u0000${c}`);
              const has = v !== undefined;
              const fill = has ? sequentialColor(theme, span > 0 ? (v - minVal) / span : 0) : theme.surface.surface;
              const cell: HeatmapCell | null = has ? { row: rw, column: c, value: v } : null;
              const label = `${rw}, ${c}: ${has ? v.toLocaleString() : 'no data'}`;
              const isActive = active[0] === ri && active[1] === ci;
              const focused = focusKey === `${ri},${ci}`;
              return (
                <g
                  key={c}
                  ref={(el) => { if (el) refs.current.set(`${ri},${ci}`, el); else refs.current.delete(`${ri},${ci}`); }}
                  role="gridcell"
                  aria-colindex={ci + 1}
                  aria-label={label}
                  tabIndex={isActive ? 0 : -1}
                  onKeyDown={(e) => onKeyDown(e, ri, ci, cell)}
                  onFocus={() => { setActive([ri, ci]); setFocusKey(`${ri},${ci}`); }}
                  onBlur={() => setFocusKey(null)}
                  onClick={() => { setActive([ri, ci]); if (cell) onSelect?.(cell); }}
                  style={{ outline: 'none', cursor: onSelect ? 'pointer' : 'default' }}
                >
                  <title>{label}</title>
                  <rect x={ci * cw} y={ri * ch} width={cw} height={ch} fill={fill}
                    stroke={theme.surface.background} strokeWidth={1} />
                  {focused && (
                    <rect data-testid="heatmap-focus-ring" x={ci * cw + 1.5} y={ri * ch + 1.5}
                      width={Math.max(0, cw - 3)} height={Math.max(0, ch - 3)} fill="none"
                      stroke={theme.text.primary} strokeWidth={3} pointerEvents="none" />
                  )}
                  {showValues && has && cw >= 28 && ch >= 16 && (
                    <text x={ci * cw + cw / 2} y={ri * ch + ch / 2} textAnchor="middle" dominantBaseline="middle"
                      pointerEvents="none" fontSize={theme.typography.fontSizeSm}
                      fill={contrastText(fill, theme.text.primary, theme.text.inverse)}>
                      {v.toLocaleString()}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        ))}
      </g>
      {showLegend && (
        <g data-testid="heatmap-legend" fontSize={theme.typography.fontSizeSm} fill={theme.text.primary}>
          <defs>
            <linearGradient id={gradId} x1="0" x2="1" y1="0" y2="0">
              {theme.colors.sequential.map((c, i, a) => (
                <stop key={i} offset={`${(i / Math.max(a.length - 1, 1)) * 100}%`} stopColor={c} />
              ))}
            </linearGradient>
          </defs>
          <rect x={MARGIN.left} y={height - 26} width={Math.min(160, Math.max(0, width / 2))} height={8}
            fill={`url(#${gradId})`} stroke={theme.surface.border} />
          <text x={MARGIN.left} y={height - 4}>{minVal.toLocaleString()}</text>
          <text x={MARGIN.left + Math.min(160, Math.max(0, width / 2))} y={height - 4} textAnchor="end">
            {maxVal.toLocaleString()}
          </text>
        </g>
      )}
    </svg>
  );
}
