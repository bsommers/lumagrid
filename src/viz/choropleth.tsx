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
          return (
            <path key={feature.id} d={d} fill={getColor(feature)}
              stroke={theme.surface.background} strokeWidth={0.5}>
              <title>{label}: {typeof val === 'number' && Number.isFinite(val) ? val.toLocaleString() : '—'}</title>
            </path>
          );
        })}
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
