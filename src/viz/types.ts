import type { TransformedData } from '../transforms/types.js';

/**
 * Base props shared by every visualization component.
 * All visualizations must accept and implement these.
 */
export interface VisualizationProps {
  data: TransformedData;
  width: number;
  height: number;
  /** Optional: field to use as the x-axis / category. Inferred if omitted. */
  xField?: string;
  /** Optional: field to use as the y-axis / value. Inferred if omitted. */
  yField?: string;
  /** Optional: field to use for color grouping. */
  colorField?: string;
  /** Optional: field to use as labels. */
  labelField?: string;
  /** Optional: accessible title for the chart. */
  ariaLabel?: string;
}
