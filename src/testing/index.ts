import type { ComponentType, ReactNode } from 'react';
import type { ChartPlugin } from '../registry/types.js';
import { lightTheme } from '../theme/light.js';
import { darkTheme } from '../theme/dark.js';
import type { TransformedData } from '../transforms/types.js';
import { emptyData, sampleData } from './fixtures.js';
import { renderToMarkup } from './render.js';
import type { RenderMode } from './render.js';

export { sampleData, emptyData } from './fixtures.js';

/**
 * Outcome of one conformance check.
 *
 * @beta
 * @experimental
 */
export type ConformanceStatus = 'pass' | 'fail' | 'skip';

/**
 * One entry of a {@link ConformanceReport}.
 *
 * @beta
 * @experimental
 */
export interface ConformanceCheck {
  /** Stable machine id, one of `shape`, `renders-sample`, `renders-empty`, `respects-size`, `accessible-name`, `deterministic`, `no-mutation`, `theme-switch`. */
  id: string;
  /** Human-readable title. */
  title: string;
  status: ConformanceStatus;
  /** Why the check passed, failed or was skipped. */
  detail: string;
}

/**
 * Result of {@link checkPluginConformance}. `ok` is true when no check failed (skips do not fail).
 *
 * @beta
 * @experimental
 */
export interface ConformanceReport {
  ok: boolean;
  checks: ConformanceCheck[];
}

/**
 * Options for {@link checkPluginConformance} and {@link assertPluginConformance}.
 *
 * @beta
 * @experimental
 */
export interface ConformanceOptions {
  /** Data for the "sample" checks. Defaults to {@link sampleData}. */
  data?: TransformedData;
  /** Per-view config forwarded to the adapters and the renderer. */
  config?: Record<string, unknown>;
  /** Width of the first render. Default 320. The size check also renders at twice this width. */
  width?: number;
  /** Height of the first render. Default 200. The size check also renders at twice this height. */
  height?: number;
  /** A component wrapped around the renderer, for plugins that need a context provider. */
  wrapper?: ComponentType<{ children?: ReactNode }>;
  /**
   * `dom` mounts into a detached container so effects run (needs a DOM such as jsdom); `server` uses
   * `renderToStaticMarkup`. Default: `dom` when `document` exists, else `server`.
   */
  mode?: 'dom' | 'server';
  /** Check ids to skip, each with the reason that is recorded in the report. */
  skip?: Record<string, string>;
}

type AnyPlugin = ChartPlugin<unknown, unknown, unknown>;

interface Ctx {
  plugin: AnyPlugin;
  data: TransformedData;
  config: Record<string, unknown> | undefined;
  width: number;
  height: number;
  wrapper: ConformanceOptions['wrapper'];
  mode: RenderMode;
}

type Outcome = { status: 'pass' | 'fail'; detail: string };

const pass = (detail: string): Outcome => ({ status: 'pass', detail });
const fail = (detail: string): Outcome => ({ status: 'fail', detail });
const errText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

function clone<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clone) as T;
  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, clone(v)])) as T;
  }
  return value;
}

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}

function render(ctx: Ctx, over: { data?: TransformedData; theme?: typeof lightTheme; width?: number; height?: number } = {}): string {
  return renderToMarkup({
    plugin: ctx.plugin,
    data: over.data ?? clone(ctx.data),
    theme: over.theme ?? lightTheme,
    width: over.width ?? ctx.width,
    height: over.height ?? ctx.height,
    config: ctx.config,
    wrapper: ctx.wrapper,
    mode: ctx.mode,
  });
}

const NAME_PATTERNS = [
  /\baria-label="[^"]*\S[^"]*"/,
  /\baria-labelledby="[^"]*\S[^"]*"/,
  /<title(\s[^>]*)?>[^<]*\S[^<]*<\/title>/,
  /\btitle="[^"]*\S[^"]*"/,
];

function isRenderable(x: unknown): boolean {
  return typeof x === 'function' || (typeof x === 'object' && x !== null && '$$typeof' in x);
}

function checkShape(ctx: Ctx): Outcome {
  const p = ctx.plugin as Partial<AnyPlugin> | null;
  const problems: string[] = [];
  if (p === null || typeof p !== 'object') return fail('plugin is not an object');
  if (typeof p.id !== 'string' || p.id.trim() === '' || p.id !== p.id.trim()) {
    problems.push('id must be a non-empty string without surrounding whitespace');
  }
  if (p.label !== undefined && (typeof p.label !== 'string' || p.label.trim() === '')) {
    problems.push('label, when present, must be a non-empty string');
  }
  if (typeof p.dataAdapter !== 'function') problems.push('dataAdapter must be a function');
  if (typeof p.themeAdapter !== 'function') problems.push('themeAdapter must be a function');
  if (!isRenderable(p.Renderer)) problems.push('Renderer must be a React component (note the capital R)');
  return problems.length === 0 ? pass(`id "${p.id}" and the three functions are present`) : fail(problems.join('; '));
}

function checkRenders(ctx: Ctx, data: TransformedData, what: string): Outcome {
  try {
    const html = render(ctx, { data: clone(data) });
    return pass(`${what} rendered ${html.length} characters of markup`);
  } catch (e) {
    return fail(`rendering ${what} threw: ${errText(e)}`);
  }
}

function checkSize(ctx: Ctx): Outcome {
  try {
    const small = render(ctx);
    const large = render(ctx, { width: ctx.width * 2, height: ctx.height * 2 });
    return small === large
      ? fail(`output is identical at ${ctx.width}x${ctx.height} and ${ctx.width * 2}x${ctx.height * 2}; the renderer ignores width and height`)
      : pass('output changes with width and height');
  } catch (e) {
    return fail(`rendering at two sizes threw: ${errText(e)}`);
  }
}

function checkName(ctx: Ctx): Outcome {
  try {
    const html = render(ctx);
    return NAME_PATTERNS.some((re) => re.test(html))
      ? pass('output carries an aria-label, aria-labelledby, title attribute or <title> element')
      : fail('no accessible name found: add aria-label (or aria-labelledby, title or a <title> element) to the rendered root');
  } catch (e) {
    return fail(`rendering threw: ${errText(e)}`);
  }
}

function checkDeterministic(ctx: Ctx): Outcome {
  try {
    const a = render(ctx);
    const b = render(ctx);
    return a === b ? pass('two renders of the same input are identical') : fail('two renders of the same input produced different markup (random ids, timestamps or Math.random in output?)');
  } catch (e) {
    return fail(`rendering threw: ${errText(e)}`);
  }
}

function checkMutation(ctx: Ctx): Outcome {
  const frozen = deepFreeze(clone(ctx.data));
  const before = JSON.stringify(frozen);
  try {
    render(ctx, { data: frozen });
  } catch (e) {
    return fail(`threw on deep-frozen input (it probably mutates its input): ${errText(e)}`);
  }
  return JSON.stringify(frozen) === before ? pass('input data is unchanged after the adapters and the renderer ran') : fail('input data changed');
}

function checkTheme(ctx: Ctx): Outcome {
  try {
    const light = render(ctx, { theme: lightTheme });
    const dark = render(ctx, { theme: darkTheme });
    const a = JSON.stringify(ctx.plugin.themeAdapter(lightTheme, ctx.config));
    const b = JSON.stringify(ctx.plugin.themeAdapter(darkTheme, ctx.config));
    if (a === b && light === dark) {
      return fail('light and dark themes produce identical adapted themes and markup; the plugin ignores the theme');
    }
    return pass('renders with both themes and reacts to the switch');
  } catch (e) {
    return fail(`rendering with the light or dark theme threw: ${errText(e)}`);
  }
}

const CHECKS: Array<{ id: string; title: string; run: (ctx: Ctx, d: TransformedData) => Outcome }> = [
  { id: 'shape', title: 'Plugin has a valid id, label and members', run: checkShape },
  { id: 'renders-sample', title: 'Renders sample data without throwing', run: (c, d) => checkRenders(c, d, 'sample data') },
  { id: 'renders-empty', title: 'Renders empty data without throwing', run: (c) => checkRenders(c, emptyData, 'empty data') },
  { id: 'respects-size', title: 'Output responds to width and height', run: checkSize },
  { id: 'accessible-name', title: 'Output exposes an accessible name', run: checkName },
  { id: 'deterministic', title: 'Two renders of the same input match', run: checkDeterministic },
  { id: 'no-mutation', title: 'Does not mutate the input data', run: checkMutation },
  { id: 'theme-switch', title: 'Handles switching between light and dark themes', run: checkTheme },
];

/**
 * Runs the conformance checks against a plugin and returns a structured report. It never throws
 * for a misbehaving plugin; failures are reported as `fail` entries.
 *
 * Checks: `shape`, `renders-sample`, `renders-empty`, `respects-size`, `accessible-name`,
 * `deterministic`, `no-mutation` and `theme-switch`. When `shape` fails the remaining checks are skipped.
 *
 * @example
 * ```ts
 * const report = checkPluginConformance(myPlugin);
 * if (!report.ok) console.table(report.checks);
 * ```
 *
 * @beta
 * @experimental
 */
export function checkPluginConformance<TData, TTheme, TConfig>(plugin: ChartPlugin<TData, TTheme, TConfig>, options: ConformanceOptions = {}): ConformanceReport {
  const ctx: Ctx = {
    plugin: plugin as unknown as AnyPlugin,
    data: options.data ?? sampleData,
    config: options.config,
    width: options.width ?? 320,
    height: options.height ?? 200,
    wrapper: options.wrapper,
    mode: options.mode ?? (typeof document === 'undefined' ? 'server' : 'dom'),
  };
  const skip = options.skip ?? {};
  let shapeOk = true;
  const checks = CHECKS.map(({ id, title, run }): ConformanceCheck => {
    const reason = skip[id];
    if (reason !== undefined) return { id, title, status: 'skip', detail: `skipped: ${reason}` };
    if (id !== 'shape' && !shapeOk) return { id, title, status: 'skip', detail: 'skipped: the shape check failed' };
    const outcome = run(ctx, ctx.data);
    if (id === 'shape' && outcome.status === 'fail') shapeOk = false;
    return { id, title, ...outcome };
  });
  return { ok: checks.every((c) => c.status !== 'fail'), checks };
}

/**
 * Like {@link checkPluginConformance} but throws an `Error` listing every failed check when the
 * plugin does not conform. Returns the report when it does.
 *
 * @beta
 * @experimental
 */
export function assertPluginConformance<TData, TTheme, TConfig>(plugin: ChartPlugin<TData, TTheme, TConfig>, options?: ConformanceOptions): ConformanceReport {
  const report = checkPluginConformance(plugin, options);
  if (!report.ok) {
    const id = (plugin as { id?: unknown } | null)?.id;
    const lines = report.checks.filter((c) => c.status === 'fail').map((c) => `  - ${c.id}: ${c.title}\n      ${c.detail}`);
    throw new Error(`Plugin "${String(id)}" failed ${lines.length} conformance check(s):\n${lines.join('\n')}`);
  }
  return report;
}
