import type { ComponentType, LazyExoticComponent } from 'react';
import BarDemo from './BarDemo';
import barSource from './BarDemo.tsx?raw';
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
];
