// Theme layer
export { ThemeProvider, useTheme, lightTheme, darkTheme } from './theme/index.js';
export { categoricalColor, sequentialColor, divergingColor, thresholdScale } from './theme/index.js';
export type {
  ThemeDefinition,
  ColorPalette,
  TypographyTokens,
  SpacingTokens,
  SurfaceTokens,
  TextTokens,
  ThemeProviderProps,
} from './theme/index.js';

// Transform layer
export {
  flatten,
  aggregate,
  pivot,
  groupBy,
  geoNormalize,
  TransformPipeline,
} from './transforms/index.js';
export type {
  DataRow,
  DataTransform,
  ChainableTransform,
  TransformedData,
  FieldMeta,
  HierarchyNode,
  GeoData,
  GeoFeature,
  FlattenOptions,
  AggregateOptions,
  AggregationFn,
  PivotOptions,
  GroupByOptions,
  GeoNormalizeOptions,
} from './transforms/index.js';

// Core layer
export {
  WidgetContainer,
  ViewSwitcher,
  CollapseManager,
  useCollapse,
  registerVisualization,
  getVisualization,
  listVisualizations,
} from './core/index.js';
export type {
  WidgetContainerProps,
  ViewSwitcherProps,
  CollapseManagerProps,
  CollapseState,
} from './core/index.js';

// Viz layer (re-export key symbols — consumers can also import from 'vizbox/viz')
export type { VisualizationProps } from './viz/index.js';
export {
  DataTable,
  HorizontalBarChart,
  LineChart,
  PieChart,
  Choropleth,
  ForceGraph,
  TreeView,
} from './viz/index.js';

// Plugin layer
export { createD3Visualization } from './plugins/index.js';
export type { D3ChartLifecycle } from './plugins/index.js';
