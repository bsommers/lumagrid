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
import { extractRegion } from '../lib/region';
import type { DemoProps } from './types';

export type DemoComponent = ComponentType<DemoProps> | LazyExoticComponent<ComponentType<DemoProps>>;

export interface CatalogEntry {
  id: string;
  title: string;
  description: string;
  kind: 'native' | 'adapter';
  Component: DemoComponent;
  /** Usage region of the very file that renders the chart (single source). */
  code: string;
}

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
];
