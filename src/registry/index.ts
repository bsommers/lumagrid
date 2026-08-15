import type { ChartPlugin } from './types.js';

// Single module-level registry — the only one in the codebase.
const plugins = new Map<string, ChartPlugin<unknown, unknown, unknown>>();

export function registerPlugin<TData, TTheme, TConfig>(
  plugin: ChartPlugin<TData, TTheme, TConfig>,
): void {
  plugins.set(plugin.id, plugin as ChartPlugin<unknown, unknown, unknown>);
}

export function getPlugin(id: string): ChartPlugin<unknown, unknown, unknown> | undefined {
  return plugins.get(id);
}

export function listPlugins(): string[] {
  return [...plugins.keys()];
}

/** Convenience: register a plugin and immediately return its id. */
export function registerAndGetId<TData, TTheme, TConfig>(
  plugin: ChartPlugin<TData, TTheme, TConfig>,
): string {
  registerPlugin(plugin);
  return plugin.id;
}

/**
 * Test-only: clears every registered plugin. Not re-exported from
 * `src/core/index.ts` or the top-level `src/index.ts` barrel — the plugin
 * registry is shared, mutable module state, and a way to wipe it has no
 * place in the public API. Import it directly from this module in test
 * setup (`beforeEach`) instead of relying on hand-picked unique plugin ids
 * for cross-test isolation.
 */
export function __resetRegistryForTests(): void {
  plugins.clear();
}
