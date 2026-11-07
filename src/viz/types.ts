import type { TransformedData } from '../transforms/types.js';

/**
 * Base props shared by every visualization component.
 * All visualizations must accept and implement these.
 *
 * @internal
 */
export interface VisualizationProps {
  data: TransformedData;
  width: number;
  height: number;
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
  /** Optional: numeric measure (bar length, line y value, pie slice size). Inferred if omitted. */
  valueField?: string;
  /** Optional: field that identifies a node (ForceGraph). */
  idField?: string;
  /** Optional: field to use for color grouping. */
  colorField?: string;
  /** Optional: field to use as labels. */
  labelField?: string;
  /** Optional: accessible title for the chart. */
  ariaLabel?: string;
}
