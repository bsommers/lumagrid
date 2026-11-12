import React from 'react';
import { sequentialColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';
import type { GeoFeature } from '../transforms/types.js';

/**
 * Props for {@link Choropleth}.
 *
 * @public
 */
export interface ChoroplethProps extends NativeChartProps {
  /** Property in each feature's properties to map to color. Takes precedence over `valueField`. */
  valueProperty?: string;
  /**
   * Optional pre-projected path strings. If provided, the component skips
   * projection and uses these strings directly (useful with D3 projection).
   * Keys must match feature IDs.
   *
   * @beta
   * @experimental
   */
  projectedPaths?: Record<string, string>;
  /** Render a text label (name and value) on each tile. Default: true. */
  showLabels?: boolean;
  /** Render a min..max color-scale legend. Default: true. */
  showLegend?: boolean;
}

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

function ratio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Picks whichever of the theme's text colors contrasts best with `fill`. */
function contrastText(fill: string, a: string, b: string): string {
  return ratio(fill, a) >= ratio(fill, b) ? a : b;
}

/** Center of the bounding box of all coordinates in an SVG path string. */
function pathCenter(d: string): { x: number; y: number } | null {
  const nums = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi)?.map(Number) ?? [];
  if (nums.length < 2) return null;
  const xs: number[] = [];
  const ys: number[] = [];
  nums.forEach((n, i) => (i % 2 === 0 ? xs : ys).push(n));
  return { x: (Math.min(...xs) + Math.max(...xs)) / 2, y: (Math.min(...ys) + Math.max(...ys)) / 2 };
}

/**
 * Choropleth map: colors each feature by a numeric property, resolved as `valueProperty`,
 * then `valueField`, then legacy `yField`, then `'value'`. Needs `data.geo`.
 *
 * @public
 */
export function Choropleth({
  data,
  width,
  height,
  valueField,
  yField,
  ariaLabel,
  theme,
  valueProperty,
  projectedPaths,
  showLabels = true,
  showLegend = true,
}: ChoroplethProps): React.ReactElement {
  if (!data.geo) {
    return (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary }}>
        Choropleth requires a GeoData object. Use the geoNormalize transform to attach GeoJSON.
      </div>
    );
  }

  const prop = valueProperty ?? valueField ?? yField ?? 'value';
  const features: GeoFeature[] = data.geo.features;

  const values = features
    .map((f) => f.properties[prop])
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const minVal = values.length > 0 ? Math.min(...values) : 0;
  const maxVal = values.length > 0 ? Math.max(...values, minVal + 1) : 1;

  const getColor = (feature: GeoFeature) => {
    const val = feature.properties[prop];
    if (typeof val !== 'number' || !Number.isFinite(val)) return theme.surface.border;
    const t = (val - minVal) / (maxVal - minVal);
    return sequentialColor(theme, t);
  };

  // If pre-projected paths are provided, use them directly
  if (projectedPaths) {
    return (
      <svg width={width} height={height} aria-label={ariaLabel ?? 'Choropleth map'} role="img">
        {features.map((feature) => {
          const d = projectedPaths[feature.id];
          if (!d) return null;
          const label = String(feature.properties['name'] ?? feature.id);
          const val = feature.properties[prop];
          const valText = typeof val === 'number' && Number.isFinite(val) ? val.toLocaleString() : '—';
          const fill = getColor(feature);
          const c = showLabels ? pathCenter(d) : null;
          return (
            <g key={feature.id}>
              <path d={d} fill={fill} stroke={theme.surface.background} strokeWidth={0.5}
                aria-label={`${label}: ${valText}`}>
                <title>{label}: {valText}</title>
              </path>
              {c && (
                <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" pointerEvents="none"
                  fontSize={theme.typography.fontSizeSm} fontFamily={theme.typography.fontFamily}
                  fill={contrastText(fill, theme.text.primary, theme.text.inverse)}>
                  <tspan x={c.x} dy="-0.5em">{label}</tspan>
                  <tspan x={c.x} dy="1.1em">{valText}</tspan>
                </text>
              )}
            </g>
          );
        })}
        {showLegend && (
          <g data-testid="choropleth-legend" fontSize={theme.typography.fontSizeSm}
            fontFamily={theme.typography.fontFamily} fill={theme.text.primary}>
            <defs>
              <linearGradient id="choropleth-legend-grad" x1="0" x2="1" y1="0" y2="0">
                {theme.colors.sequential.map((c, i, a) => (
                  <stop key={i} offset={`${(i / Math.max(a.length - 1, 1)) * 100}%`} stopColor={c} />
                ))}
              </linearGradient>
            </defs>
            <rect x={8} y={height - 22} width={Math.min(120, width / 3)} height={8}
              fill="url(#choropleth-legend-grad)" stroke={theme.surface.border} />
            <text x={8} y={height - 4}>{minVal.toLocaleString()}</text>
            <text x={8 + Math.min(120, width / 3)} y={height - 4} textAnchor="end">{maxVal.toLocaleString()}</text>
          </g>
        )}
      </svg>
    );
  }

  // Fallback: render a placeholder with instructions
  return (
    <div style={{
      width, height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: theme.spacing.md, padding: theme.spacing.lg,
      background: theme.surface.surface, borderRadius: theme.surface.borderRadius,
      color: theme.text.secondary, textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
    }}>
      <div style={{ fontSize: theme.typography.fontSizeLg, fontWeight: theme.typography.fontWeightBold }}>
        Choropleth
      </div>
      <div style={{ fontSize: theme.typography.fontSizeSm }}>
        {features.length} features loaded • value field: <code>{prop}</code>
      </div>
      <div style={{ fontSize: theme.typography.fontSizeSm }}>
        Pass <code>projectedPaths</code> (from a D3 geoPath projection) to render the map,
        or use the D3 adapter to attach a full projection-based renderer.
      </div>
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        {theme.colors.sequential.map((c, i) => (
          <div key={i} style={{
            width: 24, height: 24, background: c, borderRadius: 3,
            border: `1px solid ${theme.surface.border}`,
          }}>
            <title>{i === 0 ? `min: ${minVal}` : i === theme.colors.sequential.length - 1 ? `max: ${maxVal}` : ''}</title>
          </div>
        ))}
      </div>
    </div>
  );
}
