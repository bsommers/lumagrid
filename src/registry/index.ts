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
