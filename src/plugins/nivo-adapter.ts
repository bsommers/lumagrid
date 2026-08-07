import type React from 'react';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';

/**
 * Theme tokens shaped to match Nivo's own nested `theme` prop, so callers
 * can pass this straight through to a Nivo component with no reshaping.
 * Covers the fields most Nivo charts read (background, text, axis, grid,
 * tooltip) — not Nivo's full theme surface (no legends/markers/crosshair/
 * dots; override those directly on the Nivo component if needed).
 */
export interface NivoTheme {
  background: string;
  text: { fontFamily: string; fontSize: number; fill: string };
  axis: {
    domain: { line: { stroke: string } };
    ticks: { line: { stroke: string }; text: { fill: string; fontSize: number } };
    legend: { text: { fill: string; fontSize: number } };
  };
  grid: { line: { stroke: string } };
  tooltip: { container: { background: string; color: string; fontSize: number } };
  /** Convenience: pass straight to Nivo's separate `colors` prop. */
  colors: string[];
}

/** Shared theme adapter for all Nivo plugins. */
export function nivoThemeAdapter(theme: ThemeDefinition): NivoTheme {
  const fontSize = parseInt(theme.typography.fontSizeSm, 10);
  return {
    background: theme.surface.background,
    text: {
      fontFamily: theme.typography.fontFamily,
      fontSize,
      fill: theme.text.secondary,
    },
    axis: {
      domain: { line: { stroke: theme.surface.border } },
      ticks: {
        line: { stroke: theme.surface.border },
        text: { fill: theme.text.secondary, fontSize },
      },
      legend: { text: { fill: theme.text.primary, fontSize } },
    },
    grid: { line: { stroke: theme.surface.border } },
    tooltip: {
      container: {
        background: theme.surface.surface,
        color: theme.text.primary,
        fontSize,
      },
    },
    colors: theme.colors.categorical,
  };
}

export interface NivoPluginOptions<TData, TConfig = Record<string, unknown>> {
  id: string;
  label?: string;
  /** Reshape TransformedData into whatever structure this Nivo chart expects. */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  Renderer: React.ComponentType<RendererProps<TData, NivoTheme, TConfig>>;
}

/**
 * Creates a ChartPlugin backed by a declarative Nivo component.
 * The NivoTheme is derived automatically from the VizBox ThemeDefinition.
 *
 * @example
 * ```tsx
 * import { ResponsiveBar } from '@nivo/bar';
 * import { createNivoPlugin } from 'vizbox/plugins';
 *
 * registerPlugin(createNivoPlugin<{ name: string; value: number }[], { dataKey?: string; nameKey?: string }>({
 *   id: 'nivo-bar',
 *   label: 'Bar (Nivo)',
 *   dataAdapter: (data) => data.rows as { name: string; value: number }[],
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <div style={{ width, height }}>
 *       <ResponsiveBar
 *         data={data}
 *         keys={[config?.dataKey ?? 'value']}
 *         indexBy={config?.nameKey ?? 'name'}
 *         theme={theme}
 *         colors={theme.colors}
 *       />
 *     </div>
 *   ),
 * }));
 * ```
 */
export function createNivoPlugin<TData, TConfig = Record<string, unknown>>(
  options: NivoPluginOptions<TData, TConfig>,
): ChartPlugin<TData, NivoTheme, TConfig> {
  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: options.dataAdapter,
    themeAdapter: nivoThemeAdapter,
    Renderer: options.Renderer,
  };
}
