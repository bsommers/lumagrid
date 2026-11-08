import type React from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';

/**
 * Props passed to a plugin's `Renderer` component.
 *
 * @public
 */
export interface RendererProps<TData, TTheme, TConfig = Record<string, unknown>> {
  data: TData;
  theme: TTheme;
  width: number;
  height: number;
  config?: TConfig;
}

/**
 * A chart integration: adapters from Lumagrid data and theme plus the `Renderer` component that draws the chart.
 * The renderer field is named `Renderer` (not `component`).
 *
 * @public
 */
export interface ChartPlugin<
  TData = unknown,
  TTheme = unknown,
  TConfig = Record<string, unknown>,
> {
  /** Unique identifier used to register and look up this plugin. */
  id: string;
  /**
   * Converts Lumagrid TransformedData into whatever format this library expects.
   * Called on every render when data or config changes.
   */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  /**
   * Converts Lumagrid ThemeDefinition into the styling tokens this library expects.
   * Called on every render when the theme changes.
   */
  themeAdapter: (theme: ThemeDefinition, config?: TConfig) => TTheme;
  /** The actual chart component. Receives adapted data and theme — no Lumagrid internals. */
  Renderer: React.ComponentType<RendererProps<TData, TTheme, TConfig>>;
  /** Human-readable display name for the tab strip. Defaults to id. */
  label?: string;
}

/**
 * Per-view config stored in ViewSwitcher's views prop.
 *
 * @public
 */
export interface ViewSpec<TConfig = Record<string, unknown>> {
  /** Registered plugin id. */
  id: string;
  /** Optional chart-specific config forwarded to dataAdapter, themeAdapter, and Renderer. */
  config?: TConfig;
  /** Override display label for this view's tab. */
  label?: string;
}
