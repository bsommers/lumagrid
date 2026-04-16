import { createNativePlugin } from '../registry/native-plugin.js';
import { DataTable } from './data-table.js';
import { HorizontalBarChart } from './horizontal-bar-chart.js';
import { LineChart } from './line-chart.js';
import { PieChart } from './pie-chart.js';
import { Choropleth } from './choropleth.js';
import { ForceGraph } from './force-graph.js';
import { TreeView } from './tree-view.js';

export const nativeTablePlugin = createNativePlugin('table', DataTable, 'Table');
export const nativeBarPlugin = createNativePlugin('bar', HorizontalBarChart, 'Bar Chart');
export const nativeLinePlugin = createNativePlugin('line', LineChart, 'Line Chart');
export const nativePiePlugin = createNativePlugin('pie', PieChart, 'Pie Chart');
export const nativeChoroplethPlugin = createNativePlugin('choropleth', Choropleth, 'Choropleth');
export const nativeForceGraphPlugin = createNativePlugin('force-graph', ForceGraph, 'Force Graph');
export const nativeTreePlugin = createNativePlugin('tree', TreeView, 'Tree');
