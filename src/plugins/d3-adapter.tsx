import React, { useEffect, useRef } from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';

/**
 * Minimal theme tokens extracted from Lumagrid ThemeDefinition for D3 charts.
 * Keeps D3 charts decoupled from Lumagrid internals.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface D3Theme {
  /** Categorical color palette (for grouping/series). */
  colors: string[];
  /** Sequential color palette (for choropleth, heatmap, etc.). */
  sequentialColors: string[];
  fontFamily: string;
  fontSize: string;
  background: string;
  foreground: string;
  border: string;
}

function toD3Theme(theme: ThemeDefinition): D3Theme {
  return {
    colors: theme.colors.categorical,
    sequentialColors: theme.colors.sequential,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizeSm,
    background: theme.surface.background,
    foreground: theme.text.primary,
    border: theme.surface.border,
  };
}

/**
 * Options for {@link createD3Plugin}.
 *
 * Experimental: may change in a minor release.
 *
 * @beta
 * @experimental
 */
export interface D3PluginOptions<TData, TConfig = Record<string, unknown>> {
  id: string;
  label?: string;
  /** Reshape TransformedData into whatever structure your D3 code expects. */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  /** Called once when the container mounts. Append SVG/canvas here. */
  mount(container: HTMLDivElement, data: TData, theme: D3Theme, width: number, height: number): void;
  /** Called on every re-render (data/size/theme change). Update the chart in-place. */
  update(container: HTMLDivElement, data: TData, theme: D3Theme, width: number, height: number): void;
  /** Called when the container unmounts. Remove listeners and DOM nodes. */
  destroy(container: HTMLDivElement): void;
}

/**
 * Creates a ChartPlugin backed by a D3 imperative lifecycle.
 * The D3Theme is derived automatically from the Lumagrid ThemeDefinition.
 *
 * @example
 * ```ts
 * import * as d3 from 'd3';
 * import { createD3Plugin } from 'lumagrid/plugins';
 *
 * const bubblePlugin = createD3Plugin({
 *   id: 'bubble',
 *   dataAdapter: (data) => data.rows,
 *   mount(el, data, theme, w, h) {
 *     const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);
 *     svg.selectAll('circle')
 *       .data(data)
 *       .join('circle')
 *       .attr('cx', (d) => Number(d['x'] ?? 0))
 *       .attr('cy', (d) => Number(d['y'] ?? 0))
 *       .attr('r', 6)
 *       .attr('fill', theme.colors[0] ?? 'steelblue');
 *   },
 *   update(el, data, theme, w, h) {
 *     // d3 update pattern
 *   },
 *   destroy(el) {
 *     d3.select(el).selectAll('*').remove();
 *   },
 * });
 *
 * registerPlugin(bubblePlugin);
 * ```
 *
 * @public
 */
export function createD3Plugin<TData, TConfig = Record<string, unknown>>(
  options: D3PluginOptions<TData, TConfig>,
): ChartPlugin<TData, D3Theme, TConfig> {
  function D3Renderer({
    data, theme, width, height,
  }: RendererProps<TData, D3Theme, TConfig>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      if (!mountedRef.current) {
        options.mount(el, data, theme, width, height);
        mountedRef.current = true;
      } else {
        options.update(el, data, theme, width, height);
      }
    }, [data, theme, width, height]);

    useEffect(() => {
      const el = containerRef.current;
      return () => {
        if (el && mountedRef.current) {
          options.destroy(el);
          mountedRef.current = false;
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        style={{ width, height, overflow: 'hidden' }}
        aria-label={`${options.label ?? options.id} chart`}
      />
    );
  }
  D3Renderer.displayName = `D3Plugin(${options.id})`;

  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: options.dataAdapter,
    themeAdapter: toD3Theme,
    Renderer: D3Renderer,
  };
}
