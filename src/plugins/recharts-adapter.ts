import type React from 'react';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';

/**
 * Minimal theme tokens for Recharts components.
 * Extracted from VizBox ThemeDefinition by rechartsThemeAdapter.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface RechartsTheme {
  colors: string[];
  fontFamily: string;
  fontSize: string;
  gridColor: string;
  textColor: string;
  background: string;
}

/**
 * Row shape passed to Recharts data arrays.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export type RechartsRow = Record<string, string | number | null>;

/**
 * Per-view configuration for Recharts plugins.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface RechartsConfig {
  /** Field name to use as the bar/line value key. Auto-detected if omitted. */
  dataKey?: string;
  /** Field name to use as the category/label key. Auto-detected if omitted. */
  nameKey?: string;
}

/**
 * Shared theme adapter for all Recharts plugins.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export function rechartsThemeAdapter(theme: ThemeDefinition): RechartsTheme {
  return {
    colors: theme.colors.categorical,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizeSm,
    gridColor: theme.surface.border,
    textColor: theme.text.secondary,
    background: theme.surface.background,
  };
}

function defaultDataAdapter(data: TransformedData, config?: RechartsConfig): RechartsRow[] {
  let nameKey = config?.nameKey;
  if (nameKey === undefined) {
    nameKey = data.fields.find((f) => f.type === 'string')?.key;
    if (nameKey === undefined) {
      nameKey = '';
      console.warn(
        '[vizbox] recharts-adapter: no string field found for nameKey auto-detection; ' +
        'defaulting to an empty name for every row. Pass config.nameKey explicitly to silence this warning.',
      );
    }
  }
  let dataKey = config?.dataKey;
  if (dataKey === undefined) {
    dataKey = data.fields.find((f) => f.type === 'number')?.key;
    if (dataKey === undefined) {
      dataKey = '';
      console.warn(
        '[vizbox] recharts-adapter: no number field found for dataKey auto-detection; ' +
        'defaulting to a zero value for every row. Pass config.dataKey explicitly to silence this warning.',
      );
    }
  }
  return data.rows.map((r) => ({
    name: String(r[nameKey] ?? ''),
    value: Number(r[dataKey] ?? 0),
    ...Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v === null ? null : (typeof v === 'number' ? v : String(v))]),
    ),
  }));
}

/**
 * Creates a Recharts bar (or any) chart plugin.
 * You supply only the Recharts Renderer component; data reshaping and
 * theme bridging are handled automatically.
 *
 * @example
 * ```tsx
 * import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
 * import { createRechartsPlugin } from 'vizbox/plugins';
 *
 * registerPlugin(createRechartsPlugin({
 *   id: 'recharts-bar',
 *   label: 'Bar (Recharts)',
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <BarChart width={width} height={height} data={data}>
 *       <CartesianGrid stroke={theme.gridColor} />
 *       <XAxis dataKey={config?.nameKey ?? 'name'} tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
 *       <YAxis tick={{ fill: theme.textColor }} />
 *       <Tooltip />
 *       <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0]} />
 *     </BarChart>
 *   ),
 * }));
 * ```
 *
 * @public
 */
export function createRechartsPlugin(options: {
  id: string;
  label?: string;
  Renderer: React.ComponentType<RendererProps<RechartsRow[], RechartsTheme, RechartsConfig>>;
  /** Override the default data reshaping if needed. */
  dataAdapter?: (data: TransformedData, config?: RechartsConfig) => RechartsRow[];
}): ChartPlugin<RechartsRow[], RechartsTheme, RechartsConfig> {
  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: options.dataAdapter ?? defaultDataAdapter,
    themeAdapter: rechartsThemeAdapter,
    Renderer: options.Renderer,
  };
}
