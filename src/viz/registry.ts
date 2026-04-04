import type { ComponentType } from 'react';
import type { VisualizationProps } from './types.js';

type VizComponent = ComponentType<VisualizationProps>;

// Module-level registry (separate from the core registry — viz layer owns its own)
const vizRegistry = new Map<string, VizComponent>();

/**
 * Registers a visualization component under a string key.
 * Overwrites any existing registration with the same key.
 */
export function registerVisualization(key: string, component: VizComponent): void {
  vizRegistry.set(key, component);
}

/** Returns the component registered under `key`, or undefined. */
export function getVisualization(key: string): VizComponent | undefined {
  return vizRegistry.get(key);
}

/** Returns all currently registered keys. */
export function listVisualizations(): string[] {
  return [...vizRegistry.keys()];
}
