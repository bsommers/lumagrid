import type React from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';

export interface RendererProps<TData, TTheme, TConfig = Record<string, unknown>> {
  data: TData;
  theme: TTheme;
  width: number;
  height: number;
  config?: TConfig;
}

export interface ChartPlugin<
  TData = unknown,
  TTheme = unknown,
  TConfig = Record<string, unknown>,
> {
  /** Unique identifier used to register and look up this plugin. */
  id: string;
  /**
   * Converts VizBox TransformedData into whatever format this library expects.
   * Called on every render when data or config changes.
   */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  /**
   * Converts VizBox ThemeDefinition into the styling tokens this library expects.
   * Called on every render when the theme changes.
   */
  themeAdapter: (theme: ThemeDefinition, config?: TConfig) => TTheme;
  /** The actual chart component. Receives adapted data and theme — no VizBox internals. */
  Renderer: React.ComponentType<RendererProps<TData, TTheme, TConfig>>;
  /** Human-readable display name for the tab strip. Defaults to id. */
  label?: string;
}

/** Per-view config stored in ViewSwitcher's views prop. */
export interface ViewSpec<TConfig = Record<string, unknown>> {
  /** Registered plugin id. */
  id: string;
  /** Optional chart-specific config forwarded to dataAdapter, themeAdapter, and Renderer. */
  config?: TConfig;
  /** Override display label for this view's tab. */
  label?: string;
}
