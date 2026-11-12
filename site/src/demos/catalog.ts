import { lazy } from 'react';
import type { ComponentType, LazyExoticComponent } from 'react';
import BarDemo from './BarDemo';
import barSource from './BarDemo.tsx?raw';
import LineDemo from './LineDemo';
import lineSource from './LineDemo.tsx?raw';
import PieDemo from './PieDemo';
import pieSource from './PieDemo.tsx?raw';
import ForceDemo from './ForceDemo';
import forceSource from './ForceDemo.tsx?raw';
import ChoroplethDemo from './ChoroplethDemo';
import choroplethSource from './ChoroplethDemo.tsx?raw';
import TableDemo from './TableDemo';
import tableSource from './TableDemo.tsx?raw';
import TreeDemo from './TreeDemo';
import treeSource from './TreeDemo.tsx?raw';
import ScatterDemo from './ScatterDemo';
import scatterSource from './ScatterDemo.tsx?raw';
import AreaDemo from './AreaDemo';
import areaSource from './AreaDemo.tsx?raw';
import ColumnDemo from './ColumnDemo';
import columnSource from './ColumnDemo.tsx?raw';
import HeatmapDemo from './HeatmapDemo';
import heatmapSource from './HeatmapDemo.tsx?raw';
import d3Source from './D3Demo.tsx?raw';
import rechartsSource from './RechartsDemo.tsx?raw';
import nivoSource from './NivoDemo.tsx?raw';
import { extractRegion } from '../lib/region';
import type { DemoProps } from './types';

export type DemoComponent = ComponentType<DemoProps> | LazyExoticComponent<ComponentType<DemoProps>>;

interface BaseEntry {
  id: string;
  title: string;
  description: string;
  Component: DemoComponent;
  /** Usage region of the very file that renders the chart (single source). */
  code: string;
}

export interface NativeEntry extends BaseEntry {
  kind: 'native';
}

/** Adapter demos load on demand: the dynamic import puts d3, recharts and nivo in their own chunks. */
export interface AdapterEntry extends BaseEntry {
  kind: 'adapter';
  load: () => Promise<{ default: ComponentType<DemoProps> }>;
}

export type CatalogEntry = NativeEntry | AdapterEntry;

const loadD3 = () => import('./D3Demo');
const loadRecharts = () => import('./RechartsDemo');
const loadNivo = () => import('./NivoDemo');

/** Gallery entries in display order. */
export const catalog: CatalogEntry[] = [
  {
    id: 'bar',
    title: 'Horizontal bar chart',
    description: 'One bar per row; the length comes from valueField, the label from labelField.',
    kind: 'native',
    Component: BarDemo,
    code: extractRegion(barSource, 'code'),
  },
  {
    id: 'line',
    title: 'Line chart',
    description: 'Monthly revenue per region; colorField splits the series.',
    kind: 'native',
    Component: LineDemo,
    code: extractRegion(lineSource, 'code'),
  },
  {
    id: 'pie',
    title: 'Pie chart',
    description: 'Slice size from valueField, slice label from labelField.',
    kind: 'native',
    Component: PieDemo,
    code: extractRegion(pieSource, 'code'),
  },
  {
    id: 'force-graph',
    title: 'Force graph',
    description: 'Seeded force layout. The button relayouts it with a new seed.',
    kind: 'native',
    Component: ForceDemo,
    code: extractRegion(forceSource, 'code'),
  },
  {
    id: 'choropleth',
    title: 'Choropleth',
    description: 'Hex tile map colored by a numeric feature property.',
    kind: 'native',
    Component: ChoroplethDemo,
    code: extractRegion(choroplethSource, 'code'),
  },
  {
    id: 'table',
    title: 'Data table',
    description: 'Click a column header to sort.',
    kind: 'native',
    Component: TableDemo,
    code: extractRegion(tableSource, 'code'),
  },
  {
    id: 'tree',
    title: 'Tree view',
    description: 'Hover and select nodes; click a parent to collapse it.',
    kind: 'native',
    Component: TreeDemo,
    code: extractRegion(treeSource, 'code'),
  },
  {
    id: 'scatter',
    title: 'Scatter chart',
    description: 'Marketing spend against revenue by channel; bubble size is signups.',
    kind: 'native',
    Component: ScatterDemo,
    code: extractRegion(scatterSource, 'code'),
  },
  {
    id: 'area',
    title: 'Area chart',
    description: 'Monthly revenue per region. The checkbox stacks the series.',
    kind: 'native',
    Component: AreaDemo,
    code: extractRegion(areaSource, 'code'),
  },
  {
    id: 'column',
    title: 'Column chart',
    description: 'Monthly revenue per region. The button switches grouped and stacked columns.',
    kind: 'native',
    Component: ColumnDemo,
    code: extractRegion(columnSource, 'code'),
  },
  {
    id: 'heatmap',
    title: 'Heatmap',
    description: 'Support tickets by weekday and four-hour slot; arrow keys move between cells.',
    kind: 'native',
    Component: HeatmapDemo,
    code: extractRegion(heatmapSource, 'code'),
  },
  {
    id: 'd3',
    title: 'D3 bars',
    description: 'A D3 plugin: hover a bar to highlight it.',
    kind: 'adapter',
    load: loadD3,
    Component: lazy(loadD3),
    code: extractRegion(d3Source, 'code'),
  },
  {
    id: 'recharts',
    title: 'Recharts bars',
    description: 'A Recharts plugin with the library tooltip.',
    kind: 'adapter',
    load: loadRecharts,
    Component: lazy(loadRecharts),
    code: extractRegion(rechartsSource, 'code'),
  },
  {
    id: 'nivo',
    title: 'Nivo bars',
    description: 'A Nivo plugin with the library tooltip.',
    kind: 'adapter',
    load: loadNivo,
    Component: lazy(loadNivo),
    code: extractRegion(nivoSource, 'code'),
  },
];
