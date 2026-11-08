> Historical document — the project was renamed from VizBox to Lumagrid in Phase 5.

# Nivo Adapter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `createNivoPlugin`, a third reference `ChartPlugin` adapter (after D3 and Recharts), so a caller can register any Nivo chart component with VizBox's plugin registry.

**Architecture:** A single new file, `src/plugins/nivo-adapter.ts`, exporting a `nivoThemeAdapter` (maps VizBox `ThemeDefinition` → a `NivoTheme` shaped like Nivo's real nested `theme` prop) and `createNivoPlugin` (wraps a caller-supplied `Renderer` + required `dataAdapter` into a `ChartPlugin`). No new npm dependency — same convention as `d3-adapter.tsx` and `recharts-adapter.ts`, which don't import `d3`/`recharts` either.

**Tech Stack:** TypeScript (strict), Vitest, React 18. No new dependencies.

## Global Constraints

- No new npm dependency (no `@nivo/*` package added to `package.json`, source or dev).
- `dataAdapter` on `createNivoPlugin` is required — no default implementation (spec decision: Nivo chart types disagree too much on data shape for a safe guess).
- `NivoTheme` mirrors Nivo's real nested `theme`-prop shape (`background`, `text`, `axis.{domain,ticks,legend}`, `grid`, `tooltip`) plus a top-level `colors: string[]` convenience field — not a flat token bag.
- `tsc -p tsconfig.esm.json --noEmit` and `tsc -p tsconfig.cjs.json --noEmit` must both stay at 0 errors after every task.
- `npm test` (vitest) must stay green after every task.
- Full spec: `docs/superpowers/specs/2026-08-06-nivo-adapter-design.md`.

---

### Task 1: `nivoThemeAdapter` + `createNivoPlugin`

**Files:**
- Create: `src/plugins/nivo-adapter.ts`
- Test: `src/plugins/__tests__/nivo-adapter.test.ts`

**Interfaces:**
- Consumes: `ChartPlugin<TData, TTheme, TConfig>`, `RendererProps<TData, TTheme, TConfig>` from `src/registry/types.ts`; `ThemeDefinition` from `src/theme/types.ts`; `TransformedData` from `src/transforms/types.ts`.
- Produces: `NivoTheme` (interface), `nivoThemeAdapter(theme: ThemeDefinition): NivoTheme`, `NivoPluginOptions<TData, TConfig>` (interface), `createNivoPlugin<TData, TConfig>(options: NivoPluginOptions<TData, TConfig>): ChartPlugin<TData, NivoTheme, TConfig>`. Later tasks (2, 3) import all four names from `./nivo-adapter.js`.

- [ ] **Step 1: Write the failing test**

Create `src/plugins/__tests__/nivo-adapter.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { nivoThemeAdapter, createNivoPlugin } from '../nivo-adapter.js';
import type { ThemeDefinition } from '../../theme/types.js';
import type { TransformedData } from '../../transforms/types.js';

const fakeTheme: ThemeDefinition = {
  name: 'fake',
  colors: {
    categorical: ['#111111', '#222222'],
    sequential: ['#333333'],
    diverging: ['#444444'],
  },
  typography: {
    fontFamily: 'Fake Sans',
    fontSizeBase: '14px',
    fontSizeSm: '11px',
    fontSizeLg: '16px',
    fontWeightNormal: 400,
    fontWeightBold: 700,
    lineHeight: 1.4,
  },
  spacing: { base: 8, xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  surface: {
    background: '#aaaaaa',
    surface: '#bbbbbb',
    border: '#cccccc',
    borderRadius: '4px',
    shadowSm: 'none',
    shadowMd: 'none',
  },
  text: {
    primary: '#000001',
    secondary: '#000002',
    disabled: '#000003',
    inverse: '#ffffff',
  },
};

describe('nivoThemeAdapter', () => {
  const result = nivoThemeAdapter(fakeTheme);

  it('maps background from surface.background', () => {
    expect(result.background).toBe('#aaaaaa');
  });

  it('maps text fontFamily, fontSize, and fill', () => {
    expect(result.text).toEqual({ fontFamily: 'Fake Sans', fontSize: 11, fill: '#000002' });
  });

  it('maps axis domain/ticks/legend from surface.border and text tokens', () => {
    expect(result.axis).toEqual({
      domain: { line: { stroke: '#cccccc' } },
      ticks: { line: { stroke: '#cccccc' }, text: { fill: '#000002', fontSize: 11 } },
      legend: { text: { fill: '#000001', fontSize: 11 } },
    });
  });

  it('maps grid line stroke from surface.border', () => {
    expect(result.grid).toEqual({ line: { stroke: '#cccccc' } });
  });

  it('maps tooltip container from surface.surface and text.primary', () => {
    expect(result.tooltip).toEqual({
      container: { background: '#bbbbbb', color: '#000001', fontSize: 11 },
    });
  });

  it('maps colors from colors.categorical', () => {
    expect(result.colors).toEqual(['#111111', '#222222']);
  });

  it('parses fontSizeSm string into a numeric fontSize', () => {
    expect(typeof result.text.fontSize).toBe('number');
  });
});

describe('createNivoPlugin', () => {
  const data: TransformedData = { rows: [], fields: [] };

  it('passes dataAdapter through unchanged', () => {
    const dataAdapter = (d: TransformedData) => d.rows.length;
    const plugin = createNivoPlugin({
      id: 'nivo-test',
      dataAdapter,
      Renderer: () => null,
    });
    expect(plugin.dataAdapter).toBe(dataAdapter);
    expect(plugin.dataAdapter(data)).toBe(0);
  });

  it('passes Renderer through unchanged', () => {
    const Renderer = () => null;
    const plugin = createNivoPlugin({
      id: 'nivo-test-2',
      dataAdapter: (d) => d.rows,
      Renderer,
    });
    expect(plugin.Renderer).toBe(Renderer);
  });

  it('defaults label to id when no label is given', () => {
    const plugin = createNivoPlugin({
      id: 'nivo-test-3',
      dataAdapter: (d) => d.rows,
      Renderer: () => null,
    });
    expect(plugin.label).toBe('nivo-test-3');
  });

  it('uses the provided label when given', () => {
    const plugin = createNivoPlugin({
      id: 'nivo-test-4',
      label: 'My Nivo Chart',
      dataAdapter: (d) => d.rows,
      Renderer: () => null,
    });
    expect(plugin.label).toBe('My Nivo Chart');
  });

  it('uses nivoThemeAdapter as the themeAdapter', () => {
    const plugin = createNivoPlugin({
      id: 'nivo-test-5',
      dataAdapter: (d) => d.rows,
      Renderer: () => null,
    });
    expect(plugin.themeAdapter(fakeTheme)).toEqual(nivoThemeAdapter(fakeTheme));
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/plugins/__tests__/nivo-adapter.test.ts`
Expected: FAIL — `Cannot find module '../nivo-adapter.js'` (or `.ts`) because the file doesn't exist yet.

- [ ] **Step 3: Write minimal implementation**

Create `src/plugins/nivo-adapter.ts`:

```ts
import type React from 'react';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';

/**
 * Theme tokens shaped to match Nivo's own nested `theme` prop, so callers
 * can pass this straight through to a Nivo component with no reshaping.
 * Covers the fields most Nivo charts read (background, text, axis, grid,
 * tooltip) — not Nivo's full theme surface (no legends/markers/crosshair/
 * dots; override those directly on the Nivo component if needed).
 */
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
  /** Convenience: pass straight to Nivo's separate `colors` prop. */
  colors: string[];
}

/** Shared theme adapter for all Nivo plugins. */
export function nivoThemeAdapter(theme: ThemeDefinition): NivoTheme {
  const fontSize = parseInt(theme.typography.fontSizeSm, 10);
  return {
    background: theme.surface.background,
    text: {
      fontFamily: theme.typography.fontFamily,
      fontSize,
      fill: theme.text.secondary,
    },
    axis: {
      domain: { line: { stroke: theme.surface.border } },
      ticks: {
        line: { stroke: theme.surface.border },
        text: { fill: theme.text.secondary, fontSize },
      },
      legend: { text: { fill: theme.text.primary, fontSize } },
    },
    grid: { line: { stroke: theme.surface.border } },
    tooltip: {
      container: {
        background: theme.surface.surface,
        color: theme.text.primary,
        fontSize,
      },
    },
    colors: theme.colors.categorical,
  };
}

export interface NivoPluginOptions<TData, TConfig = Record<string, unknown>> {
  id: string;
  label?: string;
  /** Reshape TransformedData into whatever structure this Nivo chart expects. */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  Renderer: React.ComponentType<RendererProps<TData, NivoTheme, TConfig>>;
}

/**
 * Creates a ChartPlugin backed by a declarative Nivo component.
 * The NivoTheme is derived automatically from the VizBox ThemeDefinition.
 *
 * @example
 * ```tsx
 * import { ResponsiveBar } from '@nivo/bar';
 * import { createNivoPlugin, registerPlugin } from 'vizbox/plugins';
 *
 * registerPlugin(createNivoPlugin({
 *   id: 'nivo-bar',
 *   label: 'Bar (Nivo)',
 *   dataAdapter: (data) => data.rows,
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <div style={{ width, height }}>
 *       <ResponsiveBar
 *         data={data}
 *         keys={[config?.dataKey ?? 'value']}
 *         indexBy={config?.nameKey ?? 'name'}
 *         theme={theme}
 *         colors={theme.colors}
 *       />
 *     </div>
 *   ),
 * }));
 * ```
 */
export function createNivoPlugin<TData, TConfig = Record<string, unknown>>(
  options: NivoPluginOptions<TData, TConfig>,
): ChartPlugin<TData, NivoTheme, TConfig> {
  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: options.dataAdapter,
    themeAdapter: nivoThemeAdapter,
    Renderer: options.Renderer,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/plugins/__tests__/nivo-adapter.test.ts`
Expected: PASS, all 12 tests.

- [ ] **Step 5: Typecheck**

Run: `npm run typecheck && npx tsc -p tsconfig.cjs.json --noEmit`
Expected: 0 errors on both.

- [ ] **Step 6: Commit**

```bash
git add src/plugins/nivo-adapter.ts src/plugins/__tests__/nivo-adapter.test.ts
git commit -m "Add createNivoPlugin adapter

Third reference ChartPlugin adapter (after D3, Recharts), per
docs/superpowers/specs/2026-08-06-nivo-adapter-design.md. No new
dependency — caller supplies their own Nivo component via Renderer,
same convention as d3-adapter.tsx/recharts-adapter.ts."
```

---

### Task 2: Wire barrel exports

**Files:**
- Modify: `src/plugins/index.ts`
- Modify: `src/index.ts`

**Interfaces:**
- Consumes: `createNivoPlugin`, `nivoThemeAdapter`, `NivoTheme`, `NivoPluginOptions` from `./nivo-adapter.js` (Task 1).
- Produces: `createNivoPlugin`, `nivoThemeAdapter`, `NivoTheme`, `NivoPluginOptions` importable from `vizbox/plugins`; `createNivoPlugin`, `NivoTheme` importable from `vizbox` (top-level).

- [ ] **Step 1: Update `src/plugins/index.ts`**

Current content:

```ts
export { createD3Plugin } from './d3-adapter.js';
export type { D3Theme, D3PluginOptions } from './d3-adapter.js';

export { createRechartsPlugin, rechartsThemeAdapter } from './recharts-adapter.js';
export type { RechartsTheme, RechartsRow, RechartsConfig } from './recharts-adapter.js';
```

New content:

```ts
export { createD3Plugin } from './d3-adapter.js';
export type { D3Theme, D3PluginOptions } from './d3-adapter.js';

export { createRechartsPlugin, rechartsThemeAdapter } from './recharts-adapter.js';
export type { RechartsTheme, RechartsRow, RechartsConfig } from './recharts-adapter.js';

export { createNivoPlugin, nivoThemeAdapter } from './nivo-adapter.js';
export type { NivoTheme, NivoPluginOptions } from './nivo-adapter.js';
```

- [ ] **Step 2: Update `src/index.ts`**

Find the existing plugin-layer export block (currently reads):

```ts
export { createD3Plugin, createRechartsPlugin } from './plugins/index.js';
export type { D3Theme, RechartsTheme, RechartsConfig } from './plugins/index.js';
```

Replace with:

```ts
export { createD3Plugin, createRechartsPlugin, createNivoPlugin } from './plugins/index.js';
export type { D3Theme, RechartsTheme, RechartsConfig, NivoTheme } from './plugins/index.js';
```

- [ ] **Step 3: Verify typecheck and full test suite**

Run: `npm run typecheck && npx tsc -p tsconfig.cjs.json --noEmit && npm test`
Expected: 0 errors both configs; all tests pass (35 total: 23 existing + 12 from Task 1).

- [ ] **Step 4: Commit**

```bash
git add src/plugins/index.ts src/index.ts
git commit -m "Export createNivoPlugin from plugins and top-level barrels"
```

---

### Task 3: README section

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `createNivoPlugin`, `registerPlugin` (already exported from `vizbox` per Task 2 and existing barrel).
- Produces: none (documentation only).

- [ ] **Step 1: Insert new section**

In `README.md`, the existing "Plugging in a Recharts chart" section ends right before `## Writing a custom plugin from scratch`:

```
---

## Writing a custom plugin from scratch
```

Insert a new section between that `---` and the `## Writing a custom plugin from scratch` heading:

```markdown
---

## Plugging in a Nivo chart

```tsx
import { ResponsiveBar } from '@nivo/bar';
import { createNivoPlugin, registerPlugin } from 'vizbox';

registerPlugin(createNivoPlugin({
  id: 'nivo-bar',
  label: 'Bar (Nivo)',
  dataAdapter: (data) => data.rows,
  Renderer: ({ data, theme, width, height, config }) => (
    <div style={{ width, height }}>
      <ResponsiveBar
        data={data}
        keys={[config?.dataKey ?? 'value']}
        indexBy={config?.nameKey ?? 'name'}
        theme={theme}
        colors={theme.colors}
      />
    </div>
  ),
}));
```

`createNivoPlugin` requires `dataAdapter` — Nivo chart types disagree too much on
data shape (bar wants flat rows, pie wants `{id, value}[]`, line wants
`{id, data: [{x,y}]}[]`) for a safe default. The `NivoTheme` passed to `Renderer`
mirrors Nivo's own `theme` prop shape (`background`, `text`, `axis`, `grid`,
`tooltip`), plus a `colors` array for Nivo's separate `colors` prop — pass both
straight through with no reshaping.

---
```

- [ ] **Step 2: Verify the build still succeeds**

Run: `npm run build`
Expected: exits 0 (README changes don't affect compilation, but this confirms nothing else broke).

- [ ] **Step 3: Clean up build output**

Run: `rm -rf dist`

(`dist/` is a build artifact, not committed — matches existing repo convention.)

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "Document Nivo plugin usage in README"
```

---

### Task 4: Update planning docs and final verification

**Files:**
- Modify: `.planning/HANDOFF.json`
- Modify: `.planning/phases/01-plugin-architecture/.continue-here.md`

**Interfaces:**
- Consumes: none (documentation only).
- Produces: none.

- [ ] **Step 1: Update `.planning/phases/01-plugin-architecture/.continue-here.md`**

In the `<remaining_work>` section, change:

```
- Consider adding a `nivo` adapter (`src/plugins/nivo-adapter.ts`) as another reference implementation
```

to:

```
- ~~Consider adding a `nivo` adapter (`src/plugins/nivo-adapter.ts`) as another reference implementation~~ — done 2026-08-06, see `docs/superpowers/specs/2026-08-06-nivo-adapter-design.md`
```

- [ ] **Step 2: Update `.planning/HANDOFF.json`**

Update the `context_notes` field to append: `"Nivo adapter (createNivoPlugin) added 2026-08-06 as third reference ChartPlugin implementation, with unit tests for nivoThemeAdapter/createNivoPlugin."` (concatenate onto the existing string, keeping valid JSON).

- [ ] **Step 3: Full verification**

Run in order:

```bash
npm run typecheck
npx tsc -p tsconfig.cjs.json --noEmit
npm test
npm run build
rm -rf dist
```

Expected: every command exits 0; `npm test` reports all tests passing (35 total).

- [ ] **Step 4: Commit**

```bash
git add .planning/HANDOFF.json .planning/phases/01-plugin-architecture/.continue-here.md
git commit -m "Update planning docs: Nivo adapter complete"
```

- [ ] **Step 5: Push**

```bash
git push
```
