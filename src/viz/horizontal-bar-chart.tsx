import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

const MARGIN = { top: 16, right: 24, bottom: 16, left: 120 };

/**
 * Horizontal bar chart: one bar per row, length from `valueField`, label from `labelField`.
 * Legacy `xField` (value) and `yField` (label) are accepted; role names win when both are given.
 *
 * @public
 */
export function HorizontalBarChart({
  data,
  width,
  height,
  valueField,
  labelField,
  xField,
  yField,
  ariaLabel,
  theme,
}: NativeChartProps): React.ReactElement {
  // Role name, then legacy alias, then inference from data.fields
  const valueKey = valueField ?? xField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const labelKey = labelField ?? yField ?? data.fields.find((f) => f.type === 'string')?.key ?? '';

  const rows = data.rows
    .map((r) => ({ label: String(r[labelKey] ?? ''), value: Number(r[valueKey] ?? 0) }))
    .filter((r) => isFinite(r.value));

  const innerW = width - MARGIN.left - MARGIN.right;
  const barHeight = Math.max(8, Math.floor((height - MARGIN.top - MARGIN.bottom) / Math.max(rows.length, 1)) - 4);
  const innerH = rows.length * (barHeight + 4);
  const maxVal = Math.max(...rows.map((r) => r.value), 1);

  return (
    <svg
      width={width}
      height={Math.max(height, innerH + MARGIN.top + MARGIN.bottom)}
      aria-label={ariaLabel ?? `Horizontal bar chart of ${valueKey}`}
      role="img"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {rows.map((row, i) => {
          const barW = Math.max(0, (row.value / maxVal) * innerW);
          const y = i * (barHeight + 4);
          const color = categoricalColor(theme, i);
          return (
            <g key={i}>
              <text
                x={-8}
                y={y + barHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={theme.typography.fontSizeSm}
                fill={theme.text.primary}
              >
                {row.label.length > 14 ? row.label.slice(0, 13) + '…' : row.label}
              </text>
              <rect
                x={0}
                y={y}
                width={barW}
                height={barHeight}
                fill={color}
                rx={2}
                aria-label={`${row.label}: ${row.value.toLocaleString()}`}
              >
                <title>{row.label}: {row.value.toLocaleString()}</title>
              </rect>
              {barW > 40 && (
                <text
                  x={barW - 6}
                  y={y + barHeight / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={theme.typography.fontSizeSm}
                  fill={theme.text.inverse}
                >
                  {row.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
        {/* Zero line */}
        <line x1={0} y1={0} x2={0} y2={innerH} stroke={theme.surface.border} strokeWidth={1} />
      </g>
    </svg>
  );
}
