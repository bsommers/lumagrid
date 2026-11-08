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
  PipelineStep,
} from './transforms/index.js';

// Plugin registry
export { registerPlugin, getPlugin, listPlugins, registerAndGetId } from './registry/index.js';
export type { ChartPlugin, ViewSpec, RendererProps } from './registry/types.js';
export { createNativePlugin } from './registry/native-plugin.js';
export type { NativeChartProps, NativeConfig } from './registry/native-plugin.js';

// Core layer
export {
  WidgetContainer,
  ViewSwitcher,
  CollapseManager,
  useCollapse,
} from './core/index.js';
export type {
  WidgetContainerProps,
  ViewSwitcherProps,
  CollapseManagerProps,
  CollapseState,
  AnyTransform,
} from './core/index.js';

// Viz layer (re-export key symbols — consumers can also import from 'vizbox/viz')
export {
  DataTable,
  HorizontalBarChart,
  LineChart,
  PieChart,
  Choropleth,
  ForceGraph,
  TreeView,
} from './viz/index.js';
export type { PieChartProps, ChoroplethProps, ForceGraphProps, TreeViewProps } from './viz/index.js';

// Plugin layer
export { createD3Plugin, createRechartsPlugin, createNivoPlugin } from './plugins/index.js';
export type {
  D3Theme,
  D3PluginOptions,
  RechartsTheme,
  RechartsRow,
  RechartsConfig,
  NivoTheme,
  NivoPluginOptions,
} from './plugins/index.js';
