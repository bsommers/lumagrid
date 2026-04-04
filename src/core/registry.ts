import type { ComponentType } from 'react';
import type { VisualizationProps } from '../viz/types.js';

type VizComponent = ComponentType<VisualizationProps>;

const registry = new Map<string, VizComponent>();

/**
 * Registers a visualization component under a key.
 * Calling twice with the same key overwrites the previous registration.
 */
export function registerVisualization(key: string, component: VizComponent): void {
  registry.set(key, component);
}

/** Returns the registered component for a key, or undefined if not found. */
export function getVisualization(key: string): VizComponent | undefined {
  return registry.get(key);
}

/** Returns all registered keys. */
export function listVisualizations(): string[] {
  return [...registry.keys()];
}
