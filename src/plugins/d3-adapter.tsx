import React, { useEffect, useRef } from 'react';
import type { VisualizationProps } from '../viz/types.js';

/**
 * Lifecycle interface that a D3 chart module must implement to plug into VizBox.
 *
 * @example
 * ```ts
 * import * as d3 from 'd3';
 * import type { D3ChartLifecycle } from 'vizbox/plugins';
 * import type { TransformedData } from 'vizbox/transforms';
 *
 * export const MyD3Chart: D3ChartLifecycle = {
 *   mount(container, data, width, height) {
 *     const svg = d3.select(container).append('svg').attr('width', width).attr('height', height);
 *     svg.append('text').attr('x', width / 2).attr('y', height / 2)
 *       .attr('text-anchor', 'middle')
 *       .text(`${data.rows.length} rows`);
 *   },
 *   update(container, data, width, height) {
 *     d3.select(container).select('text').text(`${data.rows.length} rows`);
 *   },
 *   destroy(container) {
 *     d3.select(container).selectAll('*').remove();
 *   },
 * };
 * ```
 *
 * Then register and use:
 * ```tsx
 * import { createD3Visualization } from 'vizbox/plugins';
 * registerVisualization('my-d3', createD3Visualization(MyD3Chart));
 * ```
 */
export interface D3ChartLifecycle {
  /**
   * Called once when the container mounts. Append your SVG / canvas here.
   * @param container - The host DOM element. Guaranteed non-null at call time.
   * @param data      - Current TransformedData from the pipeline.
   * @param width     - Container width in pixels.
   * @param height    - Container height in pixels.
   */
  mount(
    container: HTMLDivElement,
    data: VisualizationProps['data'],
    width: number,
    height: number,
  ): void;

  /**
   * Called on every re-render (data or size change). Update the existing chart in-place.
   */
  update(
    container: HTMLDivElement,
    data: VisualizationProps['data'],
    width: number,
    height: number,
  ): void;

  /**
   * Called when the container unmounts. Clean up event listeners, timers, and DOM nodes.
   */
  destroy(container: HTMLDivElement): void;
}

/**
 * Wraps a D3ChartLifecycle into a React component that satisfies VisualizationProps.
 * The returned component can be passed directly to registerVisualization().
 *
 * @example
 * ```tsx
 * registerVisualization('my-d3-bar', createD3Visualization(MyD3BarChart));
 * ```
 */
export function createD3Visualization(
  lifecycle: D3ChartLifecycle,
): React.ComponentType<VisualizationProps> {
  function D3Wrapper({ data, width, height }: VisualizationProps): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;

      if (!mountedRef.current) {
        lifecycle.mount(el, data, width, height);
        mountedRef.current = true;
      } else {
        lifecycle.update(el, data, width, height);
      }
    }, [data, width, height]);

    useEffect(() => {
      const el = containerRef.current;
      return () => {
        if (el && mountedRef.current) {
          lifecycle.destroy(el);
          mountedRef.current = false;
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        style={{ width, height, overflow: 'hidden' }}
        aria-label="D3 visualization"
      />
    );
  }

  D3Wrapper.displayName = 'D3Wrapper';
  return D3Wrapper;
}
