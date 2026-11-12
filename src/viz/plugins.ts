import { createNativePlugin } from '../registry/native-plugin.js';
import { DataTable } from './data-table.js';
import { HorizontalBarChart } from './horizontal-bar-chart.js';
import { LineChart } from './line-chart.js';
import { PieChart } from './pie-chart.js';
import { Choropleth } from './choropleth.js';
import { ForceGraph } from './force-graph.js';
import { TreeView } from './tree-view.js';
import { ScatterChart } from './scatter-chart.js';
import { AreaChart } from './area-chart.js';
import { ColumnChart } from './column-chart.js';
import { Heatmap } from './heatmap.js';

/**
 * Chart plugin with id `table` wrapping {@link DataTable}.
 *
 * @public
 */
export const nativeTablePlugin = createNativePlugin('table', DataTable, 'Table');
/**
 * Chart plugin with id `bar` wrapping {@link HorizontalBarChart}.
 *
 * @public
 */
export const nativeBarPlugin = createNativePlugin('bar', HorizontalBarChart, 'Bar Chart');
/**
 * Chart plugin with id `line` wrapping {@link LineChart}.
 *
 * @public
 */
export const nativeLinePlugin = createNativePlugin('line', LineChart, 'Line Chart');
/**
 * Chart plugin with id `pie` wrapping {@link PieChart}.
 *
 * @public
 */
export const nativePiePlugin = createNativePlugin('pie', PieChart, 'Pie Chart');
/**
 * Chart plugin with id `choropleth` wrapping {@link Choropleth}.
 *
 * @public
 */
export const nativeChoroplethPlugin = createNativePlugin('choropleth', Choropleth, 'Choropleth');
/**
 * Chart plugin with id `force-graph` wrapping {@link ForceGraph}.
 *
 * @public
 */
export const nativeForceGraphPlugin = createNativePlugin('force-graph', ForceGraph, 'Force Graph');
/**
 * Chart plugin with id `tree` wrapping {@link TreeView}.
 *
 * @public
 */
export const nativeTreePlugin = createNativePlugin('tree', TreeView, 'Tree');
/**
 * Chart plugin with id `scatter` wrapping {@link ScatterChart}.
 *
 * @public
 */
export const nativeScatterPlugin = createNativePlugin('scatter', ScatterChart, 'Scatter Chart');
/**
 * Chart plugin with id `area` wrapping {@link AreaChart}.
 *
 * @public
 */
export const nativeAreaPlugin = createNativePlugin('area', AreaChart, 'Area Chart');
/**
 * Chart plugin with id `column` wrapping {@link ColumnChart}.
 *
 * @public
 */
export const nativeColumnPlugin = createNativePlugin('column', ColumnChart, 'Column Chart');
/**
 * Chart plugin with id `heatmap` wrapping {@link Heatmap}.
 *
 * @public
 */
export const nativeHeatmapPlugin = createNativePlugin('heatmap', Heatmap, 'Heatmap');
