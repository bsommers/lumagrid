[← Project README](../../README.md)

# Bring your own engine

This chapter writes a complete chart plugin for an engine Lumagrid has never heard of, registers it, and proves it with the conformance kit in `lumagrid/testing`. The engine is a few lines of plain SVG layout, so you need no new dependency; the steps are the same for a canvas library, a WebGL scene or a charting package from npm.

## Contents

- [What you will build](#what-you-will-build)
- [Step 1: the engine](#step-1-the-engine)
- [Step 2: the plugin](#step-2-the-plugin)
- [Step 3: register and draw it](#step-3-register-and-draw-it)
- [Step 4: prove it with the kit](#step-4-prove-it-with-the-kit)
- [The eight checks](#the-eight-checks)
- [Options](#options)
- [Skipping a check](#skipping-a-check)
- [Using the kit in your test runner](#using-the-kit-in-your-test-runner)

## What you will build

A plugin with the id `tinyplot` that draws one vertical bar per row. Along the way you meet every part of the [ChartPlugin contract](./plugins-and-adapters.md#the-chartplugin-contract): `dataAdapter`, `themeAdapter`, `Renderer`, the registry, and the size, theme and accessibility rules a plugin is expected to follow. The kit turns those expectations into checks you can run in any test runner.

## Step 1: the engine

An engine is whatever code actually draws. Keep it free of Lumagrid types so you can test and reuse it on its own. Tinyplot is one function that turns labelled numbers and a pixel size into rectangles.

<!-- snippet: byo-engine#engine -->

```tsx
// "Tinyplot", a plain-SVG engine small enough to read in one sitting. It knows nothing about
// Lumagrid: it takes labelled numbers and a pixel size and returns the rectangles to draw.
export interface TinyBar {
  label: string;
  value: number;
}

export interface TinyRect {
  label: string;
  value: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function layoutBars(bars: TinyBar[], width: number, height: number, gap = 6): TinyRect[] {
  const max = Math.max(...bars.map((b) => b.value), 1);
  const slot = width / Math.max(bars.length, 1);
  return bars.map((bar, i) => {
    const barHeight = (bar.value / max) * (height - 20);
    return {
      ...bar,
      x: i * slot + gap / 2,
      y: height - 20 - barHeight,
      width: Math.max(slot - gap, 1),
      height: barHeight,
    };
  });
}
```

## Step 2: the plugin

The plugin is the adapter between Lumagrid and the engine. `dataAdapter` reshapes `TransformedData` into the engine's input, `themeAdapter` picks the theme tokens the engine paints with, and `Renderer` (capital R) draws. Three habits keep a plugin well behaved, and the kit checks each of them:

- Never change the data you receive. Build new arrays and objects.
- Use `width` and `height` from the props, not a fixed size.
- Give the output an accessible name: `aria-label`, `aria-labelledby`, a `title` attribute or a `<title>` element.

<!-- snippet: byo-engine#plugin -->

```tsx
import type { ChartPlugin, TransformedData } from 'lumagrid';

// What the theme adapter hands to the renderer: only the tokens Tinyplot paints with.
export interface TinyTheme {
  bar: string;
  text: string;
  fontFamily: string;
}

// The per-view config the plugin understands.
export interface TinyConfig {
  labelKey?: string;
  valueKey?: string;
}

export const tinyPlugin: ChartPlugin<TinyBar[], TinyTheme, TinyConfig> = {
  id: 'tinyplot',
  label: 'Tinyplot',

  // Read the data, never change it: the rows may be shared with other views.
  dataAdapter(data: TransformedData, config?: TinyConfig): TinyBar[] {
    const labelKey = config?.labelKey ?? data.fields.find((f) => f.type === 'string')?.key ?? '';
    const valueKey = config?.valueKey ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
    return data.rows.map((row) => ({
      label: String(row[labelKey] ?? ''),
      value: Number(row[valueKey] ?? 0),
    }));
  },

  // Different themes must give different tokens, or the plugin ignores light and dark.
  themeAdapter(theme): TinyTheme {
    return {
      bar: theme.colors.categorical[0] ?? '#3b82f6',
      text: theme.text.primary,
      fontFamily: theme.typography.fontFamily,
    };
  },

  Renderer({ data, theme, width, height }) {
    const rects = layoutBars(data, width, height);
    return (
      // role and aria-label give assistive technology a name for the chart; the size comes from
      // the props, so the chart follows its container.
      <svg width={width} height={height} role="img" aria-label={`Bar chart of ${data.length} values`}>
        {rects.map((r) => (
          <g key={r.label}>
            <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={theme.bar}>
              <title>{`${r.label}: ${r.value}`}</title>
            </rect>
            <text x={r.x + r.width / 2} y={height - 5} textAnchor="middle" fill={theme.text} fontFamily={theme.fontFamily} fontSize={11}>
              {r.label}
            </text>
          </g>
        ))}
      </svg>
    );
  },
};
```

## Step 3: register and draw it

Call `registerPlugin` once at startup, then name the plugin's id in a view. This is the same path every built-in chart takes. See [the registry](./plugins-and-adapters.md#the-registry).

<!-- snippet: byo-engine#register -->

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, registerPlugin } from 'lumagrid';

// Register once at startup. The call returns the id.
registerPlugin(tinyPlugin);

const sales: TransformedData = {
  rows: [
    { region: 'North', revenue: 12000 },
    { region: 'South', revenue: 14200 },
    { region: 'East', revenue: 9300 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'revenue', type: 'number' },
  ],
};

export function Example() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer data={sales} title="Tinyplot" width={500} height={300}>
        {(data, width, height) => (
          <ViewSwitcher views={[{ id: 'tinyplot' }]} data={data} width={width} height={height} />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

## Step 4: prove it with the kit

`lumagrid/testing` ships `checkPluginConformance(plugin, options?)`, which returns a report, and `assertPluginConformance(plugin, options?)`, which throws when anything fails. Neither imports a test framework, so they work in vitest, jest, node:test or a plain script. Install nothing extra: the kit renders with `react-dom`, which you already have.

<!-- snippet: byo-engine-check#check -->

```ts
import { assertPluginConformance, checkPluginConformance } from 'lumagrid/testing';
import { tinyPlugin } from './byo-engine.js';

// Inspect the structured report...
export const report = checkPluginConformance(tinyPlugin);
// report.ok is true; report.checks lists { id, title, status, detail } for all eight checks.

// ...or assert, which throws an Error naming every failed check. Call it from any test runner.
export function proveTinyplot() {
  assertPluginConformance(tinyPlugin);
}
```

The report looks like this, shortened to two entries:

```text
{
  ok: true,
  checks: [
    { id: 'shape', title: 'Plugin has a valid id, label and members', status: 'pass', detail: 'id "tinyplot" and the three functions are present' },
    { id: 'respects-size', title: 'Output responds to width and height', status: 'pass', detail: 'output changes with width and height' },
    // ...six more
  ]
}
```

When a plugin breaks a rule, `assertPluginConformance` names the check and says why. Here a renderer that draws a fixed, unlabelled rectangle:

```text
Plugin "tinyplot" failed 2 conformance check(s):
  - respects-size: Output responds to width and height
      output is identical at 320x200 and 640x400; the renderer ignores width and height
  - accessible-name: Output exposes an accessible name
      no accessible name found: add aria-label (or aria-labelledby, title or a <title> element) to the rendered root
```

Fix the renderer (use `width` and `height`, add `role="img"` and an `aria-label`) and run again.

## The eight checks

| Id | What it proves |
|----|----------------|
| `shape` | `id` is a non-empty string, `label` (if present) is a non-empty string, `dataAdapter` and `themeAdapter` are functions and `Renderer` is a React component. If this fails, the remaining checks are skipped. |
| `renders-sample` | The adapters and the renderer run on `sampleData` without throwing. |
| `renders-empty` | The same with `emptyData`: the sample fields and zero rows. |
| `respects-size` | The output at 320x200 differs from the output at 640x400, so the renderer reacts to `width` and `height`. |
| `accessible-name` | The output has a non-empty `aria-label` or `aria-labelledby`, a `title` attribute, or a `<title>` element. |
| `deterministic` | Two renders of the same input give identical markup. React `useId` values and Recharts' global `recharts12-clip` style ids are renumbered first, so they do not count as differences; random numbers, dates and other counters do. |
| `no-mutation` | The adapters and the renderer run on a deep-frozen copy of the data and leave it unchanged. |
| `theme-switch` | The plugin renders with `lightTheme` and `darkTheme`, and the theme adapter or the markup differs between them. |

`sampleData` and `emptyData` are exported from `lumagrid/testing` if you want to reuse them in your own tests. `sampleData` has five rows (`region`, `revenue`, `group`), plus a small `hierarchy` and a `geo` collection so tree and map plugins have input.

## Options

| Option | Default | Meaning |
|--------|---------|---------|
| `data` | `sampleData` | The `TransformedData` for the sample checks. |
| `config` | none | The per-view config passed to both adapters and the renderer. |
| `width`, `height` | 320, 200 | The size of the first render. The size check also renders at twice that. |
| `wrapper` | none | A component wrapped around the renderer, for plugins that need a context provider such as `CollapseManager`. |
| `mode` | `dom` when `document` exists, else `server` | `dom` mounts into a detached container so effects run (an imperative D3 `mount` runs); `server` uses `renderToStaticMarkup`. |
| `skip` | none | A map from check id to the reason it is skipped. |

## Skipping a check

Some rules do not fit every plugin. A fixed-size badge legitimately ignores `width`. Skip the check and write down why; the report keeps the reason and `ok` stays true:

`checkPluginConformance(badgePlugin, { skip: { 'respects-size': 'fixed 24px badge by design' } })`

Prefer fixing the plugin. The library's own tests skip exactly one check: `TreeView` renders `role="tree"` with no accessible name, so the native `tree` plugin skips `accessible-name` until the chart gains a label.

## Using the kit in your test runner

Put one test per plugin next to the plugin and call `assertPluginConformance` inside it. The thrown message is the report, so a failing run tells you what to fix. Plugins that need a provider take it through `wrapper`. The kit is marked experimental (`@beta` and `@experimental` in the API report), so the report shape may grow in a minor release; see [Stability](../STABILITY.md).

Next: [Plugins and adapters](./plugins-and-adapters.md) covers the D3, Recharts and Nivo factories, all of which pass the kit.
