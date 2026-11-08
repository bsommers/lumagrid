> Historical document — the project was renamed from VizBox to Lumagrid in Phase 5.

# Nivo Adapter Design

**Date:** 2026-08-06
**Status:** Approved

## Context

The plugin architecture refactor (`da94f7a`, phase `01-plugin-architecture`) made adding a
new chart library a matter of writing one adapter file and calling `registerPlugin`. Two
reference adapters exist: `src/plugins/d3-adapter.tsx` (imperative `mount`/`update`/`destroy`
lifecycle, for D3) and `src/plugins/recharts-adapter.ts` (declarative `Renderer` component,
with an auto-detecting default `dataAdapter`, for Recharts). The 2026-08-05 codebase review
suggested a Nivo adapter as a third reference implementation, to prove the plugin contract
generalizes beyond the two chart libraries it was designed against.

Neither existing adapter imports its target library — the caller supplies their own chart
component (`Renderer` prop) or drawing callbacks (`mount`/`update`/`destroy`), and the
adapter only handles reshaping VizBox's `TransformedData`/`ThemeDefinition` into what that
library expects. The Nivo adapter follows the same convention: no new npm dependency.

## Decisions

1. **`dataAdapter` is required, with no default.** Recharts' auto-detected flat-row default
   works because most Recharts charts read a similar row shape. Nivo chart types disagree
   sharply on data shape (bar wants flat rows, pie wants `{id, value}[]`, line wants
   `{id, data: [{x,y}]}[]`), so guessing a default would silently produce broken charts for
   most chart types. This matches `createD3Plugin`, which also requires `dataAdapter`.

2. **`NivoTheme` mirrors Nivo's real nested `theme` prop shape**, rather than being a flat
   token bag like `D3Theme`/`RechartsTheme`. D3 has no formal theme prop (you paint SVG
   yourself) and Recharts components take individual style props, so a flat bag is the
   right fit there. Nivo is different: every Nivo chart accepts one `theme` object prop
   with a specific nested shape. Producing that shape directly means callers can pass it
   straight through (`<ResponsiveBar theme={theme} colors={theme.colors} />`) with no
   manual reshaping. The adapter covers the common subset most charts read — `background`,
   `text`, `axis` (`domain`/`ticks`/`legend`), `grid`, `tooltip` — not Nivo's full theme
   surface (no `legends`, `markers`, `crosshair`, `dots`, `labels`, `sliceTooltip`; those
   are rarer per-chart knobs a caller can still override directly on the Nivo component).
   `colors: string[]` is included as a top-level convenience field (Nivo takes `colors` as
   a separate prop from `theme`, not nested inside it).

3. **Unit tests are added**, matching the TDD approach used for the registry/ViewSwitcher
   tests earlier in this project, even though the two existing adapters (`d3-adapter.tsx`,
   `recharts-adapter.ts`) currently have none. This is new code, so tests are written first.

## API

`src/plugins/nivo-adapter.ts`:

```ts
export interface NivoTheme {
  background: string;
  text: { fontFamily: string; fontSize: number; fill: string };
  axis: {
    domain: { line: { stroke: string } };
    ticks: { line: { stroke: string }; text: { fill: string; fontSize: number } };
    legend: { text: { fill: string; fontSize: number } };
  };
  grid: { line: { stroke: string } };
  tooltip: { container: { background: string; color: string; fontSize: number } };
  colors: string[];
}

/** Shared theme adapter for all Nivo plugins. */
export function nivoThemeAdapter(theme: ThemeDefinition): NivoTheme;

export interface NivoPluginOptions<TData, TConfig = Record<string, unknown>> {
  id: string;
  label?: string;
  /** Reshape TransformedData into whatever structure this Nivo chart expects. */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  Renderer: React.ComponentType<RendererProps<TData, NivoTheme, TConfig>>;
}

/** Creates a ChartPlugin backed by a declarative Nivo component. */
export function createNivoPlugin<TData, TConfig = Record<string, unknown>>(
  options: NivoPluginOptions<TData, TConfig>,
): ChartPlugin<TData, NivoTheme, TConfig>;
```

`nivoThemeAdapter` maps `ThemeDefinition` fields onto the shape above. One conversion
detail: VizBox's `typography.fontSizeSm` is a CSS string (`'12px'`) but Nivo's theme wants
a bare number, so the adapter does `parseInt(theme.typography.fontSizeSm, 10)`.

## Wiring

- `src/plugins/index.ts` exports `createNivoPlugin`, `nivoThemeAdapter`, and types
  `NivoTheme`, `NivoPluginOptions` — mirroring how the D3/Recharts adapters are re-exported.
- `src/index.ts` (top-level barrel) exports `createNivoPlugin` and the `NivoTheme` type only
  — matching the existing precedent where `D3PluginOptions`/`rechartsThemeAdapter` are
  available from `vizbox/plugins` but not re-exported at the top level.

## Testing

`src/plugins/__tests__/nivo-adapter.test.ts`:
- `nivoThemeAdapter` maps each `ThemeDefinition` field to the correct `NivoTheme` field
  (background, text color/font/size, axis stroke/tick/legend colors, grid stroke, tooltip
  container colors, `colors` array).
- `createNivoPlugin` passes `dataAdapter` and `Renderer` through unchanged.
- `createNivoPlugin` defaults `label` to `id` when no label is given.

Written and run RED (failing, since `nivo-adapter.ts` doesn't exist yet) before the
implementation is written, then GREEN once it exists — following this project's TDD
convention.

## Documentation

`README.md` gains a "Plugging in a Nivo chart" section between the existing "Plugging in a
D3 chart" / "Plugging in a Recharts chart" sections and "Writing a custom plugin from
scratch", using `@nivo/bar`'s `ResponsiveBar` as the worked example, matching the style of
the existing two sections exactly. (The README's intro line already promises Nivo support:
"Plug in any chart library — built-in SVG charts, D3, Recharts, Nivo, or your own.")

## Out of scope

- No `@nivo/*` package is added as a dependency (source or dev) — the adapter is
  library-agnostic like its two siblings, and the test suite exercises it with a fake
  `Renderer`, not a real Nivo component.
- No pre-registered `nivoBarPlugin` instance (unlike `src/viz/plugins.ts`'s native
  pre-built plugins) — `createD3Plugin`/`createRechartsPlugin` ship as factories only, and
  this follows the same precedent.
- No Victory adapter or demo app — separate follow-on ideas, not part of this task.
