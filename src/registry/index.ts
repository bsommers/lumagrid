import type { ChartPlugin } from './types.js';

// Minimal module-local ambient declaration: `@types/node` is not a dependency
// and `process` does not exist in browsers. Emits no code and does not leak
// into the declaration output.
declare const process: { env: { NODE_ENV?: string } } | undefined;

// Single module-level registry — the only one in the codebase.
const plugins = new Map<string, ChartPlugin<unknown, unknown, unknown>>();

/**
 * Registers a chart plugin under its `id` and returns that id.
 *
 * Registering an id that already exists replaces the earlier plugin. Outside
 * production a `console.warn` is emitted (the replacement is expected under
 * hot reload); in production, and wherever `process` is undefined, it is silent.
 *
 * @public
 */
export function registerPlugin<TData, TTheme, TConfig>(
  plugin: ChartPlugin<TData, TTheme, TConfig>,
): string {
  if (plugins.has(plugin.id) && typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[uitoolbox] Plugin "${plugin.id}" is already registered; replacing the earlier registration. ` +
        'This is expected under hot reload.',
    );
  }
  plugins.set(plugin.id, plugin as ChartPlugin<unknown, unknown, unknown>);
  return plugin.id;
}

/**
 * Returns the plugin registered under `id`, or `undefined`.
 *
 * @public
 */
export function getPlugin(id: string): ChartPlugin<unknown, unknown, unknown> | undefined {
  return plugins.get(id);
}

/**
 * Lists the ids of all registered plugins.
 *
 * @public
 */
export function listPlugins(): string[] {
  return [...plugins.keys()];
}

/**
 * Registers a plugin and returns its id.
 *
 * @deprecated Use {@link registerPlugin}, which now returns the id. Kept until 2.0.
 * @public
 */
export function registerAndGetId<TData, TTheme, TConfig>(
  plugin: ChartPlugin<TData, TTheme, TConfig>,
): string {
  return registerPlugin(plugin);
}

/**
 * Test-only: clears every registered plugin. Not re-exported from
 * `src/core/index.ts` or the top-level `src/index.ts` barrel — the plugin
 * registry is shared, mutable module state, and a way to wipe it has no
 * place in the public API. Import it directly from this module in test
 * setup (`beforeEach`) instead of relying on hand-picked unique plugin ids
 * for cross-test isolation.
 *
 * @internal
 */
export function __resetRegistryForTests(): void {
  plugins.clear();
}
