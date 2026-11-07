import React from 'react';
import type { ComponentType } from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { ChartPlugin, RendererProps } from './types.js';

/**
 * Props that built-in SVG charts accept.
 *
 * @public
 */
export interface NativeChartProps {
  data: TransformedData;
  width: number;
  height: number;
  theme: ThemeDefinition;
  /**
   * @deprecated Use `valueField`, `labelField` or `idField` (the mapping depends
   * on the chart, see CHANGELOG.md). Removed in 2.0.
   */
  xField?: string;
  /**
   * @deprecated Use `valueField`, `labelField` or `idField` (the mapping depends
   * on the chart, see CHANGELOG.md). Removed in 2.0.
   */
  yField?: string;
  /** Groups rows into colored series (LineChart). */
  colorField?: string;
  /** Category or display label: bar label, line x category, pie slice label, force-graph node label. */
  labelField?: string;
  /** Numeric measure: bar length, line y value, pie slice size, choropleth color value. */
  valueField?: string;
  /** Identifies a node (ForceGraph). */
  idField?: string;
  ariaLabel?: string;
  [key: string]: unknown;
}

/**
 * Per-view config for native plugins: the native chart props minus `data`, `width`, `height` and `theme`.
 *
 * @public
 */
export type NativeConfig = Omit<NativeChartProps, 'data' | 'width' | 'height' | 'theme'>;

/**
 * Wraps an existing VizBox native SVG chart component as a ChartPlugin.
 * Uses identity adapters — data and theme pass through unchanged.
 *
 * @example
 * registerPlugin(createNativePlugin('bar', HorizontalBarChart));
 *
 * @public
 */
export function createNativePlugin(
  id: string,
  Component: ComponentType<NativeChartProps>,
  label?: string,
): ChartPlugin<TransformedData, ThemeDefinition, NativeConfig> {
  function NativeRenderer({
    data, theme, width, height, config,
  }: RendererProps<TransformedData, ThemeDefinition, NativeConfig>): React.ReactElement {
    // config spreads first so a colliding key (e.g. a stray `data`/`width` in
    // config) can never clobber the real chart props.
    return <Component {...config} data={data} theme={theme} width={width} height={height} />;
  }
  NativeRenderer.displayName = `NativePlugin(${id})`;

  return {
    id,
    label: label ?? id,
    dataAdapter: (data) => data,
    themeAdapter: (theme) => theme,
    Renderer: NativeRenderer,
  };
}
