# VizBox — Complete Rebuild Specification

**Generated:** 2026-08-23
**Purpose:** This document contains everything needed to reconstruct the VizBox codebase from nothing — in a different session, with a different AI model, or by hand. It is self-contained: it does not assume access to this repository's git history or any prior conversation. Every file's full, exact, current source is included verbatim, along with the reasoning behind non-obvious decisions and a list of real bugs that were found and fixed during a QA pass, so they are not reintroduced.

**How to use this document:** Follow section order. Sections 7 onward give exact file paths and complete file contents, grouped by architectural layer, in dependency order (each layer only depends on layers listed before it). Copy each file's content verbatim into the stated path. Section 15 lists five specific bugs that existed in earlier versions of this code and were fixed — the fixes are already baked into the source given here, but they're called out explicitly because the "obvious" naive implementation of several functions reintroduces them. Section 18 gives exact commands and exact expected output (test counts, etc.) to confirm a rebuild is correct.

---

## 1. What VizBox Is

VizBox is a layered React + TypeScript library for data-visualization widgets. It works with tabular, hierarchical, geographic, and time-series data, and it can render that data through built-in SVG chart components or through a plugin adapter for any external chart library (D3, Recharts, Nivo, or a hand-written one). Version `0.1.0`, MIT licensed, published as `vizbox` on npm (package scope in some historical config was `@vizbox/vizbox`, but the shipped `package.json` name is `vizbox`).

The core idea: a small, framework-agnostic **plugin contract** (`ChartPlugin<TData, TTheme, TConfig>`) sits between VizBox's normalized data/theme representation and whatever a specific chart library needs. A dispatcher component (`ViewSwitcher`) knows nothing about D3, Recharts, or SVG internals — it only calls three things on the active plugin: `dataAdapter`, `themeAdapter`, and `Renderer`. Adding a new chart library is: write one adapter file, call `registerPlugin` once.

---

## 2. Non-Negotiable Design Rules

These rules were established during the original build and reinforced during a later architecture refactor. Violating them is a regression, not a stylistic choice.

1. **Strict layering.** Each layer may only import from layers listed below it in the dependency order (Section 5). The transform layer has **zero React dependencies** — it must remain usable in a plain Node/Deno script with no DOM.
2. **No `any`, no `as unknown` type-erasure.** The one narrow exception is the single `as` cast inside `TransformPipeline.run` (documented inline, see Section 8) to bridge the "first step accepts raw `unknown`, later steps accept `TransformedData`" contract — this is a deliberate, commented, single-site cast, not a pattern to repeat elsewhere.
3. **Every file has one clear responsibility.** No file should casually exceed ~200 lines; if one does, it's a signal to split it.
4. **All props are fully typed with exported interfaces.** No default exports except React components themselves (and even those are named-exported as `export function ComponentName`, never `export default`).
5. **No runtime dependency beyond `react`/`react-dom`.** D3, Recharts, and Nivo are never imported by VizBox's own source — the three adapters in `src/plugins/` are **dependency-free**: the caller supplies their own chart library component/calls, and the adapter only reshapes data and theme. This is why `package.json` never lists `d3`, `recharts`, or any `@nivo/*` package as a dependency of any kind, even though three adapter files exist for them.
6. **TypeScript strict mode, plus `exactOptionalPropertyTypes` and `noUncheckedIndexedAccess`.** Both are on in `tsconfig.json` and must stay on — they catch real bugs (e.g. forgetting that `array[i]` can be `undefined`).
7. **TDD for new behavior; tests document existing behavior when back-filling coverage.** When adding a test for code that already exists and is believed correct, it's fine for the test to pass immediately — that's expected, not a violation. When fixing a bug, write the failing test first.

---

## 3. Tech Stack

- **Language:** TypeScript 5.4+, strict mode
- **UI framework:** React 18+ (peer dependency, not a direct dependency)
- **Module system:** ESM primary (`"type": "module"`), with a parallel CommonJS build for `require()` consumers
- **Test runner:** Vitest 1.6, `jsdom` environment, `@testing-library/react` + `@testing-library/jest-dom`
- **Build:** raw `tsc` (two passes — one ESM, one CJS — no bundler; this is a library, not an app)
- **CI:** GitHub Actions, Node 20
- **Alternate runtime target:** Deno is also supported via `deno.json` (typecheck + a subset of tests), reflecting the "no framework dependency beyond React" design goal — the transform layer in particular should run fine under Deno since it's plain TypeScript with no Node-specific or browser-specific APIs.

---

## 4. Full Directory Tree

```
vizbox/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .gitignore
├── LICENSE
├── README.md
├── REBUILD.md                          ← this document
├── deno.json
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.esm.json
├── tsconfig.cjs.json
├── vitest.config.ts
├── vitest.setup.ts
└── src/
    ├── index.ts                        ← top-level public barrel
    ├── transforms/                     ← Layer 1 (no React)
    │   ├── types.ts
    │   ├── flatten.ts
    │   ├── aggregate.ts
    │   ├── pivot.ts
    │   ├── group-by.ts
    │   ├── geo-normalize.ts
    │   ├── pipeline.ts
    │   ├── index.ts
    │   └── __tests__/
    │       ├── flatten.test.ts
    │       ├── aggregate.test.ts
    │       └── pipeline.test.ts
    ├── theme/                          ← Layer 2
    │   ├── types.ts
    │   ├── light.ts
    │   ├── dark.ts
    │   ├── color-scale.ts
    │   ├── provider.tsx
    │   └── index.ts
    ├── registry/                       ← Layer 3
    │   ├── types.ts
    │   ├── index.ts
    │   ├── native-plugin.tsx
    │   └── __tests__/
    │       ├── index.test.ts
    │       └── native-plugin.test.tsx
    ├── core/                           ← Layer 4
    │   ├── container.tsx
    │   ├── view-switcher.tsx
    │   ├── collapse-manager.tsx
    │   ├── index.ts
    │   └── __tests__/
    │       ├── container.test.tsx
    │       ├── view-switcher.test.tsx
    │       └── view-switcher-adapters.test.tsx
    ├── viz/                            ← Layer 5 (built-in SVG charts)
    │   ├── types.ts                     (unused — reproduce as-is, see Section 12)
    │   ├── data-table.tsx
    │   ├── horizontal-bar-chart.tsx
    │   ├── line-chart.tsx
    │   ├── pie-chart.tsx
    │   ├── choropleth.tsx
    │   ├── force-graph.tsx
    │   ├── tree-view.tsx
    │   ├── plugins.ts
    │   └── index.ts
    └── plugins/                        ← Layer 6 (external chart-library adapters)
        ├── d3-adapter.tsx
        ├── recharts-adapter.ts
        ├── nivo-adapter.ts
        ├── index.ts
        └── __tests__/
            ├── d3-adapter.test.tsx
            ├── recharts-adapter.test.ts
            └── nivo-adapter.test.ts
```

11 test files, 82 tests total (exact count verified in Section 18).

---

## 5. Layering Rules (Dependency Order)

```
transforms/   (no React; pure data functions)
    ↑
theme/        (React context; imports nothing else in src/)
    ↑
registry/     (imports transforms/types, theme/types — the ChartPlugin contract)
    ↑
core/         (imports theme, transforms, registry — WidgetContainer, ViewSwitcher, CollapseManager)
    ↑
viz/          (imports registry's NativeChartProps, theme/color-scale — the 7 built-in charts)
    ↑
plugins/      (imports registry/types, theme/types, transforms/types — D3/Recharts/Nivo adapters)
```

`viz/` and `plugins/` are siblings, not stacked — neither imports the other. `src/index.ts` (the top-level barrel) imports from all of them and re-exports a curated public surface.

---

## 6. Build Order

Build in this order; each step produces something independently typecheckable and (from step 2 onward) testable before moving on.

1. **Scaffold.** Create `package.json`, `deno.json`, `tsconfig.json` + `tsconfig.esm.json` + `tsconfig.cjs.json`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `LICENSE`, `.github/workflows/ci.yml`. Install devDependencies (Section 7 has exact versions). No `src/` yet.
2. **Transform layer** (`src/transforms/`): `types.ts` first (no logic, just interfaces), then `flatten.ts`, `aggregate.ts`, `pivot.ts`, `group-by.ts`, `geo-normalize.ts`, `pipeline.ts`, then `index.ts` barrel. Write each `__tests__/*.test.ts` alongside its module. This layer has zero React — get it fully green before touching anything else.
3. **Theme layer** (`src/theme/`): `types.ts`, `light.ts`, `dark.ts`, `color-scale.ts`, `provider.tsx`, `index.ts`.
4. **Registry layer** (`src/registry/`): `types.ts` (the `ChartPlugin` contract — this is the most important interface in the whole codebase), `index.ts` (the module-level plugin map), `native-plugin.tsx`. Tests alongside.
5. **Core layer** (`src/core/`): `container.tsx`, `view-switcher.tsx`, `collapse-manager.tsx`, `index.ts`. Tests alongside — `view-switcher.test.tsx` needs fake plugins (pattern shown in Section 10), and `container.test.tsx` needs a fake `ResizeObserver` since `jsdom` doesn't implement one (Section 11 explains why).
6. **Viz layer** (`src/viz/`): the 7 native SVG components, then `plugins.ts` (wraps each in `createNativePlugin`), then `index.ts`.
7. **Plugins layer** (`src/plugins/`): `d3-adapter.tsx`, `recharts-adapter.ts`, `nivo-adapter.ts`, `index.ts`. Tests alongside.
8. **Top-level barrel** (`src/index.ts`): curated re-export of all public surface.
9. **README.md** (Section 17 has the full, final text).
10. **Verify** (Section 18): typecheck both tsconfig targets, run the full test suite, run the build, confirm exact counts.

---

## 7. Package Configuration Files (verbatim)

### `package.json`

```json
{
  "name": "vizbox",
  "version": "0.1.0",
  "description": "Layered React + TypeScript UI library for data visualization widgets",
  "type": "module",
  "main": "./dist/cjs/index.cjs",
  "module": "./dist/esm/index.js",
  "types": "./dist/esm/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/esm/index.js",
      "require": "./dist/cjs/index.cjs",
      "types": "./dist/esm/index.d.ts"
    },
    "./transforms": {
      "import": "./dist/esm/transforms/index.js",
      "require": "./dist/cjs/transforms/index.cjs",
      "types": "./dist/esm/transforms/index.d.ts"
    },
    "./theme": {
      "import": "./dist/esm/theme/index.js",
      "require": "./dist/cjs/theme/index.cjs",
      "types": "./dist/esm/theme/index.d.ts"
    },
    "./viz": {
      "import": "./dist/esm/viz/index.js",
      "require": "./dist/cjs/viz/index.cjs",
      "types": "./dist/esm/viz/index.d.ts"
    },
    "./plugins": {
      "import": "./dist/esm/plugins/index.js",
      "require": "./dist/cjs/plugins/index.cjs",
      "types": "./dist/esm/plugins/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsc -p tsconfig.esm.json && tsc -p tsconfig.cjs.json",
    "build:esm": "tsc -p tsconfig.esm.json",
    "build:cjs": "tsc -p tsconfig.cjs.json",
    "typecheck": "tsc -p tsconfig.esm.json --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "peerDependencies": {
    "react": ">=18.0.0",
    "react-dom": ">=18.0.0"
  },
  "peerDependenciesMeta": {
    "d3": {
      "optional": true
    }
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^15.0.0",
    "@types/d3": "^7.4.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.0.0",
    "jsdom": "^29.1.1",
    "typescript": "^5.4.0",
    "vitest": "^1.6.0"
  },
  "keywords": [
    "react",
    "visualization",
    "charts",
    "dataviz",
    "ui-library",
    "deno"
  ],
  "license": "MIT"
}
```

Note: `peerDependenciesMeta` only lists `d3` as an optional peer, not `recharts` or `@nivo/*` — this is a pre-existing minor inconsistency (the Recharts and Nivo adapters are equally dependency-free and equally "optional peer" in spirit) that was never fixed; it doesn't affect behavior since none of the three are actually imported by VizBox's own source. Reproduce it as-is unless deliberately fixing it.

### `deno.json`

```json
{
  "name": "@vizbox/vizbox",
  "version": "0.1.0",
  "exports": {
    ".": "./src/index.ts",
    "./transforms": "./src/transforms/index.ts",
    "./theme": "./src/theme/index.ts",
    "./viz": "./src/viz/index.ts",
    "./plugins": "./src/plugins/index.ts"
  },
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  },
  "imports": {
    "react": "npm:react@^18.3.0",
    "react/jsx-runtime": "npm:react@^18.3.0/jsx-runtime",
    "react-dom": "npm:react-dom@^18.3.0"
  },
  "tasks": {
    "typecheck": "deno check src/index.ts src/transforms/index.ts src/theme/index.ts src/viz/index.ts src/plugins/index.ts",
    "test": "deno test --allow-read src/transforms/__tests__/"
  }
}
```

Note the package name differs between `package.json` (`vizbox`, what's actually published to npm) and `deno.json` (`@vizbox/vizbox`, a scoped name for JSR/Deno-style resolution) — this is intentional, not a typo; the two registries have different naming conventions.

### `tsconfig.json` (base config)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src"],
  "exclude": ["src/**/__tests__", "dist"]
}
```

### `tsconfig.esm.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist/esm"
  }
}
```

### `tsconfig.cjs.json`

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist/cjs",
    "declaration": false,
    "declarationMap": false
  }
}
```

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
  },
});
```

### `vitest.setup.ts`

```ts
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// vitest.config.ts doesn't set test.globals, so @testing-library/react
// can't auto-detect a global afterEach to clean up after itself — without
// this, unmounted DOM from every earlier test in a file stays in the
// document and leaks into later tests' queries (e.g. queryAllByRole).
afterEach(() => {
  cleanup();
});
```

**This file is not optional.** Without it, `@testing-library/react` never calls `cleanup()` between tests in the same file (because `vitest.config.ts` doesn't set `test.globals: true`, so RTL can't auto-detect a global `afterEach`). Every test's rendered DOM leaks into the next test in the same file. Assertions that check a specific `data-testid` still pass by coincidence, but anything that counts elements across the whole document (`queryAllByRole`, etc.) silently over-counts. This was discovered the hard way — see Section 15, bug 5.

### `.gitignore`

```
node_modules/
dist/
*.tsbuildinfo
```

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

### `LICENSE`

```
MIT License

Copyright (c) 2026 Bill Sommers

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Additional devDependencies installed but not yet reflected above if starting from an older snapshot: run `npm install -D jsdom @testing-library/jest-dom` if `vitest.config.ts`'s `jsdom` environment or `vitest.setup.ts`'s `@testing-library/jest-dom/vitest` import fail to resolve.

---

## 8. Layer 1 — Transforms (`src/transforms/`)

Pure data functions. No React import anywhere in this directory. Every transform operates on `TransformedData` (or produces it from raw input) and is either a `DataTransform` (accepts raw `unknown` input — currently only `flatten`) or a `ChainableTransform` (accepts already-`TransformedData` input — everything else).

### `src/transforms/types.ts`

```ts
/**
 * A row of data with string keys and primitive values.
 */
export type DataRow = Record<string, string | number | boolean | null>;

/**
 * The normalized output produced by any transform.
 * `rows` is always present; `hierarchy` and `geo` are populated by specific transforms.
 */
export interface TransformedData {
  rows: DataRow[];
  fields: FieldMeta[];
  hierarchy?: HierarchyNode;
  geo?: GeoData;
  meta?: Record<string, unknown>;
}

export interface FieldMeta {
  key: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  label?: string;
}

export interface HierarchyNode {
  id: string;
  label: string;
  value?: number;
  children?: HierarchyNode[];
  data?: DataRow;
}

export interface GeoData {
  type: 'FeatureCollection';
  features: GeoFeature[];
}

export interface GeoFeature {
  type: 'Feature';
  id: string;
  properties: Record<string, string | number | null>;
  geometry: {
    type: string;
    coordinates: unknown;
  };
}

/**
 * A stateless, pure data transformation.
 * TIn defaults to unknown so callers can pass raw data from any source.
 */
export interface DataTransform<TIn = unknown, TOptions = Record<string, unknown>> {
  readonly name: string;
  transform(data: TIn, options?: TOptions): TransformedData;
}

/**
 * A transform that accepts already-transformed data (used in pipelines after the first step).
 */
export interface ChainableTransform<TOptions = Record<string, unknown>> {
  readonly name: string;
  transform(data: TransformedData, options?: TOptions): TransformedData;
}
```

### `src/transforms/flatten.ts`

**Behavioral notes before the code — read these first, they explain two lines that look arbitrary:**
- `value instanceof Date` is checked **before** the generic-object recursion branch. If you omit this check, a `Date` value matches `typeof value === 'object' && !Array.isArray(value)` and the code recurses into it via `Object.entries(dateInstance)`, which is `[]` (a `Date`'s timestamp is not an own enumerable property) — the field silently vanishes from the output row with no error. This was a real bug (Section 15, bug 1). The fix converts it to an ISO string instead.
- `inferType`'s date-detection guards with `isNaN(Number(v))` **before** trying `Date.parse(v)`. `Date.parse` alone is far more permissive than expected — 4-digit strings like `"2020"` parse as valid dates (interpreted as a year). Without the `Number(v)` guard first, an ordinary numeric-string column gets misclassified as `'date'`. This was a real bug (Section 15, bug 2).

```ts
import type { DataRow, DataTransform, FieldMeta, TransformedData } from './types.js';

export interface FlattenOptions {
  /** Separator used when joining nested key paths. Default: '.' */
  separator?: string;
}

function flattenObject(
  obj: Record<string, unknown>,
  prefix: string,
  separator: string,
  result: DataRow,
): void {
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}${separator}${key}` : key;
    if (value instanceof Date) {
      result[fullKey] = value.toISOString();
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      flattenObject(value as Record<string, unknown>, fullKey, separator, result);
    } else if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[fullKey] = value;
    } else {
      result[fullKey] = String(value);
    }
  }
}

function inferType(values: Array<string | number | boolean | null>): FieldMeta['type'] {
  const nonNull = values.filter((v) => v !== null);
  if (nonNull.every((v) => typeof v === 'number')) return 'number';
  if (nonNull.every((v) => typeof v === 'boolean')) return 'boolean';
  if (
    nonNull.every(
      (v) => typeof v === 'string' && isNaN(Number(v)) && !isNaN(Date.parse(v)),
    )
  )
    return 'date';
  return 'string';
}

function deriveFields(rows: DataRow[]): FieldMeta[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0] ?? {});
  return keys.map((key) => ({
    key,
    type: inferType(rows.map((r) => r[key] ?? null)),
  }));
}

/**
 * Flattens an array of nested objects into a flat array of DataRows.
 */
export const flatten: DataTransform<unknown[], FlattenOptions> = {
  name: 'flatten',
  transform(data, options = {}): TransformedData {
    const separator = options.separator ?? '.';
    const rows: DataRow[] = data.map((item) => {
      const result: DataRow = {};
      if (item !== null && typeof item === 'object' && !Array.isArray(item)) {
        flattenObject(item as Record<string, unknown>, '', separator, result);
      }
      return result;
    });
    return { rows, fields: deriveFields(rows) };
  },
};
```

**Behavior that is correct-as-is and deliberately not "fixed":** arrays and `undefined` values fall through to the final `else` branch and get `String()`-coerced (e.g. `[1,2,3]` → `"1,2,3"`, `undefined` → `"undefined"`). This is intentional and locked in by tests — don't special-case them.

### `src/transforms/__tests__/flatten.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { flatten } from '../flatten.js';

describe('flatten', () => {
  it('flattens a nested object', () => {
    const result = flatten.transform([{ a: { b: 1, c: { d: 2 } } }]);
    expect(result.rows).toEqual([{ 'a.b': 1, 'a.c.d': 2 }]);
  });

  it('uses a custom separator', () => {
    const result = flatten.transform([{ a: { b: 1 } }], { separator: '_' });
    expect(result.rows[0]).toHaveProperty('a_b', 1);
  });

  it('handles null values', () => {
    const result = flatten.transform([{ a: null }]);
    expect(result.rows[0]).toHaveProperty('a', null);
  });

  it('handles flat objects without nesting', () => {
    const result = flatten.transform([{ x: 1, y: 'hello' }]);
    expect(result.rows[0]).toEqual({ x: 1, y: 'hello' });
  });

  it('returns empty rows for empty input', () => {
    const result = flatten.transform([]);
    expect(result.rows).toHaveLength(0);
    expect(result.fields).toHaveLength(0);
  });

  it('infers field types correctly', () => {
    const result = flatten.transform([{ count: 5, name: 'foo', active: true }]);
    const types = Object.fromEntries(result.fields.map((f) => [f.key, f.type]));
    expect(types['count']).toBe('number');
    expect(types['name']).toBe('string');
    expect(types['active']).toBe('boolean');
  });

  it('converts Date values to ISO strings instead of dropping them', () => {
    const date = new Date('2024-03-15T10:30:00.000Z');
    const result = flatten.transform([{ createdAt: date, name: 'x' }]);
    expect(result.rows[0]).toEqual({ createdAt: '2024-03-15T10:30:00.000Z', name: 'x' });
  });

  it('stringifies array values via String()', () => {
    const result = flatten.transform([{ tags: [1, 2, 3] }]);
    expect(result.rows[0]).toEqual({ tags: '1,2,3' });
  });

  it('stringifies undefined values', () => {
    const result = flatten.transform([{ a: undefined }]);
    expect(result.rows[0]).toEqual({ a: 'undefined' });
  });

  it('infers date type for real date strings', () => {
    const result = flatten.transform([{ createdAt: '2024-03-15T10:30:00.000Z' }]);
    const types = Object.fromEntries(result.fields.map((f) => [f.key, f.type]));
    expect(types['createdAt']).toBe('date');
  });

  it('does not misclassify year-like numeric strings as dates', () => {
    const result = flatten.transform([{ year: '2020' }, { year: '1999' }]);
    const types = Object.fromEntries(result.fields.map((f) => [f.key, f.type]));
    expect(types['year']).toBe('string');
  });
});
```

### `src/transforms/aggregate.ts`

```ts
import type { ChainableTransform, DataRow, FieldMeta, TransformedData } from './types.js';

export type AggregationFn = 'sum' | 'avg' | 'min' | 'max' | 'count' | 'first' | 'last';

export interface AggregateOptions {
  groupBy: string[];
  aggregations: Record<string, AggregationFn>;
}

function applyAgg(values: number[], fn: AggregationFn): number {
  if (values.length === 0) return 0;
  switch (fn) {
    case 'sum':
      return values.reduce((a, b) => a + b, 0);
    case 'avg':
      return values.reduce((a, b) => a + b, 0) / values.length;
    case 'min':
      return Math.min(...values);
    case 'max':
      return Math.max(...values);
    case 'count':
      return values.length;
    case 'first':
      return values[0] ?? 0;
    case 'last':
      return values[values.length - 1] ?? 0;
  }
}

function groupKey(row: DataRow, keys: string[]): string {
  return keys.map((k) => String(row[k] ?? '')).join('\x00');
}

/**
 * Groups rows and applies aggregation functions to numeric fields.
 */
export const aggregate: ChainableTransform<AggregateOptions> = {
  name: 'aggregate',
  transform(data, options): TransformedData {
    if (!options) return data;
    const { groupBy: groupKeys, aggregations } = options;

    const groups = new Map<string, DataRow[]>();
    for (const row of data.rows) {
      const key = groupKey(row, groupKeys);
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    const rows: DataRow[] = [];
    for (const bucket of groups.values()) {
      const representative = bucket[0] ?? {};
      const result: DataRow = {};
      for (const k of groupKeys) {
        result[k] = representative[k] ?? null;
      }
      for (const [field, fn] of Object.entries(aggregations)) {
        if (fn === 'count') {
          result[field] = bucket.length;
        } else {
          const values = bucket
            .map((r) => r[field])
            .filter((v): v is number => typeof v === 'number');
          result[field] = applyAgg(values, fn);
        }
      }
      rows.push(result);
    }

    const fields: FieldMeta[] = [
      ...groupKeys.map((k) => ({ key: k, type: 'string' as const })),
      ...Object.keys(aggregations).map((k) => ({ key: k, type: 'number' as const })),
    ];

    return { ...data, rows, fields };
  },
};
```

**Deliberate behavior, not a bug:** if a group's field has zero numeric values (e.g. the field is missing on every row in that bucket), `applyAgg` returns `0` silently rather than `null` or throwing. This is documented and locked in by a test, not fixed — unlike the Recharts adapter's analogous case (Section 15, bug 3), which does warn. The QA plan that produced this codebase's current test suite explicitly scoped this one as "add a test for" rather than "fix," and that decision should be preserved unless a human explicitly revisits it.

### `src/transforms/__tests__/aggregate.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { aggregate } from '../aggregate.js';
import type { TransformedData } from '../types.js';

const base: TransformedData = {
  rows: [
    { region: 'East', sales: 100, returns: 5 },
    { region: 'East', sales: 200, returns: 10 },
    { region: 'West', sales: 150, returns: 3 },
  ],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
    { key: 'returns', type: 'number' },
  ],
};

describe('aggregate', () => {
  it('groups rows and sums a field', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'sum' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(300);
  });

  it('counts rows per group', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'count' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(2);
  });

  it('computes average', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'avg' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(150);
  });

  it('returns original data when no options provided', () => {
    const result = aggregate.transform(base, undefined);
    expect(result).toBe(base);
  });

  it('computes min and max', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'min' },
    });
    expect(result.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(100);

    const maxResult = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'max' },
    });
    expect(maxResult.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(200);
  });

  it('computes first and last, respecting row order within a group', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'first' },
    });
    expect(result.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(100);

    const lastResult = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'last' },
    });
    expect(lastResult.rows.find((r) => r['region'] === 'East')?.['sales']).toBe(200);
  });

  it('groups by multiple keys at once', () => {
    const data: TransformedData = {
      rows: [
        { region: 'East', category: 'A', sales: 100 },
        { region: 'East', category: 'A', sales: 50 },
        { region: 'East', category: 'B', sales: 20 },
        { region: 'West', category: 'A', sales: 10 },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'category', type: 'string' },
        { key: 'sales', type: 'number' },
      ],
    };
    const result = aggregate.transform(data, {
      groupBy: ['region', 'category'],
      aggregations: { sales: 'sum' },
    });
    expect(result.rows).toHaveLength(3);
    const eastA = result.rows.find((r) => r['region'] === 'East' && r['category'] === 'A');
    const eastB = result.rows.find((r) => r['region'] === 'East' && r['category'] === 'B');
    const westA = result.rows.find((r) => r['region'] === 'West' && r['category'] === 'A');
    expect(eastA?.['sales']).toBe(150);
    expect(eastB?.['sales']).toBe(20);
    expect(westA?.['sales']).toBe(10);
  });

  it('applies multiple aggregations in the same call', () => {
    const result = aggregate.transform(base, {
      groupBy: ['region'],
      aggregations: { sales: 'sum', returns: 'avg' },
    });
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(300);
    expect(east?.['returns']).toBe(7.5);
  });

  it('silently aggregates to 0 when a group has no numeric values for the field', () => {
    const data: TransformedData = {
      rows: [
        { region: 'East', sales: 100 },
        { region: 'West', note: 'no sales data for this row' },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'sales', type: 'number' },
      ],
    };
    const result = aggregate.transform(data, {
      groupBy: ['region'],
      aggregations: { sales: 'sum' },
    });
    expect(result.rows.find((r) => r['region'] === 'West')?.['sales']).toBe(0);
  });
});
```

### `src/transforms/pivot.ts`

```ts
import type { ChainableTransform, DataRow, FieldMeta, TransformedData } from './types.js';

export interface PivotOptions {
  /** Field whose values become new column headers. */
  columnField: string;
  /** Field whose values populate the pivot cells. */
  valueField: string;
  /** Fields that identify each row (remain as row headers). */
  rowFields: string[];
  /** Aggregation for duplicate cell values. Default: 'first'. */
  aggregation?: 'sum' | 'first' | 'last';
}

function rowKey(row: DataRow, keys: string[]): string {
  return keys.map((k) => String(row[k] ?? '')).join('\x00');
}

/**
 * Pivots a tall/long dataset into a wide format.
 */
export const pivot: ChainableTransform<PivotOptions> = {
  name: 'pivot',
  transform(data, options): TransformedData {
    if (!options) return data;
    const { columnField, valueField, rowFields, aggregation = 'first' } = options;

    // Collect unique column values
    const columnValues = [...new Set(data.rows.map((r) => String(r[columnField] ?? '')))].sort();

    // Build: rowKey → { rowFields, columnField → [values] }
    const rowMap = new Map<string, { base: DataRow; cells: Map<string, number[]> }>();

    for (const row of data.rows) {
      const key = rowKey(row, rowFields);
      if (!rowMap.has(key)) {
        const base: DataRow = {};
        for (const f of rowFields) base[f] = row[f] ?? null;
        rowMap.set(key, { base, cells: new Map() });
      }
      const entry = rowMap.get(key)!;
      const col = String(row[columnField] ?? '');
      const val = row[valueField];
      const num = typeof val === 'number' ? val : parseFloat(String(val ?? '0'));
      const existing = entry.cells.get(col) ?? [];
      existing.push(isNaN(num) ? 0 : num);
      entry.cells.set(col, existing);
    }

    const rows: DataRow[] = [];
    for (const { base, cells } of rowMap.values()) {
      const result: DataRow = { ...base };
      for (const col of columnValues) {
        const vals = cells.get(col) ?? [];
        if (vals.length === 0) {
          result[col] = null;
        } else if (aggregation === 'sum') {
          result[col] = vals.reduce((a, b) => a + b, 0);
        } else if (aggregation === 'last') {
          result[col] = vals[vals.length - 1] ?? null;
        } else {
          result[col] = vals[0] ?? null;
        }
      }
      rows.push(result);
    }

    const fields: FieldMeta[] = [
      ...rowFields.map((k) => ({ key: k, type: 'string' as const })),
      ...columnValues.map((k) => ({ key: k, type: 'number' as const })),
    ];

    return { ...data, rows, fields };
  },
};
```

No dedicated test file exists for `pivot.ts` in the current suite — this is a known coverage gap, not an intentional omission. If extending test coverage, this is a good next target (not covered by the P0/P1/P2 QA passes described in Section 16).

### `src/transforms/group-by.ts`

Note the unusual type signature: `groupBy` is exported as a **function that returns** a `ChainableTransform`, not a `ChainableTransform` object directly (unlike every other transform in this file). This lets callers write `groupBy('region', 'revenue')` inline in a pipeline array. The `field`/`valueField` closure arguments are the primary way to configure it; the `options` parameter on `.transform()` can still override them per-call if provided (see `options?.field ?? field`).

```ts
import type { ChainableTransform, DataRow, FieldMeta, HierarchyNode, TransformedData } from './types.js';

export interface GroupByOptions {
  /** Field to group by. */
  field: string;
  /** Optional numeric field to sum as the group value. */
  valueField?: string;
  /** Label field for the root node. */
  rootLabel?: string;
}

/**
 * Groups rows by a field and produces both a flat grouped representation
 * and a two-level hierarchy (root → group children).
 */
export const groupBy: ChainableTransform<GroupByOptions> | ((field: string, valueField?: string) => ChainableTransform<GroupByOptions>) = (
  field: string,
  valueField?: string,
): ChainableTransform<GroupByOptions> => ({
  name: 'groupBy',
  transform(data, options): TransformedData {
    const resolvedField = options?.field ?? field;
    const resolvedValueField = options?.valueField ?? valueField;

    const groups = new Map<string, DataRow[]>();
    for (const row of data.rows) {
      const key = String(row[resolvedField] ?? '(blank)');
      const bucket = groups.get(key);
      if (bucket) {
        bucket.push(row);
      } else {
        groups.set(key, [row]);
      }
    }

    // Build summary rows: one per group with count + optional sum
    const rows: DataRow[] = [];
    for (const [key, bucket] of groups.entries()) {
      const summary: DataRow = { [resolvedField]: key, count: bucket.length };
      if (resolvedValueField) {
        const sum = bucket
          .map((r) => r[resolvedValueField!])
          .filter((v): v is number => typeof v === 'number')
          .reduce((a, b) => a + b, 0);
        summary[resolvedValueField] = sum;
      }
      rows.push(summary);
    }

    const fields: FieldMeta[] = [
      { key: resolvedField, type: 'string' },
      { key: 'count', type: 'number' },
      ...(resolvedValueField ? [{ key: resolvedValueField, type: 'number' as const }] : []),
    ];

    // Build hierarchy
    const children: HierarchyNode[] = [];
    for (const [key, bucket] of groups.entries()) {
      const value = resolvedValueField
        ? bucket
            .map((r) => r[resolvedValueField!])
            .filter((v): v is number => typeof v === 'number')
            .reduce((a, b) => a + b, 0)
        : bucket.length;
      const nodeData = bucket[0];
      children.push({ id: key, label: key, value, ...(nodeData !== undefined ? { data: nodeData } : {}) });
    }

    const hierarchy: HierarchyNode = {
      id: 'root',
      label: options?.rootLabel ?? resolvedField,
      children,
    };

    return { ...data, rows, fields, hierarchy };
  },
});
```

Also uncovered by a dedicated test file. Rows missing the group field fall into a `'(blank)'` bucket rather than being dropped — this is deliberate (avoids silently losing rows) and would be worth locking in with a test if extending coverage.

### `src/transforms/geo-normalize.ts`

```ts
import type { ChainableTransform, GeoData, GeoFeature, TransformedData } from './types.js';

export interface GeoNormalizeOptions {
  /**
   * Field in each row that matches a feature ID in the GeoJSON.
   * Default: 'id'
   */
  idField?: string;
  /** GeoJSON FeatureCollection to join against. */
  geoJson: GeoData;
}

/**
 * Joins tabular rows to GeoJSON features by a shared ID field,
 * copying all row properties into each feature's `properties`.
 */
export const geoNormalize: ChainableTransform<GeoNormalizeOptions> = {
  name: 'geoNormalize',
  transform(data, options): TransformedData {
    if (!options) return data;
    const { idField = 'id', geoJson } = options;

    // Build lookup: featureId → row
    const rowById = new Map<string, typeof data.rows[number]>();
    for (const row of data.rows) {
      const key = String(row[idField] ?? '');
      rowById.set(key, row);
    }

    const features: GeoFeature[] = geoJson.features.map((feature) => {
      const row = rowById.get(feature.id);
      const mergedProperties: Record<string, string | number | null> = {
        ...feature.properties,
      };
      if (row) {
        for (const [k, v] of Object.entries(row)) {
          if (v === null || typeof v === 'string' || typeof v === 'number') {
            mergedProperties[k] = v;
          } else if (typeof v === 'boolean') {
            mergedProperties[k] = v ? 1 : 0;
          }
        }
      }
      return { ...feature, properties: mergedProperties };
    });

    const geo: GeoData = { type: 'FeatureCollection', features };
    return { ...data, geo };
  },
};
```

Note booleans are coerced to `1`/`0` (not `'true'`/`'false'`) when merged into feature properties, since `GeoFeature['properties']` is typed `Record<string, string | number | null>` — no boolean allowed. Also uncovered by a dedicated test file.

### `src/transforms/pipeline.ts`

```ts
import type { TransformedData } from './types.js';

/**
 * A step in a TransformPipeline. The first step receives raw unknown input;
 * subsequent steps receive TransformedData. TransformPipeline.run never
 * passes per-step options — a step that needs configuration should close
 * over it (see the `flatten → aggregate` example in the pipeline tests).
 */
export interface PipelineStep {
  readonly name: string;
  transform(data: TransformedData): TransformedData;
}

/**
 * Composes multiple transforms into a single pass.
 *
 * The first step may handle raw unknown input if you pass a DataTransform whose
 * transform method accepts unknown. Subsequent steps receive TransformedData.
 *
 * @example
 * ```ts
 * const pipeline = new TransformPipeline([flatten, groupBy('category')]);
 * const result = pipeline.run(rawData);
 * ```
 */
export class TransformPipeline {
  private readonly steps: PipelineStep[];

  constructor(steps: PipelineStep[]) {
    if (steps.length === 0) throw new Error('TransformPipeline requires at least one step');
    this.steps = steps;
  }

  run(input: unknown): TransformedData {
    const first = this.steps[0];
    if (!first) throw new Error('No steps in pipeline');

    // Cast: the first step's transform is called with raw input.
    // DataTransform.transform accepts unknown, ChainableTransform accepts TransformedData.
    // Both are structurally compatible when called via this cast.
    let result: TransformedData = (first.transform as (data: unknown) => TransformedData)(input);

    for (const step of this.steps.slice(1)) {
      result = step.transform(result);
    }

    return result;
  }

  /** Returns the names of all steps, useful for debugging. */
  get stepNames(): string[] {
    return this.steps.map((s) => s.name);
  }
}
```

**Important — do not add an `options` parameter to `PipelineStep.transform` or to `run()`.** An earlier version had `transform(data: TransformedData, options?: Record<string, unknown>): TransformedData` on `PipelineStep`, but `run()` never actually forwarded any options to steps after the first — it was dead, untestable API surface (Section 15 discusses this alongside the five numbered bugs, though it's a dead-API-surface issue rather than a wrong-output bug). The fix was to remove the parameter, not implement forwarding. If a step needs configuration, close over it in a plain object literal, exactly as the `chains flatten → aggregate` test below does with `aggregate.transform(data, {...})` inside an inline `transform` closure.

### `src/transforms/__tests__/pipeline.test.ts`

```ts
import { describe, it, expect, vi } from 'vitest';
import { TransformPipeline } from '../pipeline.js';
import { flatten } from '../flatten.js';
import { aggregate } from '../aggregate.js';

describe('TransformPipeline', () => {
  it('runs a single transform', () => {
    const pipeline = new TransformPipeline([flatten]);
    const result = pipeline.run([{ a: { b: 1 } }]);
    expect(result.rows[0]).toHaveProperty('a.b', 1);
  });

  it('chains flatten → aggregate', () => {
    const pipeline = new TransformPipeline([
      flatten,
      {
        name: 'aggregate',
        transform: (data) =>
          aggregate.transform(data, {
            groupBy: ['region'],
            aggregations: { sales: 'sum' },
          }),
      },
    ]);
    const result = pipeline.run([
      { region: 'East', sales: 100 },
      { region: 'East', sales: 50 },
      { region: 'West', sales: 200 },
    ]);
    const east = result.rows.find((r) => r['region'] === 'East');
    expect(east?.['sales']).toBe(150);
  });

  it('exposes step names', () => {
    const pipeline = new TransformPipeline([flatten]);
    expect(pipeline.stepNames).toEqual(['flatten']);
  });

  it('throws when constructed with zero steps', () => {
    expect(() => new TransformPipeline([])).toThrow();
  });

  it('invokes steps after the first with only the data argument', () => {
    const second = vi.fn((data) => data);
    const pipeline = new TransformPipeline([
      flatten,
      { name: 'second', transform: second },
    ]);
    pipeline.run([{ a: 1 }]);
    expect(second).toHaveBeenCalledTimes(1);
    expect(second.mock.calls[0]).toHaveLength(1);
  });
});
```

### `src/transforms/index.ts`

```ts
export type {
  DataRow,
  DataTransform,
  ChainableTransform,
  TransformedData,
  FieldMeta,
  HierarchyNode,
  GeoData,
  GeoFeature,
} from './types.js';

export { flatten } from './flatten.js';
export type { FlattenOptions } from './flatten.js';

export { aggregate } from './aggregate.js';
export type { AggregateOptions, AggregationFn } from './aggregate.js';

export { pivot } from './pivot.js';
export type { PivotOptions } from './pivot.js';

export { groupBy } from './group-by.js';
export type { GroupByOptions } from './group-by.js';

export { geoNormalize } from './geo-normalize.js';
export type { GeoNormalizeOptions } from './geo-normalize.js';

export { TransformPipeline } from './pipeline.js';
```

---

## 9. Layer 2 — Theme (`src/theme/`)

A `ThemeDefinition` object is the single source of truth for all visual tokens (colors, typography, spacing, surfaces, text colors). `ThemeProvider` puts one in React context; `useTheme()` reads it. Chart components never read from theme directly except through this context, and plugin adapters convert `ThemeDefinition` into whatever shape their target library needs (see Layer 6).

### `src/theme/types.ts`

```ts
export interface ColorPalette {
  /** Categorical colors for series/groups (at least 8). */
  categorical: string[];
  /** Sequential scale: low → high (at least 5 stops). */
  sequential: string[];
  /** Diverging scale: low → mid → high (at least 5 stops, odd count). */
  diverging: string[];
}

export interface TypographyTokens {
  fontFamily: string;
  fontSizeBase: string;
  fontSizeSm: string;
  fontSizeLg: string;
  fontWeightNormal: number;
  fontWeightBold: number;
  lineHeight: number;
}

export interface SpacingTokens {
  /** Base unit in px. All spacing is a multiple of this. */
  base: number;
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
}

export interface SurfaceTokens {
  background: string;
  surface: string;
  border: string;
  borderRadius: string;
  shadowSm: string;
  shadowMd: string;
}

export interface TextTokens {
  primary: string;
  secondary: string;
  disabled: string;
  inverse: string;
}

export interface ThemeDefinition {
  name: string;
  colors: ColorPalette;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  surface: SurfaceTokens;
  text: TextTokens;
}
```

Note all `TypographyTokens` font-size fields (`fontSizeBase`, `fontSizeSm`, `fontSizeLg`) are **CSS strings** (`'14px'`), not bare numbers — this matters when an adapter needs a numeric pixel value (see `nivoThemeAdapter` in Layer 6, which does `parseInt(theme.typography.fontSizeSm, 10)`).

### `src/theme/light.ts`

```ts
import type { ThemeDefinition } from './types.js';

export const lightTheme: ThemeDefinition = {
  name: 'light',
  colors: {
    categorical: [
      '#4e79a7', '#f28e2b', '#e15759', '#76b7b2',
      '#59a14f', '#edc948', '#b07aa1', '#ff9da7',
    ],
    sequential: ['#f7fbff', '#c6dbef', '#6baed6', '#2171b5', '#084594'],
    diverging:  ['#d73027', '#fc8d59', '#fee090', '#91bfdb', '#4575b4'],
  },
  typography: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontSizeBase: '14px',
    fontSizeSm: '12px',
    fontSizeLg: '16px',
    fontWeightNormal: 400,
    fontWeightBold: 600,
    lineHeight: 1.5,
  },
  spacing: {
    base: 8,
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  surface: {
    background: '#ffffff',
    surface: '#f9fafb',
    border: '#e5e7eb',
    borderRadius: '6px',
    shadowSm: '0 1px 2px rgba(0,0,0,0.05)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.07)',
  },
  text: {
    primary: '#111827',
    secondary: '#6b7280',
    disabled: '#d1d5db',
    inverse: '#ffffff',
  },
};
```

### `src/theme/dark.ts`

```ts
import type { ThemeDefinition } from './types.js';

export const darkTheme: ThemeDefinition = {
  name: 'dark',
  colors: {
    categorical: [
      '#4e9af7', '#f5a442', '#f06b6d', '#4dc4be',
      '#6dbd64', '#f5d860', '#c48dc4', '#ff9da7',
    ],
    sequential: ['#08306b', '#2171b5', '#4292c6', '#9ecae1', '#deebf7'],
    diverging:  ['#4575b4', '#74add1', '#fee090', '#f46d43', '#d73027'],
  },
  typography: {
    fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
    fontSizeBase: '14px',
    fontSizeSm: '12px',
    fontSizeLg: '16px',
    fontWeightNormal: 400,
    fontWeightBold: 600,
    lineHeight: 1.5,
  },
  spacing: {
    base: 8,
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  surface: {
    background: '#111827',
    surface: '#1f2937',
    border: '#374151',
    borderRadius: '6px',
    shadowSm: '0 1px 2px rgba(0,0,0,0.3)',
    shadowMd: '0 4px 6px rgba(0,0,0,0.4)',
  },
  text: {
    primary: '#f9fafb',
    secondary: '#9ca3af',
    disabled: '#4b5563',
    inverse: '#111827',
  },
};
```

Note `dark.ts` and `light.ts` share identical `typography`/`spacing` blocks — only `colors`, `surface`, and `text` differ. Keep them in sync if either is edited.

### `src/theme/color-scale.ts`

```ts
import type { ThemeDefinition } from './types.js';

/** Returns one of the theme's categorical colors by index (wraps around). */
export function categoricalColor(theme: ThemeDefinition, index: number): string {
  const palette = theme.colors.categorical;
  return palette[index % palette.length] ?? palette[0] ?? '#4e79a7';
}

/**
 * Maps a value in [0, 1] to a color on the theme's sequential scale.
 * Uses linear interpolation between the nearest two stops.
 */
export function sequentialColor(theme: ThemeDefinition, t: number): string {
  const palette = theme.colors.sequential;
  return interpolatePalette(palette, Math.max(0, Math.min(1, t)));
}

/**
 * Maps a value in [-1, 1] to a color on the theme's diverging scale.
 * 0 maps to the midpoint, ±1 to the extremes.
 */
export function divergingColor(theme: ThemeDefinition, t: number): string {
  const palette = theme.colors.diverging;
  // Remap [-1, 1] → [0, 1]
  return interpolatePalette(palette, Math.max(0, Math.min(1, (t + 1) / 2)));
}

function interpolatePalette(palette: string[], t: number): string {
  if (palette.length === 0) return '#000000';
  if (palette.length === 1) return palette[0] ?? '#000000';

  const scaled = t * (palette.length - 1);
  const low = Math.floor(scaled);
  const high = Math.min(low + 1, palette.length - 1);
  const fraction = scaled - low;

  const c1 = hexToRgb(palette[low] ?? '#000000');
  const c2 = hexToRgb(palette[high] ?? '#000000');

  const r = Math.round(c1[0] + (c2[0] - c1[0]) * fraction);
  const g = Math.round(c1[1] + (c2[1] - c1[1]) * fraction);
  const b = Math.round(c1[2] + (c2[2] - c1[2]) * fraction);

  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  const cleaned = hex.replace('#', '');
  const full = cleaned.length === 3
    ? cleaned.split('').map((c) => c + c).join('')
    : cleaned;
  const num = parseInt(full, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

/**
 * Creates a threshold-based color mapper.
 * Values below thresholds[0] → colors[0], etc.
 */
export function thresholdScale(
  thresholds: number[],
  colors: string[],
): (value: number) => string {
  if (colors.length !== thresholds.length + 1) {
    throw new Error('colors must have one more entry than thresholds');
  }
  return (value: number) => {
    for (let i = 0; i < thresholds.length; i++) {
      if (value < (thresholds[i] ?? 0)) return colors[i] ?? '#000000';
    }
    return colors[colors.length - 1] ?? '#000000';
  };
}
```

No dedicated test file exists for `color-scale.ts` — a known coverage gap (it's computational logic, not static data, so it's a reasonable next test target; it was flagged in the original QA review but never picked up).

### `src/theme/provider.tsx`

```tsx
import React, { createContext, useContext, useMemo } from 'react';
import type { ThemeDefinition } from './types.js';
import { lightTheme } from './light.js';
import { darkTheme } from './dark.js';

const ThemeContext = createContext<ThemeDefinition>(lightTheme);

export interface ThemeProviderProps {
  /**
   * Pass a ThemeDefinition object for full control,
   * or a shorthand string: 'light' | 'dark'.
   */
  theme: ThemeDefinition | 'light' | 'dark';
  children: React.ReactNode;
}

export function ThemeProvider({ theme, children }: ThemeProviderProps): React.ReactElement {
  const resolved = useMemo<ThemeDefinition>(() => {
    if (theme === 'light') return lightTheme;
    if (theme === 'dark') return darkTheme;
    return theme;
  }, [theme]);

  return (
    <ThemeContext.Provider value={resolved}>
      {children}
    </ThemeContext.Provider>
  );
}

/** Returns the current ThemeDefinition from the nearest ThemeProvider. */
export function useTheme(): ThemeDefinition {
  return useContext(ThemeContext);
}
```

The context default is `lightTheme` — so `useTheme()` called with no `ThemeProvider` ancestor doesn't throw, it silently returns light theme. This is deliberate for library ergonomics (a consumer who forgets `<ThemeProvider>` gets a working-but-unstyled-as-expected result, not a crash).

### `src/theme/index.ts`

```ts
export type { ThemeDefinition, ColorPalette, TypographyTokens, SpacingTokens, SurfaceTokens, TextTokens } from './types.js';
export { lightTheme } from './light.js';
export { darkTheme } from './dark.js';
export { ThemeProvider, useTheme } from './provider.js';
export type { ThemeProviderProps } from './provider.js';
export { categoricalColor, sequentialColor, divergingColor, thresholdScale } from './color-scale.js';
```

---

## 10. Layer 3 — Registry (`src/registry/`)

The heart of the plugin architecture. `ChartPlugin<TData, TTheme, TConfig>` is the contract every chart integration (native or external) implements. The registry itself is a single module-level `Map` — deliberately not more sophisticated than that.

### `src/registry/types.ts`

```ts
import type React from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';

export interface RendererProps<TData, TTheme, TConfig = Record<string, unknown>> {
  data: TData;
  theme: TTheme;
  width: number;
  height: number;
  config?: TConfig;
}

export interface ChartPlugin<
  TData = unknown,
  TTheme = unknown,
  TConfig = Record<string, unknown>,
> {
  /** Unique identifier used to register and look up this plugin. */
  id: string;
  /**
   * Converts VizBox TransformedData into whatever format this library expects.
   * Called on every render when data or config changes.
   */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  /**
   * Converts VizBox ThemeDefinition into the styling tokens this library expects.
   * Called on every render when the theme changes.
   */
  themeAdapter: (theme: ThemeDefinition, config?: TConfig) => TTheme;
  /** The actual chart component. Receives adapted data and theme — no VizBox internals. */
  Renderer: React.ComponentType<RendererProps<TData, TTheme, TConfig>>;
  /** Human-readable display name for the tab strip. Defaults to id. */
  label?: string;
}

/** Per-view config stored in ViewSwitcher's views prop. */
export interface ViewSpec<TConfig = Record<string, unknown>> {
  /** Registered plugin id. */
  id: string;
  /** Optional chart-specific config forwarded to dataAdapter, themeAdapter, and Renderer. */
  config?: TConfig;
  /** Override display label for this view's tab. */
  label?: string;
}
```

### `src/registry/index.ts`

```ts
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
```

**`__resetRegistryForTests` must never be added to `src/core/index.ts` or `src/index.ts`'s explicit export lists.** Both of those barrels re-export by naming each symbol individually (never `export *`), which is what keeps this test-only function out of the public API automatically — as long as you don't explicitly add its name to those two files' export statements. This was added specifically because every test file that calls `registerPlugin` needs to reset the shared module-level `Map` between tests (Section 15, bug 5 territory — a related-but-distinct infra gap from the RTL cleanup bug).

### `src/registry/native-plugin.tsx`

```tsx
import React from 'react';
import type { ComponentType } from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { ChartPlugin, RendererProps } from './types.js';

/** Props that built-in SVG charts accept. */
export interface NativeChartProps {
  data: TransformedData;
  width: number;
  height: number;
  theme: ThemeDefinition;
  xField?: string;
  yField?: string;
  colorField?: string;
  labelField?: string;
  ariaLabel?: string;
  [key: string]: unknown;
}

export type NativeConfig = Omit<NativeChartProps, 'data' | 'width' | 'height' | 'theme'>;

/**
 * Wraps an existing VizBox native SVG chart component as a ChartPlugin.
 * Uses identity adapters — data and theme pass through unchanged.
 *
 * @example
 * registerPlugin(createNativePlugin('bar', HorizontalBarChart));
 */
export function createNativePlugin(
  id: string,
  Component: ComponentType<NativeChartProps>,
  label?: string,
): ChartPlugin<TransformedData, ThemeDefinition, NativeConfig> {
  function NativeRenderer({
    data, theme, width, height, config,
  }: RendererProps<TransformedData, ThemeDefinition, NativeConfig>): React.ReactElement {
    // config spreads first so a colliding key (e.g. a stray `data`/`width` in
    // config) can never clobber the real chart props.
    return <Component {...config} data={data} theme={theme} width={width} height={height} />;
  }
  NativeRenderer.displayName = `NativePlugin(${id})`;

  return {
    id,
    label: label ?? id,
    dataAdapter: (data) => data,
    themeAdapter: (theme) => theme,
    Renderer: NativeRenderer,
  };
}
```

**The spread order (`{...config} data={data} theme={theme} width={width} height={height}`, config first) is load-bearing — do not reverse it.** An earlier version had `<Component data={data} theme={theme} width={width} height={height} {...config} />` (config spread *last*), which meant a `config` object containing a key literally named `data`, `theme`, `width`, or `height` would silently override the real prop. TypeScript did not catch this at the call site because `NativeConfig = Omit<NativeChartProps, 'data'|'width'|'height'|'theme'>` still carries `NativeChartProps`'s `[key: string]: unknown` index signature — `Omit` removes the named properties but not the index signature's blanket permission, so a `{ data: 'whatever' }` object literal still typechecks as a valid `NativeConfig`. This was a real, demonstrated bug (Section 15, bug 4) — a test proving the collision case was written first, confirmed to fail against the old spread order, then the order was fixed.

### `src/registry/__tests__/index.test.ts`

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  registerPlugin, getPlugin, listPlugins, registerAndGetId, __resetRegistryForTests,
} from '../index.js';
import type { ChartPlugin } from '../types.js';

function fakePlugin(id: string): ChartPlugin<{ n: number }, { c: string }> {
  return {
    id,
    dataAdapter: () => ({ n: 1 }),
    themeAdapter: () => ({ c: 'red' }),
    Renderer: () => null,
  };
}

describe('registry', () => {
  beforeEach(() => {
    __resetRegistryForTests();
  });

  it('clears all registered plugins on reset', () => {
    registerPlugin(fakePlugin('registry-test-reset'));
    expect(getPlugin('registry-test-reset')).toBeDefined();

    __resetRegistryForTests();

    expect(getPlugin('registry-test-reset')).toBeUndefined();
    expect(listPlugins()).toEqual([]);
  });

  it('returns undefined for an id that was never registered', () => {
    expect(getPlugin('never-registered-plugin')).toBeUndefined();
  });

  it('makes a registered plugin retrievable by id', () => {
    const plugin = fakePlugin('registry-test-a');
    registerPlugin(plugin);
    expect(getPlugin('registry-test-a')).toBe(plugin);
  });

  it('overwrites a previous registration with the same id', () => {
    const first = fakePlugin('registry-test-b');
    const second = fakePlugin('registry-test-b');
    registerPlugin(first);
    registerPlugin(second);
    expect(getPlugin('registry-test-b')).toBe(second);
  });

  it('lists ids of registered plugins', () => {
    registerPlugin(fakePlugin('registry-test-c'));
    expect(listPlugins()).toEqual(['registry-test-c']);
  });

  it('registerAndGetId registers the plugin and returns its id', () => {
    const plugin = fakePlugin('registry-test-d');
    const id = registerAndGetId(plugin);
    expect(id).toBe('registry-test-d');
    expect(getPlugin('registry-test-d')).toBe(plugin);
  });
});
```

### `src/registry/__tests__/native-plugin.test.tsx`

```tsx
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { createNativePlugin } from '../native-plugin.js';
import type { NativeChartProps } from '../native-plugin.js';
import { lightTheme } from '../../theme/light.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = { rows: [{ x: 1 }], fields: [{ key: 'x', type: 'number' }] };

describe('createNativePlugin identity adapters', () => {
  it('dataAdapter passes TransformedData through unchanged', () => {
    const plugin = createNativePlugin('native-test-a', () => null);
    expect(plugin.dataAdapter(data)).toBe(data);
  });

  it('themeAdapter passes ThemeDefinition through unchanged', () => {
    const plugin = createNativePlugin('native-test-b', () => null);
    expect(plugin.themeAdapter(lightTheme)).toBe(lightTheme);
  });

  it('defaults label to id', () => {
    const plugin = createNativePlugin('native-test-c', () => null);
    expect(plugin.label).toBe('native-test-c');
  });

  it('uses the provided label when given', () => {
    const plugin = createNativePlugin('native-test-d', () => null, 'My Chart');
    expect(plugin.label).toBe('My Chart');
  });
});

describe('createNativePlugin Renderer', () => {
  let received: NativeChartProps[] = [];

  function Capture(props: NativeChartProps) {
    received.push(props);
    return null;
  }

  it('spreads config onto the wrapped component', () => {
    received = [];
    const plugin = createNativePlugin('native-test-e', Capture);
    render(
      <plugin.Renderer
        data={data}
        theme={lightTheme}
        width={100}
        height={50}
        config={{ xField: 'x', ariaLabel: 'my chart' }}
      />,
    );
    expect(received[0]?.xField).toBe('x');
    expect(received[0]?.ariaLabel).toBe('my chart');
  });

  it('never lets a colliding config key override the real data/theme/width/height props', () => {
    received = [];
    const plugin = createNativePlugin('native-test-f', Capture);
    const evilConfig = { data: 'clobbered', theme: 'clobbered', width: -1, height: -1 } as unknown as Record<string, unknown>;
    render(
      <plugin.Renderer data={data} theme={lightTheme} width={100} height={50} config={evilConfig} />,
    );
    expect(received[0]?.data).toBe(data);
    expect(received[0]?.theme).toBe(lightTheme);
    expect(received[0]?.width).toBe(100);
    expect(received[0]?.height).toBe(50);
  });
});
```

---

## 11. Layer 4 — Core (`src/core/`)

Three components consumers use directly: `WidgetContainer` (data pipeline + responsive sizing), `ViewSwitcher` (tab strip + plugin dispatch), `CollapseManager` (expand/collapse context for tree-shaped widgets).

### `src/core/container.tsx`

```tsx
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useTheme } from '../theme/provider.js';
import { TransformPipeline } from '../transforms/pipeline.js';
import type { ChainableTransform, DataTransform, TransformedData } from '../transforms/types.js';

type AnyTransform = DataTransform<unknown> | ChainableTransform;

export interface WidgetContainerProps {
  /**
   * Raw data to pass through the transform pipeline.
   * Can be any shape — the first transform is responsible for normalizing it.
   */
  data: unknown;
  /**
   * Optional ordered list of transforms. Applied as a pipeline.
   * If omitted, data must already conform to TransformedData.
   */
  transforms?: AnyTransform[];
  /** Container width in pixels or CSS string (e.g. '100%'). Default: '100%'. */
  width?: number | string;
  /** Container height in pixels or CSS string. Default: 400. */
  height?: number | string;
  /** Optional title rendered above the content area. */
  title?: string;
  /**
   * Render prop receives transformed data plus resolved pixel dimensions.
   * Dimensions are measured via ResizeObserver when width/height are CSS strings.
   */
  children: (transformedData: TransformedData, width: number, height: number) => React.ReactNode;
}

/**
 * WidgetContainer runs data through the transform pipeline and provides
 * the result to its children via a render prop. When width or height are
 * CSS strings, a ResizeObserver measures the container and passes pixel
 * dimensions to children.
 *
 * @example
 * <WidgetContainer data={rawRows} transforms={[flatten, groupBy('region')]}>
 *   {(data, width, height) => (
 *     <ViewSwitcher views={[{ id: 'bar' }, { id: 'table' }]} data={data} width={width} height={height} />
 *   )}
 * </WidgetContainer>
 */
export function WidgetContainer({
  data,
  transforms,
  width = '100%',
  height = 400,
  title,
  children,
}: WidgetContainerProps): React.ReactElement {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredSize, setMeasuredSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    if (typeof width === 'number' && typeof height === 'number') return;
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setMeasuredSize({ w: entry.contentRect.width, h: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const resolvedW = typeof width === 'number' ? width : (measuredSize?.w ?? 0);
  const resolvedH = typeof height === 'number' ? height : (measuredSize?.h ?? 0);

  const transformedData = useMemo<TransformedData>(() => {
    if (!transforms || transforms.length === 0) {
      return data as TransformedData;
    }
    const pipeline = new TransformPipeline(transforms);
    return pipeline.run(data);
  }, [data, transforms]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        background: theme.surface.background,
        border: `1px solid ${theme.surface.border}`,
        borderRadius: theme.surface.borderRadius,
        boxShadow: theme.surface.shadowSm,
        overflow: 'hidden',
        fontFamily: theme.typography.fontFamily,
        fontSize: theme.typography.fontSizeBase,
        color: theme.text.primary,
      }}
    >
      {title && (
        <div
          style={{
            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
            borderBottom: `1px solid ${theme.surface.border}`,
            fontWeight: theme.typography.fontWeightBold,
            fontSize: theme.typography.fontSizeLg,
            color: theme.text.primary,
            flexShrink: 0,
          }}
        >
          {title}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {children(transformedData, resolvedW, resolvedH)}
      </div>
    </div>
  );
}
```

**Behavior to preserve exactly:** the `ResizeObserver` is only created when **both** `width` and `height` are numbers is false — i.e. it activates whenever *either* is a CSS string, not only when *both* are. On mount with a CSS-string dimension, children render once with `0` for that resolved dimension (since `measuredSize` starts `null`), then re-render once the observer's first callback fires. This 0×0-then-measured sequence is intentional and is exactly what `container.test.tsx` (below) verifies — don't "fix" it into synchronously measuring on mount; a synchronous initial measurement isn't available before first paint.

**Testing note:** `jsdom` does not implement `ResizeObserver` at all. `new ResizeObserver(...)` throws `ReferenceError: ResizeObserver is not defined` in the test environment unless a fake is installed globally before render. See the test file below for the exact fake used.

### `src/core/view-switcher.tsx`

```tsx
import React, { useState } from 'react';
import { useTheme } from '../theme/provider.js';
import { getPlugin } from '../registry/index.js';
import type { ViewSpec } from '../registry/types.js';
import type { TransformedData } from '../transforms/types.js';

export interface ViewSwitcherProps {
  views: ViewSpec[];
  data: TransformedData;
  width: number;
  height: number;
  activeView?: string;
  onViewChange?: (id: string) => void;
  tabPosition?: 'top' | 'bottom';
}

export function ViewSwitcher({
  views, data, width, height,
  activeView: controlled, onViewChange, tabPosition = 'top',
}: ViewSwitcherProps): React.ReactElement {
  const theme = useTheme();
  const [internal, setInternal] = useState(views[0]?.id ?? '');
  const activeId = controlled ?? internal;
  const tabH = 36;
  const chartH = height - tabH;

  const handleSelect = (id: string) => { setInternal(id); onViewChange?.(id); };

  const activeSpec = views.find((v) => v.id === activeId) ?? views[0];
  const plugin = activeSpec ? getPlugin(activeSpec.id) : undefined;

  let chart: React.ReactNode;
  if (!plugin) {
    chart = (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary }}>
        No plugin registered for "{activeId}". Call registerPlugin(...) first.
      </div>
    );
  } else {
    const libData = plugin.dataAdapter(data, activeSpec?.config);
    const libTheme = plugin.themeAdapter(theme, activeSpec?.config);
    chart = (
      <plugin.Renderer
        data={libData}
        theme={libTheme}
        width={width}
        height={chartH}
        config={activeSpec?.config}
      />
    );
  }

  const tabStrip = (
    <div role="tablist" style={{
      display: 'flex', gap: theme.spacing.xs, height: tabH,
      padding: `0 ${theme.spacing.sm}`, alignItems: 'center',
      borderBottom: tabPosition === 'top' ? `1px solid ${theme.surface.border}` : undefined,
      borderTop: tabPosition === 'bottom' ? `1px solid ${theme.surface.border}` : undefined,
      background: theme.surface.surface, flexShrink: 0,
    }}>
      {views.map((v) => {
        const p = getPlugin(v.id);
        const label = v.label ?? p?.label ?? v.id;
        const active = v.id === activeId;
        return (
          <button key={v.id} role="tab" aria-selected={active}
            onClick={() => handleSelect(v.id)}
            style={{
              padding: `${theme.spacing.xs} ${theme.spacing.sm}`, border: 'none',
              borderRadius: theme.surface.borderRadius, cursor: 'pointer',
              fontFamily: theme.typography.fontFamily, fontSize: theme.typography.fontSizeSm,
              fontWeight: active ? theme.typography.fontWeightBold : theme.typography.fontWeightNormal,
              background: active ? (theme.colors.categorical[0] ?? 'transparent') : 'transparent',
              color: active ? theme.text.inverse : theme.text.secondary,
              transition: 'background 0.15s, color 0.15s',
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width, height }}>
      {tabPosition === 'top' && tabStrip}
      <div style={{ flex: 1, overflow: 'hidden' }}>{chart}</div>
      {tabPosition === 'bottom' && tabStrip}
    </div>
  );
}
```

**Behaviors to preserve exactly (all locked in by tests, all deliberate, none are bugs):**
- The tab strip height is a hardcoded constant `36` (`tabH`); chart height is always `height - 36`.
- `activeView` (the `controlled` prop) drives the rendered view when present; falls back to internal `useState` when omitted (standard controlled/uncontrolled pattern).
- If `activeView` names an id **absent from `views`**, it does **not** error — `views.find(...) ?? views[0]` silently falls back to the first view. This is a genuine footgun for consumers (a typo'd id silently shows the wrong chart instead of failing loudly) but it's the existing, tested, intentional behavior — do not "fix" it without a human decision, since fixing it is a breaking behavior change, not a bug fix.
- An empty `views` array renders the "No plugin registered" fallback with an **empty string** interpolated (`No plugin registered for "". Call registerPlugin(...) first.`), and the tab strip renders with zero `<button>` elements (not omitted entirely — the `tablist` div is still there).
- `tabPosition="bottom"` renders the tab strip as the outer div's **second** child (after the chart div), not before.

### `src/core/collapse-manager.tsx`

```tsx
import React, { createContext, useCallback, useContext, useRef, useState } from 'react';

export interface CollapseState {
  /** Set of node IDs that are currently expanded. All others are collapsed. */
  expandedIds: ReadonlySet<string>;
  isExpanded: (id: string) => boolean;
  toggle: (id: string) => void;
  expand: (id: string) => void;
  collapse: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
  /**
   * Drill down: expand the node and record it as the current drill-down path.
   * The path is used by rollUp to navigate back.
   */
  drillDown: (id: string) => void;
  /** Roll up: collapse the most recently drilled-into node. */
  rollUp: () => void;
  /** The current drill-down path (ordered list of IDs). */
  drillPath: readonly string[];
}

const CollapseContext = createContext<CollapseState | null>(null);

export interface CollapseManagerProps {
  /** IDs that start expanded. Default: all collapsed. */
  defaultExpanded?: string[];
  children: React.ReactNode;
}

export function CollapseManager({ defaultExpanded = [], children }: CollapseManagerProps): React.ReactElement {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(defaultExpanded));
  const drillPathRef = useRef<string[]>([]);
  const [drillPath, setDrillPath] = useState<string[]>([]);

  const isExpanded = useCallback((id: string) => expandedIds.has(id), [expandedIds]);

  const toggle = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expand = useCallback((id: string) => {
    setExpandedIds((prev) => new Set(prev).add(id));
  }, []);

  const collapse = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds((prev) => new Set([...prev, ...ids]));
  }, []);

  const collapseAll = useCallback(() => setExpandedIds(new Set()), []);

  const drillDown = useCallback((id: string) => {
    expand(id);
    drillPathRef.current = [...drillPathRef.current, id];
    setDrillPath([...drillPathRef.current]);
  }, [expand]);

  const rollUp = useCallback(() => {
    const path = drillPathRef.current;
    if (path.length === 0) return;
    const last = path[path.length - 1];
    if (last !== undefined) collapse(last);
    drillPathRef.current = path.slice(0, -1);
    setDrillPath([...drillPathRef.current]);
  }, [collapse]);

  const value: CollapseState = {
    expandedIds,
    isExpanded,
    toggle,
    expand,
    collapse,
    expandAll,
    collapseAll,
    drillDown,
    rollUp,
    drillPath,
  };

  return (
    <CollapseContext.Provider value={value}>
      {children}
    </CollapseContext.Provider>
  );
}

/** Returns the collapse state from the nearest CollapseManager. */
export function useCollapse(): CollapseState {
  const ctx = useContext(CollapseContext);
  if (!ctx) throw new Error('useCollapse must be used inside a CollapseManager');
  return ctx;
}
```

Unlike `useTheme()`, `useCollapse()` **throws** if there's no provider ancestor — no silent default, since there's no sensible default expand/collapse state. No dedicated test file exists for this module — a known coverage gap.

### `src/core/index.ts`

```ts
export { WidgetContainer } from './container.js';
export type { WidgetContainerProps } from './container.js';

export { ViewSwitcher } from './view-switcher.js';
export type { ViewSwitcherProps } from './view-switcher.js';

export { CollapseManager, useCollapse } from './collapse-manager.js';
export type { CollapseManagerProps, CollapseState } from './collapse-manager.js';

export { registerPlugin, getPlugin, listPlugins, registerAndGetId } from '../registry/index.js';
export type { ChartPlugin, ViewSpec, RendererProps } from '../registry/types.js';
export { createNativePlugin } from '../registry/native-plugin.js';
export type { NativeChartProps, NativeConfig } from '../registry/native-plugin.js';
```

Note this barrel re-exports the registry layer's public functions too (`registerPlugin` etc.) — `src/core/index.ts` is effectively "core + the registry API," which is why `vizbox` (the top-level barrel) doesn't need to import registry functions from two different places.


### `src/core/__tests__/container.test.tsx`

```tsx
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { WidgetContainer } from '../container.js';
import { ThemeProvider } from '../../theme/provider.js';

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];
  callback: ResizeObserverCallback;
  disconnected = false;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(): void {}
  unobserve(): void {}
  disconnect(): void {
    this.disconnected = true;
  }

  trigger(rect: { width: number; height: number }): void {
    this.callback(
      [{ contentRect: rect } as ResizeObserverEntry],
      this as unknown as ResizeObserver,
    );
  }
}

const originalResizeObserver = globalThis.ResizeObserver;

beforeEach(() => {
  FakeResizeObserver.instances = [];
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof ResizeObserver;
});

afterEach(() => {
  globalThis.ResizeObserver = originalResizeObserver;
});

function renderContainer(props: Partial<React.ComponentProps<typeof WidgetContainer>>) {
  const children = vi.fn(() => null);
  const utils = render(
    <ThemeProvider theme="light">
      <WidgetContainer data={{ rows: [], fields: [] }} {...props}>
        {children}
      </WidgetContainer>
    </ThemeProvider>,
  );
  return { ...utils, children };
}

describe('WidgetContainer ResizeObserver wiring', () => {
  it('does not create a ResizeObserver when both width and height are numbers', () => {
    const { children } = renderContainer({ width: 300, height: 200 });
    expect(FakeResizeObserver.instances).toHaveLength(0);
    expect(children).toHaveBeenCalledWith({ rows: [], fields: [] }, 300, 200);
  });

  it('renders 0x0 before the ResizeObserver reports a size, when a dimension is a CSS string', () => {
    const { children } = renderContainer({ width: '100%', height: 400 });
    expect(children).toHaveBeenCalledWith({ rows: [], fields: [] }, 0, 400);
  });

  it('updates to the measured size once the ResizeObserver fires', () => {
    const { children } = renderContainer({ width: '100%', height: '100%' });
    expect(children).toHaveBeenLastCalledWith({ rows: [], fields: [] }, 0, 0);

    act(() => {
      FakeResizeObserver.instances[0]?.trigger({ width: 640, height: 480 });
    });

    expect(children).toHaveBeenLastCalledWith({ rows: [], fields: [] }, 640, 480);
  });

  it('disconnects the observer on unmount', () => {
    const { unmount } = renderContainer({ width: '100%', height: 400 });
    const observer = FakeResizeObserver.instances[0];
    expect(observer?.disconnected).toBe(false);
    unmount();
    expect(observer?.disconnected).toBe(true);
  });
});
```

### `src/core/__tests__/view-switcher.test.tsx`

```tsx
import React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ViewSwitcher } from '../view-switcher.js';
import { ThemeProvider } from '../../theme/provider.js';
import { registerPlugin, __resetRegistryForTests } from '../../registry/index.js';
import type { ChartPlugin } from '../../registry/types.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = { rows: [{ x: 1 }], fields: [{ key: 'x', type: 'number' }] };

function fakePlugin(
  id: string,
  overrides: Partial<ChartPlugin<{ label: string }, { mode: string }, { scale?: number }>> = {},
): ChartPlugin<{ label: string }, { mode: string }, { scale?: number }> {
  return {
    id,
    dataAdapter: () => ({ label: `adapted-${id}` }),
    themeAdapter: () => ({ mode: 'light' }),
    Renderer: ({ data: d, theme, width, height, config }) => (
      <div data-testid={`renderer-${id}`}>
        {d.label}|{theme.mode}|{width}|{height}|{config?.scale ?? 'none'}
      </div>
    ),
    ...overrides,
  };
}

function renderSwitcher(props: Partial<React.ComponentProps<typeof ViewSwitcher>>) {
  return render(
    <ThemeProvider theme="light">
      <ViewSwitcher views={[]} data={data} width={400} height={300} {...props} />
    </ThemeProvider>,
  );
}

describe('ViewSwitcher', () => {
  beforeEach(() => {
    __resetRegistryForTests();
  });

  it('passes dataAdapter/themeAdapter output and dimensions through to the plugin Renderer', () => {
    registerPlugin(fakePlugin('vs-test-basic'));
    renderSwitcher({ views: [{ id: 'vs-test-basic', config: { scale: 2 } }] });

    expect(screen.getByTestId('renderer-vs-test-basic')).toHaveTextContent(
      'adapted-vs-test-basic|light|400|264|2',
    );
  });

  it('shows a fallback message when the active view has no registered plugin', () => {
    renderSwitcher({ views: [{ id: 'vs-test-unregistered' }] });

    expect(screen.getByText(/No plugin registered for "vs-test-unregistered"/)).toBeInTheDocument();
  });

  it('switches the rendered plugin when a different tab is clicked', () => {
    registerPlugin(fakePlugin('vs-test-tab-a'));
    registerPlugin(fakePlugin('vs-test-tab-b'));
    const onViewChange = vi.fn();
    renderSwitcher({
      views: [{ id: 'vs-test-tab-a' }, { id: 'vs-test-tab-b' }],
      onViewChange,
    });

    expect(screen.getByTestId('renderer-vs-test-tab-a')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('tab', { name: 'vs-test-tab-b' }));

    expect(screen.getByTestId('renderer-vs-test-tab-b')).toBeInTheDocument();
    expect(onViewChange).toHaveBeenCalledWith('vs-test-tab-b');
  });

  it('prefers view label, then plugin label, then id for the tab text', () => {
    registerPlugin(fakePlugin('vs-test-label', { label: 'Plugin Label' }));
    renderSwitcher({ views: [{ id: 'vs-test-label', label: 'View Label' }] });

    expect(screen.getByRole('tab', { name: 'View Label' })).toBeInTheDocument();
  });

  it('lets the controlled activeView prop drive the rendered view, ignoring internal state', () => {
    registerPlugin(fakePlugin('vs-test-controlled-a'));
    registerPlugin(fakePlugin('vs-test-controlled-b'));
    const { rerender } = render(
      <ThemeProvider theme="light">
        <ViewSwitcher
          views={[{ id: 'vs-test-controlled-a' }, { id: 'vs-test-controlled-b' }]}
          data={data}
          width={400}
          height={300}
          activeView="vs-test-controlled-b"
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('renderer-vs-test-controlled-b')).toBeInTheDocument();
    expect(screen.queryByTestId('renderer-vs-test-controlled-a')).not.toBeInTheDocument();

    rerender(
      <ThemeProvider theme="light">
        <ViewSwitcher
          views={[{ id: 'vs-test-controlled-a' }, { id: 'vs-test-controlled-b' }]}
          data={data}
          width={400}
          height={300}
          activeView="vs-test-controlled-a"
        />
      </ThemeProvider>,
    );

    expect(screen.getByTestId('renderer-vs-test-controlled-a')).toBeInTheDocument();
  });

  it('falls back to the first view when activeView points at an id absent from views', () => {
    registerPlugin(fakePlugin('vs-test-fallback-a'));
    renderSwitcher({
      views: [{ id: 'vs-test-fallback-a' }],
      activeView: 'vs-test-does-not-exist',
    });

    expect(screen.getByTestId('renderer-vs-test-fallback-a')).toBeInTheDocument();
  });

  it('renders the tab strip after the chart when tabPosition is "bottom"', () => {
    registerPlugin(fakePlugin('vs-test-bottom'));
    const { container } = renderSwitcher({
      views: [{ id: 'vs-test-bottom' }],
      tabPosition: 'bottom',
    });

    const root = container.firstElementChild;
    expect(root?.children).toHaveLength(2);
    expect(root?.children[0]?.querySelector('[data-testid="renderer-vs-test-bottom"]')).toBeTruthy();
    expect(root?.children[1]?.getAttribute('role')).toBe('tablist');
  });

  it('renders the tab strip before the chart when tabPosition is "top" (default)', () => {
    registerPlugin(fakePlugin('vs-test-top'));
    const { container } = renderSwitcher({
      views: [{ id: 'vs-test-top' }],
    });

    const root = container.firstElementChild;
    expect(root?.children[0]?.getAttribute('role')).toBe('tablist');
    expect(root?.children[1]?.querySelector('[data-testid="renderer-vs-test-top"]')).toBeTruthy();
  });

  it('shows the fallback message with no tabs for an empty views array', () => {
    renderSwitcher({ views: [] });

    expect(screen.getByText('No plugin registered for "". Call registerPlugin(...) first.')).toBeInTheDocument();
    expect(screen.queryAllByRole('tab')).toHaveLength(0);
  });
});
```

### `src/core/__tests__/view-switcher-adapters.test.tsx`

This is the end-to-end suite: it proves `registerPlugin` → `<ViewSwitcher>` actually drives each of the four adapter kinds (D3, Recharts, Nivo, native), not just that each factory function produces a well-shaped object in isolation.

```tsx
import React from 'react';
import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen } from '@testing-library/react';
import { ViewSwitcher } from '../view-switcher.js';
import { ThemeProvider } from '../../theme/provider.js';
import { lightTheme } from '../../theme/light.js';
import { registerPlugin, __resetRegistryForTests } from '../../registry/index.js';
import { createNativePlugin } from '../../registry/native-plugin.js';
import type { NativeChartProps } from '../../registry/native-plugin.js';
import { createD3Plugin } from '../../plugins/d3-adapter.js';
import { createRechartsPlugin } from '../../plugins/recharts-adapter.js';
import { createNivoPlugin } from '../../plugins/nivo-adapter.js';
import type { TransformedData } from '../../transforms/types.js';

const data: TransformedData = {
  rows: [{ region: 'East', sales: 100 }, { region: 'West', sales: 200 }],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
};

function renderWith(views: React.ComponentProps<typeof ViewSwitcher>['views']) {
  return render(
    <ThemeProvider theme="light">
      <ViewSwitcher views={views} data={data} width={300} height={200} />
    </ThemeProvider>,
  );
}

describe('adapter end-to-end: registerPlugin -> ViewSwitcher -> Renderer mounted', () => {
  beforeEach(() => {
    __resetRegistryForTests();
  });

  it('D3 plugin: mount is called via ViewSwitcher with adapted data and resolved dimensions', () => {
    const mount = vi.fn();
    const update = vi.fn();
    const destroy = vi.fn();
    registerPlugin(createD3Plugin({
      id: 'vsa-d3',
      dataAdapter: (d) => d.rows,
      mount,
      update,
      destroy,
    }));

    renderWith([{ id: 'vsa-d3' }]);

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0]?.[1]).toEqual(data.rows);
    expect(mount.mock.calls[0]?.[3]).toBe(300);
    expect(mount.mock.calls[0]?.[4]).toBe(200 - 36);
  });

  it('Recharts plugin: Renderer is mounted via ViewSwitcher with auto-detected data', () => {
    const Renderer = vi.fn(() => <div data-testid="recharts-out" />);
    registerPlugin(createRechartsPlugin({ id: 'vsa-recharts', Renderer }));

    renderWith([{ id: 'vsa-recharts' }]);

    expect(screen.getByTestId('recharts-out')).toBeInTheDocument();
    expect(Renderer).toHaveBeenCalledTimes(1);
    const props = Renderer.mock.calls[0]?.[0];
    expect(props?.data).toEqual([
      { region: 'East', sales: 100, name: 'East', value: 100 },
      { region: 'West', sales: 200, name: 'West', value: 200 },
    ]);
    expect(props?.width).toBe(300);
    expect(props?.height).toBe(200 - 36);
  });

  it('Nivo plugin: Renderer is mounted via ViewSwitcher with the configured dataAdapter output', () => {
    const Renderer = vi.fn(() => <div data-testid="nivo-out" />);
    registerPlugin(createNivoPlugin({
      id: 'vsa-nivo',
      dataAdapter: (d) => d.rows,
      Renderer,
    }));

    renderWith([{ id: 'vsa-nivo' }]);

    expect(screen.getByTestId('nivo-out')).toBeInTheDocument();
    expect(Renderer).toHaveBeenCalledTimes(1);
    const props = Renderer.mock.calls[0]?.[0];
    expect(props?.data).toEqual(data.rows);
    expect(props?.theme.colors).toEqual(lightTheme.colors.categorical);
  });

  it('Native plugin: wrapped component is mounted via ViewSwitcher with identity-adapted data/theme', () => {
    let received: NativeChartProps | undefined;
    function Capture(props: NativeChartProps) {
      received = props;
      return null;
    }
    registerPlugin(createNativePlugin('vsa-native', Capture));

    renderWith([{ id: 'vsa-native' }]);

    expect(received?.data).toBe(data);
    expect(received?.theme).toBe(lightTheme);
    expect(received?.width).toBe(300);
    expect(received?.height).toBe(200 - 36);
  });
});
```

---

## 12. Layer 5 — Viz (`src/viz/`): Built-in Native SVG Charts

Seven self-contained React components, each rendering raw SVG (or, for `DataTable`, an HTML `<table>`) with no external chart library. Each accepts `NativeChartProps` (from Layer 3) or an extension of it. Each is wrapped as a `ChartPlugin` via `createNativePlugin` in `plugins.ts`. None of these files have dedicated unit tests currently (a known gap — they're the code most likely to be directly used by consumers, and none of it is tested; if extending coverage, this is the highest-value remaining target).

Shared conventions across all seven:
- Field auto-detection pattern: `xField ?? data.fields.find((f) => f.type === '...')?.key ?? ''` — an explicit prop always wins, an auto-detected field guess is the fallback, empty string is the last resort.
- Colors always come from `categoricalColor(theme, index)` or `sequentialColor(theme, t)` (Layer 2), never hardcoded.
- All read `theme.typography.fontFamily` / `theme.typography.fontSizeSm` for text styling, and `theme.surface.border` for gridlines/axes.

### `src/viz/types.ts`

```ts
import type { TransformedData } from '../transforms/types.js';

/**
 * Base props shared by every visualization component.
 * All visualizations must accept and implement these.
 */
export interface VisualizationProps {
  data: TransformedData;
  width: number;
  height: number;
  /** Optional: field to use as the x-axis / category. Inferred if omitted. */
  xField?: string;
  /** Optional: field to use as the y-axis / value. Inferred if omitted. */
  yField?: string;
  /** Optional: field to use for color grouping. */
  colorField?: string;
  /** Optional: field to use as labels. */
  labelField?: string;
  /** Optional: accessible title for the chart. */
  ariaLabel?: string;
}
```

**Known-unused, reproduce as-is — do not delete or wire it up as a "cleanup."** `VisualizationProps` is not imported by any of the seven native components below (each instead takes `NativeChartProps` from Layer 3 directly) and is not re-exported from `src/viz/index.ts`. It appears to have been an earlier, abandoned attempt at a shared props contract for this layer, superseded by `NativeChartProps` without the file being removed. It's included here because an exact rebuild reproduces the current repository state, dead file included — deleting it or retrofitting components to use it would be a real (if harmless) design change, not a faithful reconstruction.

### `src/viz/data-table.tsx`

```tsx
import React, { useState } from 'react';
import type { NativeChartProps } from '../registry/native-plugin.js';
import type { DataRow, FieldMeta } from '../transforms/types.js';

const PAGE_SIZE = 25;

type SortDir = 'asc' | 'desc';

export function DataTable({ data, height, theme }: NativeChartProps): React.ReactElement {
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const fields: FieldMeta[] = data.fields.length > 0
    ? data.fields
    : Object.keys(data.rows[0] ?? {}).map((k) => ({ key: k, type: 'string' as const }));

  const sorted = [...data.rows].sort((a, b) => {
    if (!sortField) return 0;
    const av = a[sortField] ?? '';
    const bv = b[sortField] ?? '';
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageRows = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortField === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortField(key); setSortDir('asc'); }
  };

  const th: React.CSSProperties = {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    textAlign: 'left',
    fontWeight: theme.typography.fontWeightBold,
    fontSize: theme.typography.fontSizeSm,
    color: theme.text.secondary,
    borderBottom: `2px solid ${theme.surface.border}`,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  };

  const td: React.CSSProperties = {
    padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
    fontSize: theme.typography.fontSizeSm,
    borderBottom: `1px solid ${theme.surface.border}`,
    color: theme.text.primary,
    maxWidth: 200,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: theme.typography.fontFamily }}>
          <thead>
            <tr>
              {fields.map((f) => (
                <th key={f.key} style={th} onClick={() => handleSort(f.key)}>
                  {f.label ?? f.key}
                  {sortField === f.key ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr
                key={i}
                style={{ background: i % 2 === 0 ? theme.surface.background : theme.surface.surface }}
              >
                {fields.map((f) => (
                  <td key={f.key} style={td} title={String(row[f.key] ?? '')}>
                    {formatCell(row, f)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          borderTop: `1px solid ${theme.surface.border}`,
          fontSize: theme.typography.fontSizeSm,
          color: theme.text.secondary,
        }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={{ cursor: page === 0 ? 'default' : 'pointer' }}>←</button>
          <span>Page {page + 1} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ cursor: page === totalPages - 1 ? 'default' : 'pointer' }}>→</button>
        </div>
      )}
    </div>
  );
}

function formatCell(row: DataRow, field: FieldMeta): string {
  const val = row[field.key];
  if (val === null || val === undefined) return '—';
  if (field.type === 'number' && typeof val === 'number') {
    return val.toLocaleString();
  }
  return String(val);
}
```

Pagination is fixed at 25 rows/page, not configurable via props. Sort click cycles asc → desc on the same field; clicking a different field resets to asc.

### `src/viz/horizontal-bar-chart.tsx`

```tsx
import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

const MARGIN = { top: 16, right: 24, bottom: 16, left: 120 };

export function HorizontalBarChart({
  data,
  width,
  height,
  xField,
  yField,
  ariaLabel,
  theme,
}: NativeChartProps): React.ReactElement {
  // Infer fields
  const numericField = xField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const labelField = yField ?? data.fields.find((f) => f.type === 'string')?.key ?? '';

  const rows = data.rows
    .map((r) => ({ label: String(r[labelField] ?? ''), value: Number(r[numericField] ?? 0) }))
    .filter((r) => isFinite(r.value));

  const innerW = width - MARGIN.left - MARGIN.right;
  const barHeight = Math.max(8, Math.floor((height - MARGIN.top - MARGIN.bottom) / Math.max(rows.length, 1)) - 4);
  const innerH = rows.length * (barHeight + 4);
  const maxVal = Math.max(...rows.map((r) => r.value), 1);

  return (
    <svg
      width={width}
      height={Math.max(height, innerH + MARGIN.top + MARGIN.bottom)}
      aria-label={ariaLabel ?? `Horizontal bar chart of ${numericField}`}
      role="img"
      style={{ fontFamily: theme.typography.fontFamily }}
    >
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {rows.map((row, i) => {
          const barW = Math.max(0, (row.value / maxVal) * innerW);
          const y = i * (barHeight + 4);
          const color = categoricalColor(theme, i);
          return (
            <g key={i}>
              <text
                x={-8}
                y={y + barHeight / 2}
                textAnchor="end"
                dominantBaseline="middle"
                fontSize={theme.typography.fontSizeSm}
                fill={theme.text.primary}
              >
                {row.label.length > 14 ? row.label.slice(0, 13) + '…' : row.label}
              </text>
              <rect
                x={0}
                y={y}
                width={barW}
                height={barHeight}
                fill={color}
                rx={2}
              >
                <title>{row.label}: {row.value.toLocaleString()}</title>
              </rect>
              {barW > 40 && (
                <text
                  x={barW - 6}
                  y={y + barHeight / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={theme.typography.fontSizeSm}
                  fill={theme.text.inverse}
                >
                  {row.value.toLocaleString()}
                </text>
              )}
            </g>
          );
        })}
        {/* Zero line */}
        <line x1={0} y1={0} x2={0} y2={innerH} stroke={theme.surface.border} strokeWidth={1} />
      </g>
    </svg>
  );
}
```

Note the value label inside a bar only renders `{barW > 40}` — bars too short to fit legible text just show nothing (the label + tooltip `<title>` still carries the value). `MARGIN.left` is a generous `120px` to fit row labels.

### `src/viz/line-chart.tsx`

```tsx
import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

const MARGIN = { top: 24, right: 24, bottom: 40, left: 56 };

export function LineChart({
  data,
  width,
  height,
  xField,
  yField,
  colorField,
  ariaLabel,
  theme,
}: NativeChartProps): React.ReactElement {
  const numericField = yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const categoryField = xField ?? data.fields.find((f) => f.type === 'string' || f.type === 'date')?.key ?? '';

  // Group rows by colorField if provided
  type Series = { key: string; points: Array<{ x: number; y: number; label: string }> };
  const seriesMap = new Map<string, Series>();

  const allXLabels = [...new Set(data.rows.map((r) => String(r[categoryField] ?? '')))];

  if (colorField) {
    for (const row of data.rows) {
      const seriesKey = String(row[colorField] ?? 'default');
      if (!seriesMap.has(seriesKey)) seriesMap.set(seriesKey, { key: seriesKey, points: [] });
      seriesMap.get(seriesKey)!.points.push({
        x: allXLabels.indexOf(String(row[categoryField] ?? '')),
        y: Number(row[numericField] ?? 0),
        label: String(row[categoryField] ?? ''),
      });
    }
  } else {
    const series: Series = { key: 'default', points: data.rows.map((r, i) => ({
      x: i, y: Number(r[numericField] ?? 0), label: String(r[categoryField] ?? i),
    })) };
    seriesMap.set('default', series);
  }

  const allSeries = [...seriesMap.values()];
  const allYValues = allSeries.flatMap((s) => s.points.map((p) => p.y));
  const minY = Math.min(...allYValues, 0);
  const maxY = Math.max(...allYValues, 1);
  const innerW = width - MARGIN.left - MARGIN.right;
  const innerH = height - MARGIN.top - MARGIN.bottom;
  const xCount = Math.max(allXLabels.length - 1, 1);

  const scaleX = (i: number) => (i / xCount) * innerW;
  const scaleY = (v: number) => innerH - ((v - minY) / (maxY - minY)) * innerH;

  const toPath = (points: Series['points']) =>
    points
      .sort((a, b) => a.x - b.x)
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${scaleX(p.x).toFixed(1)},${scaleY(p.y).toFixed(1)}`)
      .join(' ');

  const tickCount = Math.min(5, allXLabels.length);
  const xTicks = Array.from({ length: tickCount }, (_, i) =>
    Math.round((i / (tickCount - 1)) * (allXLabels.length - 1)),
  );
  const yTicks = 5;

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? `Line chart of ${numericField}`} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      <g transform={`translate(${MARGIN.left},${MARGIN.top})`}>
        {/* Y grid + ticks */}
        {Array.from({ length: yTicks }, (_, i) => {
          const v = minY + (i / (yTicks - 1)) * (maxY - minY);
          const y = scaleY(v);
          return (
            <g key={i}>
              <line x1={0} y1={y} x2={innerW} y2={y} stroke={theme.surface.border} strokeDasharray="3,3" />
              <text x={-8} y={y} textAnchor="end" dominantBaseline="middle"
                fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>
                {v.toLocaleString(undefined, { maximumFractionDigits: 1 })}
              </text>
            </g>
          );
        })}
        {/* X ticks */}
        {xTicks.map((idx) => (
          <text key={idx} x={scaleX(idx)} y={innerH + 16} textAnchor="middle"
            fontSize={theme.typography.fontSizeSm} fill={theme.text.secondary}>
            {(allXLabels[idx] ?? '').slice(0, 8)}
          </text>
        ))}
        {/* Lines */}
        {allSeries.map((series, si) => (
          <path key={series.key} d={toPath(series.points)}
            fill="none" stroke={categoricalColor(theme, si)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {/* Axes */}
        <line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={theme.surface.border} />
        <line x1={0} y1={0} x2={0} y2={innerH} stroke={theme.surface.border} />
      </g>
    </svg>
  );
}
```

Multi-series support is driven by `colorField`: if provided, rows are grouped into one `Series` per distinct value; if omitted, all rows form a single `'default'` series in original row order (using row index as x). X-axis positions are indices into `allXLabels` (a de-duplicated, order-of-first-appearance list), not the raw field values — this is what makes categorical/date x-axes evenly spaced regardless of value.

### `src/viz/pie-chart.tsx`

```tsx
import React from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

function polarToCartesian(cx: number, cy: number, r: number, angle: number) {
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  };
}

function slicePath(cx: number, cy: number, r: number, innerR: number, startAngle: number, endAngle: number): string {
  const s = polarToCartesian(cx, cy, r, startAngle);
  const e = polarToCartesian(cx, cy, r, endAngle);
  const si = polarToCartesian(cx, cy, innerR, startAngle);
  const ei = polarToCartesian(cx, cy, innerR, endAngle);
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M ${s.x} ${s.y}`,
    `A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`,
    `L ${ei.x} ${ei.y}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${si.x} ${si.y}`,
    'Z',
  ].join(' ');
}

export interface PieChartProps extends NativeChartProps {
  /** If true, renders as a donut chart. Default: false. */
  donut?: boolean;
}

export function PieChart({
  data,
  width,
  height,
  xField,
  yField,
  ariaLabel,
  theme,
  donut = false,
}: PieChartProps): React.ReactElement {
  const valueField = yField ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
  const labelField = xField ?? data.fields.find((f) => f.type === 'string')?.key ?? '';

  const slices = data.rows.map((r) => ({
    label: String(r[labelField] ?? ''),
    value: Math.max(0, Number(r[valueField] ?? 0)),
  })).filter((s) => s.value > 0);

  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(cx, cy) * 0.82;
  const innerR = donut ? r * 0.5 : 0;

  let cursor = -Math.PI / 2;
  const paths = slices.map((slice, i) => {
    const angle = (slice.value / total) * (2 * Math.PI);
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    const mid = (start + end) / 2;
    const labelR = r * 0.7;
    const lp = polarToCartesian(cx, cy, labelR, mid);
    const pct = ((slice.value / total) * 100).toFixed(1);
    return { slice, i, start, end, lp, pct, path: slicePath(cx, cy, r, innerR, start, end) };
  });

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? `Pie chart of ${valueField}`} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      {paths.map(({ slice, i, lp, pct, path }) => (
        <g key={i}>
          <path d={path} fill={categoricalColor(theme, i)} stroke={theme.surface.background} strokeWidth={2}>
            <title>{slice.label}: {slice.value.toLocaleString()} ({pct}%)</title>
          </path>
          {slice.value / total > 0.04 && (
            <text x={lp.x} y={lp.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={theme.typography.fontSizeSm} fill={theme.text.inverse} fontWeight={theme.typography.fontWeightBold}>
              {pct}%
            </text>
          )}
        </g>
      ))}
      {donut && (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize={theme.typography.fontSizeLg} fill={theme.text.primary} fontWeight={theme.typography.fontWeightBold}>
          {total.toLocaleString()}
        </text>
      )}
    </svg>
  );
}
```

Zero/negative values are filtered out before rendering (`filter((s) => s.value > 0)`, with negatives clamped to `0` first via `Math.max(0, ...)`). Percentage labels only render for slices `> 4%` of the total, to avoid unreadable overlapping text on thin slices. `donut` is the one native chart with a component-specific prop beyond the shared `NativeChartProps` — it extends the base interface (see `PieChartProps`).

### `src/viz/choropleth.tsx`

```tsx
import React from 'react';
import { sequentialColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';
import type { GeoFeature } from '../transforms/types.js';

export interface ChoroplethProps extends NativeChartProps {
  /** Field in each feature's properties to map to color. */
  valueProperty?: string;
  /**
   * Optional pre-projected path strings. If provided, the component skips
   * projection and uses these strings directly (useful with D3 projection).
   * Keys must match feature IDs.
   */
  projectedPaths?: Record<string, string>;
}

export function Choropleth({
  data,
  width,
  height,
  yField,
  ariaLabel,
  theme,
  valueProperty,
  projectedPaths,
}: ChoroplethProps): React.ReactElement {
  if (!data.geo) {
    return (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary }}>
        Choropleth requires a GeoData object. Use the geoNormalize transform to attach GeoJSON.
      </div>
    );
  }

  const prop = valueProperty ?? yField ?? 'value';
  const features: GeoFeature[] = data.geo.features;

  const values = features
    .map((f) => f.properties[prop])
    .filter((v): v is number => typeof v === 'number');

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values, minVal + 1);

  const getColor = (feature: GeoFeature) => {
    const val = feature.properties[prop];
    if (typeof val !== 'number') return theme.surface.border;
    const t = (val - minVal) / (maxVal - minVal);
    return sequentialColor(theme, t);
  };

  // If pre-projected paths are provided, use them directly
  if (projectedPaths) {
    return (
      <svg width={width} height={height} aria-label={ariaLabel ?? 'Choropleth map'} role="img">
        {features.map((feature) => {
          const d = projectedPaths[feature.id];
          if (!d) return null;
          const label = String(feature.properties['name'] ?? feature.id);
          const val = feature.properties[prop];
          return (
            <path key={feature.id} d={d} fill={getColor(feature)}
              stroke={theme.surface.background} strokeWidth={0.5}>
              <title>{label}: {typeof val === 'number' ? val.toLocaleString() : '—'}</title>
            </path>
          );
        })}
      </svg>
    );
  }

  // Fallback: render a placeholder with instructions
  return (
    <div style={{
      width, height, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: theme.spacing.md, padding: theme.spacing.lg,
      background: theme.surface.surface, borderRadius: theme.surface.borderRadius,
      color: theme.text.secondary, textAlign: 'center',
      fontFamily: theme.typography.fontFamily,
    }}>
      <div style={{ fontSize: theme.typography.fontSizeLg, fontWeight: theme.typography.fontWeightBold }}>
        Choropleth
      </div>
      <div style={{ fontSize: theme.typography.fontSizeSm }}>
        {features.length} features loaded • value field: <code>{prop}</code>
      </div>
      <div style={{ fontSize: theme.typography.fontSizeSm }}>
        Pass <code>projectedPaths</code> (from a D3 geoPath projection) to render the map,
        or use the D3 adapter to attach a full projection-based renderer.
      </div>
      <div style={{ display: 'flex', gap: theme.spacing.sm, marginTop: theme.spacing.sm }}>
        {theme.colors.sequential.map((c, i) => (
          <div key={i} style={{
            width: 24, height: 24, background: c, borderRadius: 3,
            border: `1px solid ${theme.surface.border}`,
          }}>
            <title>{i === 0 ? `min: ${minVal}` : i === theme.colors.sequential.length - 1 ? `max: ${maxVal}` : ''}</title>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Important, non-obvious design point:** `Choropleth` does **not** do map projection itself (no D3-geo dependency, per the "no runtime dependency beyond React" rule). Without `projectedPaths` supplied by the caller, it renders an informational placeholder, not a broken/empty map — this is deliberate degraded-but-honest behavior, not a bug. A real map requires the caller to compute `projectedPaths` externally (typically via `d3-geo`'s `geoPath`) and pass it in.

### `src/viz/force-graph.tsx`

```tsx
import React, { useEffect, useRef, useState } from 'react';
import { categoricalColor } from '../theme/color-scale.js';
import type { NativeChartProps } from '../registry/native-plugin.js';

interface Node {
  id: string;
  label: string;
  group: string | undefined;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
  weight: number | undefined;
}

/**
 * Force-directed layout via pairwise repulsion + edge attraction.
 * O(n^2) per iteration x `iterations` — fine at dashboard-widget scale
 * (tens to low hundreds of nodes), but avoid feeding it thousands of rows.
 */
function runSimulation(nodes: Node[], edges: Edge[], iterations = 60): Node[] {
  const result = nodes.map((n) => ({ ...n }));
  const nodeMap = new Map(result.map((n) => [n.id, n]));
  const k = Math.sqrt(result.length);

  for (let iter = 0; iter < iterations; iter++) {
    const alpha = 1 - iter / iterations;
    // Repulsion
    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        const a = result[i]!;
        const b = result[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
        const force = (k * k) / dist * alpha * 0.5;
        a.vx += (dx / dist) * force;
        a.vy += (dy / dist) * force;
        b.vx -= (dx / dist) * force;
        b.vy -= (dy / dist) * force;
      }
    }
    // Attraction along edges
    for (const edge of edges) {
      const s = nodeMap.get(edge.source);
      const t = nodeMap.get(edge.target);
      if (!s || !t) continue;
      const dx = t.x - s.x;
      const dy = t.y - s.y;
      const dist = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
      const force = (dist / k) * alpha * 0.5;
      s.vx += (dx / dist) * force;
      s.vy += (dy / dist) * force;
      t.vx -= (dx / dist) * force;
      t.vy -= (dy / dist) * force;
    }
    // Apply velocity
    for (const n of result) {
      n.x += n.vx * 0.85;
      n.y += n.vy * 0.85;
      n.vx *= 0.8;
      n.vy *= 0.8;
    }
  }
  return result;
}

export function ForceGraph({ data, width, height, xField, yField, ariaLabel, theme }: NativeChartProps): React.ReactElement {
  // Expect data.rows to have: id, label, [group], and optionally source/target for edges
  const nodeRows = data.rows.filter((r) => r['source'] === undefined || r['source'] === null);
  const edgeRows = data.rows.filter((r) => r['source'] !== undefined && r['source'] !== null);

  const idField = xField ?? 'id';
  const labelField = yField ?? 'label';

  const initialNodes: Node[] = nodeRows.map((r) => ({
    id: String(r[idField] ?? r['id'] ?? ''),
    label: String(r[labelField] ?? r['label'] ?? ''),
    group: r['group'] !== undefined ? String(r['group']) : undefined,
    // Math.random() is intentional here: used only for visual initial placement,
    // not for security-sensitive ID generation. If you need unpredictable IDs,
    // use crypto.randomUUID() or crypto.getRandomValues() instead.
    x: width / 2 + (Math.random() - 0.5) * width * 0.6,
    y: height / 2 + (Math.random() - 0.5) * height * 0.6,
    vx: 0,
    vy: 0,
  }));

  const edges: Edge[] = edgeRows.map((r) => ({
    source: String(r['source'] ?? ''),
    target: String(r['target'] ?? ''),
    weight: typeof r['weight'] === 'number' ? r['weight'] : undefined,
  }));

  const [nodes, setNodes] = useState<Node[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    setNodes(runSimulation(initialNodes, edges));
  }, []);

  const groups = [...new Set(nodes.map((n) => n.group ?? 'default'))];
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const pad = 24;
  const xs = nodes.map((n) => n.x);
  const ys = nodes.map((n) => n.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, width);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, height);
  const scaleX = (x: number) => pad + ((x - minX) / (maxX - minX)) * (width - pad * 2);
  const scaleY = (y: number) => pad + ((y - minY) / (maxY - minY)) * (height - pad * 2);

  return (
    <svg width={width} height={height} aria-label={ariaLabel ?? 'Force-directed graph'} role="img"
      style={{ fontFamily: theme.typography.fontFamily }}>
      {edges.map((edge, i) => {
        const s = nodeMap.get(edge.source);
        const t = nodeMap.get(edge.target);
        if (!s || !t) return null;
        return (
          <line key={i}
            x1={scaleX(s.x)} y1={scaleY(s.y)}
            x2={scaleX(t.x)} y2={scaleY(t.y)}
            stroke={theme.surface.border} strokeWidth={edge.weight ? Math.max(1, edge.weight) : 1.5}
            opacity={0.6} />
        );
      })}
      {nodes.map((node, i) => {
        const gIdx = groups.indexOf(node.group ?? 'default');
        return (
          <g key={node.id} transform={`translate(${scaleX(node.x)},${scaleY(node.y)})`}>
            <circle r={10} fill={categoricalColor(theme, gIdx)} stroke={theme.surface.background} strokeWidth={2} opacity={0.9}>
              <title>{node.label}</title>
            </circle>
            <text y={18} textAnchor="middle" fontSize={theme.typography.fontSizeSm}
              fill={theme.text.secondary}>{node.label.slice(0, 12)}</text>
          </g>
        );
      })}
    </svg>
  );
}
```

**Row shape convention (unique to this component):** a single flat `data.rows` array encodes both nodes and edges — a row is a **node** row if `source` is `undefined`/`null`, and an **edge** row if `source` is present. This is a deliberate encoding choice (avoids needing a second data prop) but is easy to get wrong when constructing test/demo data: forgetting to omit `source` on node rows makes them silently vanish from `nodeRows`. The simulation runs exactly once per mount (`initialized` ref guards against re-running on re-render) — `runSimulation` is O(n²) per iteration × 60 iterations; keep it to dashboard-widget scale (tens to low hundreds of nodes).

### `src/viz/tree-view.tsx`

```tsx
import React from 'react';
import { useCollapse } from '../core/collapse-manager.js';
import type { NativeChartProps } from '../registry/native-plugin.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { HierarchyNode } from '../transforms/types.js';

interface TreeNodeProps {
  node: HierarchyNode;
  depth: number;
  onSelect: ((node: HierarchyNode) => void) | undefined;
  theme: ThemeDefinition;
}

function TreeNodeRow({ node, depth, onSelect, theme }: TreeNodeProps): React.ReactElement {
  const collapse = useCollapse();
  const hasChildren = node.children && node.children.length > 0;
  const expanded = collapse.isExpanded(node.id);

  const indent = depth * parseInt(theme.spacing.lg);

  return (
    <>
      <div
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          paddingLeft: indent,
          paddingTop: theme.spacing.xs,
          paddingBottom: theme.spacing.xs,
          paddingRight: theme.spacing.sm,
          cursor: hasChildren ? 'pointer' : 'default',
          userSelect: 'none',
          borderRadius: theme.surface.borderRadius,
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.background = theme.surface.surface; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'transparent'; }}
        onClick={() => {
          if (hasChildren) collapse.toggle(node.id);
          onSelect?.(node);
        }}
      >
        <span style={{ width: 16, flexShrink: 0, color: theme.text.secondary, fontSize: 10 }}>
          {hasChildren ? (expanded ? '▼' : '▶') : ''}
        </span>
        <span style={{ flex: 1, fontSize: theme.typography.fontSizeBase, color: theme.text.primary }}>
          {node.label}
        </span>
        {node.value !== undefined && (
          <span style={{ fontSize: theme.typography.fontSizeSm, color: theme.text.secondary }}>
            {node.value.toLocaleString()}
          </span>
        )}
      </div>
      {hasChildren && expanded && node.children?.map((child) => (
        <TreeNodeRow key={child.id} node={child} depth={depth + 1} onSelect={onSelect} theme={theme} />
      ))}
    </>
  );
}

export interface TreeViewProps extends NativeChartProps {
  onSelect?: (node: HierarchyNode) => void;
}

export function TreeView({ data, height, theme, onSelect }: TreeViewProps): React.ReactElement {
  if (!data.hierarchy) {
    return (
      <div style={{ padding: theme.spacing.md, color: theme.text.secondary, fontFamily: theme.typography.fontFamily }}>
        TreeView requires a hierarchy. Use the groupBy transform or build a HierarchyNode manually.
      </div>
    );
  }

  return (
    <div
      role="tree"
      style={{
        height,
        overflow: 'auto',
        padding: theme.spacing.sm,
        fontFamily: theme.typography.fontFamily,
      }}
    >
      <TreeNodeRow node={data.hierarchy} depth={0} onSelect={onSelect} theme={theme} />
    </div>
  );
}
```

**`TreeNodeRow` must receive `theme` as an explicit prop, not read it via `useTheme()`.** This mirrors a rule established across every native chart component in this refactor: every viz component (top-level and internal sub-components) is a pure function of its props, with no implicit context reads for theme. `TreeNodeRow` calls `useCollapse()` (context is fine there — collapse state genuinely is ambient/shared), but never `useTheme()`. `TreeView` itself requires `data.hierarchy` to be populated (typically by the `groupBy` transform) — like `Choropleth`, it renders an informational message rather than crashing when the prerequisite data is missing.

### `src/viz/plugins.ts`

```ts
import { createNativePlugin } from '../registry/native-plugin.js';
import { DataTable } from './data-table.js';
import { HorizontalBarChart } from './horizontal-bar-chart.js';
import { LineChart } from './line-chart.js';
import { PieChart } from './pie-chart.js';
import { Choropleth } from './choropleth.js';
import { ForceGraph } from './force-graph.js';
import { TreeView } from './tree-view.js';

export const nativeTablePlugin = createNativePlugin('table', DataTable, 'Table');
export const nativeBarPlugin = createNativePlugin('bar', HorizontalBarChart, 'Bar Chart');
export const nativeLinePlugin = createNativePlugin('line', LineChart, 'Line Chart');
export const nativePiePlugin = createNativePlugin('pie', PieChart, 'Pie Chart');
export const nativeChoroplethPlugin = createNativePlugin('choropleth', Choropleth, 'Choropleth');
export const nativeForceGraphPlugin = createNativePlugin('force-graph', ForceGraph, 'Force Graph');
export const nativeTreePlugin = createNativePlugin('tree', TreeView, 'Tree');
```

Plugin ids are fixed strings: `'table'`, `'bar'`, `'line'`, `'pie'`, `'choropleth'`, `'force-graph'`, `'tree'`. These are part of the public contract (documented in the README's table) — do not rename them.

### `src/viz/index.ts`

```ts
export { DataTable } from './data-table.js';
export { HorizontalBarChart } from './horizontal-bar-chart.js';
export { LineChart } from './line-chart.js';
export { PieChart } from './pie-chart.js';
export type { PieChartProps } from './pie-chart.js';
export { Choropleth } from './choropleth.js';
export type { ChoroplethProps } from './choropleth.js';
export { ForceGraph } from './force-graph.js';
export { TreeView } from './tree-view.js';
export type { TreeViewProps } from './tree-view.js';

// Convenience: pre-built plugins for all native charts
export {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
  nativeChoroplethPlugin,
  nativeForceGraphPlugin,
} from './plugins.js';
```

---

## 13. Layer 6 — Plugins (`src/plugins/`): External Chart-Library Adapters

Three adapters, one per external chart library. **None of them import the library they adapt** — this is the load-bearing design decision for this whole layer (Section 2, rule 5). The caller supplies their own chart component (Recharts, Nivo) or drawing callbacks (D3), and the adapter's only job is reshaping VizBox's `TransformedData`/`ThemeDefinition` into what that library expects.

### `src/plugins/d3-adapter.tsx`

The oldest and structurally most complex of the three: D3 draws imperatively into a raw DOM node, so this adapter wraps a `mount`/`update`/`destroy` lifecycle in a React component using refs and effects, rather than a purely declarative `Renderer`.

```tsx
import React, { useEffect, useRef } from 'react';
import type { TransformedData } from '../transforms/types.js';
import type { ThemeDefinition } from '../theme/types.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';

/**
 * Minimal theme tokens extracted from VizBox ThemeDefinition for D3 charts.
 * Keeps D3 charts decoupled from VizBox internals.
 */
export interface D3Theme {
  /** Categorical color palette (for grouping/series). */
  colors: string[];
  /** Sequential color palette (for choropleth, heatmap, etc.). */
  sequentialColors: string[];
  fontFamily: string;
  fontSize: string;
  background: string;
  foreground: string;
  border: string;
}

function toD3Theme(theme: ThemeDefinition): D3Theme {
  return {
    colors: theme.colors.categorical,
    sequentialColors: theme.colors.sequential,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizeSm,
    background: theme.surface.background,
    foreground: theme.text.primary,
    border: theme.surface.border,
  };
}

export interface D3PluginOptions<TData, TConfig = Record<string, unknown>> {
  id: string;
  label?: string;
  /** Reshape TransformedData into whatever structure your D3 code expects. */
  dataAdapter: (data: TransformedData, config?: TConfig) => TData;
  /** Called once when the container mounts. Append SVG/canvas here. */
  mount(container: HTMLDivElement, data: TData, theme: D3Theme, width: number, height: number): void;
  /** Called on every re-render (data/size/theme change). Update the chart in-place. */
  update(container: HTMLDivElement, data: TData, theme: D3Theme, width: number, height: number): void;
  /** Called when the container unmounts. Remove listeners and DOM nodes. */
  destroy(container: HTMLDivElement): void;
}

/**
 * Creates a ChartPlugin backed by a D3 imperative lifecycle.
 * The D3Theme is derived automatically from the VizBox ThemeDefinition.
 *
 * @example
 * ```ts
 * import * as d3 from 'd3';
 * import { createD3Plugin } from 'vizbox/plugins';
 *
 * const bubblePlugin = createD3Plugin({
 *   id: 'bubble',
 *   dataAdapter: (data) => data.rows,
 *   mount(el, data, theme, w, h) {
 *     const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);
 *     svg.selectAll('circle')
 *       .data(data)
 *       .join('circle')
 *       .attr('cx', (d) => Number(d['x'] ?? 0))
 *       .attr('cy', (d) => Number(d['y'] ?? 0))
 *       .attr('r', 6)
 *       .attr('fill', theme.colors[0] ?? 'steelblue');
 *   },
 *   update(el, data, theme, w, h) {
 *     // d3 update pattern
 *   },
 *   destroy(el) {
 *     d3.select(el).selectAll('*').remove();
 *   },
 * });
 *
 * registerPlugin(bubblePlugin);
 * ```
 */
export function createD3Plugin<TData, TConfig = Record<string, unknown>>(
  options: D3PluginOptions<TData, TConfig>,
): ChartPlugin<TData, D3Theme, TConfig> {
  function D3Renderer({
    data, theme, width, height,
  }: RendererProps<TData, D3Theme, TConfig>): React.ReactElement {
    const containerRef = useRef<HTMLDivElement>(null);
    const mountedRef = useRef(false);

    useEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      if (!mountedRef.current) {
        options.mount(el, data, theme, width, height);
        mountedRef.current = true;
      } else {
        options.update(el, data, theme, width, height);
      }
    }, [data, theme, width, height]);

    useEffect(() => {
      const el = containerRef.current;
      return () => {
        if (el && mountedRef.current) {
          options.destroy(el);
          mountedRef.current = false;
        }
      };
    }, []);

    return (
      <div
        ref={containerRef}
        style={{ width, height, overflow: 'hidden' }}
        aria-label={`${options.label ?? options.id} chart`}
      />
    );
  }
  D3Renderer.displayName = `D3Plugin(${options.id})`;

  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: options.dataAdapter,
    themeAdapter: toD3Theme,
    Renderer: D3Renderer,
  };
}
```

**Lifecycle contract, exactly as tested:** `mount` fires exactly once, on the render where `mountedRef.current` is still `false` (effectively "first render after mount"). Every subsequent render where the effect's dependency array (`[data, theme, width, height]`) changed calls `update`, never `mount` again. A re-render with referentially-identical `data`/`theme`/`width`/`height` calls neither (React's effect-dependency comparison skips the effect entirely). `destroy` fires from the second effect's cleanup function on unmount, receiving the same container element `mount`/`update` received. `toD3Theme` is **not exported** — it's only reachable indirectly via a plugin's `.themeAdapter`.

**Do not add a real `import * as d3` anywhere in this file.** The `@example` JSDoc block shows d3 usage because that's what a *caller* writes — the adapter itself has zero d3 import, matching the "dependency-free adapter" rule.

### `src/plugins/__tests__/d3-adapter.test.tsx`

```tsx
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { createD3Plugin } from '../d3-adapter.js';
import type { ThemeDefinition } from '../../theme/types.js';

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

function fakePlugin(id: string, overrides: Partial<{ mount: () => void; update: () => void; destroy: () => void }> = {}) {
  const mount = overrides.mount ?? vi.fn();
  const update = overrides.update ?? vi.fn();
  const destroy = overrides.destroy ?? vi.fn();
  const plugin = createD3Plugin({
    id,
    dataAdapter: (data) => data.rows,
    mount: mount as () => void,
    update: update as () => void,
    destroy: destroy as () => void,
  });
  return { plugin, mount, update, destroy };
}

describe('createD3Plugin theme mapping', () => {
  it('maps ThemeDefinition to D3Theme', () => {
    const { plugin } = fakePlugin('d3-theme-test');
    expect(plugin.themeAdapter(fakeTheme)).toEqual({
      colors: ['#111111', '#222222'],
      sequentialColors: ['#333333'],
      fontFamily: 'Fake Sans',
      fontSize: '11px',
      background: '#aaaaaa',
      foreground: '#000001',
      border: '#cccccc',
    });
  });
});

describe('createD3Plugin Renderer lifecycle', () => {
  it('calls mount once on initial render, not update', () => {
    const { plugin, mount, update } = fakePlugin('d3-lifecycle-mount');
    const theme = plugin.themeAdapter(fakeTheme);
    const { container } = render(<plugin.Renderer data={[]} theme={theme} width={100} height={50} />);
    const el = container.querySelector('div');

    expect(mount).toHaveBeenCalledTimes(1);
    expect(mount.mock.calls[0]?.[0]).toBe(el);
    expect(mount.mock.calls[0]?.[1]).toEqual([]);
    expect(mount.mock.calls[0]?.[2]).toBe(theme);
    expect(mount.mock.calls[0]?.[3]).toBe(100);
    expect(mount.mock.calls[0]?.[4]).toBe(50);
    expect(update).not.toHaveBeenCalled();
  });

  it('calls update (not mount again) when data/width change after mount', () => {
    const { plugin, mount, update } = fakePlugin('d3-lifecycle-update');
    const theme = plugin.themeAdapter(fakeTheme);
    const { rerender, container } = render(<plugin.Renderer data={[]} theme={theme} width={100} height={50} />);
    const el = container.querySelector('div');
    const newData = [{ x: 1 }];

    rerender(<plugin.Renderer data={newData} theme={theme} width={200} height={50} />);

    expect(mount).toHaveBeenCalledTimes(1);
    expect(update).toHaveBeenCalledTimes(1);
    expect(update.mock.calls[0]?.[0]).toBe(el);
    expect(update.mock.calls[0]?.[1]).toBe(newData);
    expect(update.mock.calls[0]?.[2]).toBe(theme);
    expect(update.mock.calls[0]?.[3]).toBe(200);
    expect(update.mock.calls[0]?.[4]).toBe(50);
  });

  it('does not call mount or update again when re-rendered with identical props', () => {
    const { plugin, mount, update } = fakePlugin('d3-lifecycle-stable');
    const theme = plugin.themeAdapter(fakeTheme);
    const data: unknown[] = [];
    const { rerender } = render(<plugin.Renderer data={data} theme={theme} width={100} height={50} />);

    rerender(<plugin.Renderer data={data} theme={theme} width={100} height={50} />);

    expect(mount).toHaveBeenCalledTimes(1);
    expect(update).not.toHaveBeenCalled();
  });

  it('calls destroy with the container element on unmount', () => {
    const { plugin, destroy } = fakePlugin('d3-lifecycle-destroy');
    const theme = plugin.themeAdapter(fakeTheme);
    const { unmount, container } = render(<plugin.Renderer data={[]} theme={theme} width={100} height={50} />);
    const el = container.querySelector('div');

    unmount();

    expect(destroy).toHaveBeenCalledTimes(1);
    expect(destroy.mock.calls[0]?.[0]).toBe(el);
  });
});
```


### `src/plugins/recharts-adapter.ts`

Unlike D3, Recharts components are declarative — the caller supplies a `Renderer` component directly, and this adapter provides a default (overridable) `dataAdapter` that auto-detects which fields to use.

```ts
import type React from 'react';
import type { ThemeDefinition } from '../theme/types.js';
import type { TransformedData } from '../transforms/types.js';
import type { ChartPlugin, RendererProps } from '../registry/types.js';

/**
 * Minimal theme tokens for Recharts components.
 * Extracted from VizBox ThemeDefinition by rechartsThemeAdapter.
 */
export interface RechartsTheme {
  colors: string[];
  fontFamily: string;
  fontSize: string;
  gridColor: string;
  textColor: string;
  background: string;
}

/** Row shape passed to Recharts data arrays. */
export type RechartsRow = Record<string, string | number | null>;

export interface RechartsConfig {
  /** Field name to use as the bar/line value key. Auto-detected if omitted. */
  dataKey?: string;
  /** Field name to use as the category/label key. Auto-detected if omitted. */
  nameKey?: string;
}

/** Shared theme adapter for all Recharts plugins. */
export function rechartsThemeAdapter(theme: ThemeDefinition): RechartsTheme {
  return {
    colors: theme.colors.categorical,
    fontFamily: theme.typography.fontFamily,
    fontSize: theme.typography.fontSizeSm,
    gridColor: theme.surface.border,
    textColor: theme.text.secondary,
    background: theme.surface.background,
  };
}

function defaultDataAdapter(data: TransformedData, config?: RechartsConfig): RechartsRow[] {
  let nameKey = config?.nameKey;
  if (nameKey === undefined) {
    nameKey = data.fields.find((f) => f.type === 'string')?.key;
    if (nameKey === undefined) {
      nameKey = '';
      console.warn(
        '[vizbox] recharts-adapter: no string field found for nameKey auto-detection; ' +
        'defaulting to an empty name for every row. Pass config.nameKey explicitly to silence this warning.',
      );
    }
  }
  let dataKey = config?.dataKey;
  if (dataKey === undefined) {
    dataKey = data.fields.find((f) => f.type === 'number')?.key;
    if (dataKey === undefined) {
      dataKey = '';
      console.warn(
        '[vizbox] recharts-adapter: no number field found for dataKey auto-detection; ' +
        'defaulting to a zero value for every row. Pass config.dataKey explicitly to silence this warning.',
      );
    }
  }
  return data.rows.map((r) => ({
    name: String(r[nameKey] ?? ''),
    value: Number(r[dataKey] ?? 0),
    ...Object.fromEntries(
      Object.entries(r).map(([k, v]) => [k, v === null ? null : (typeof v === 'number' ? v : String(v))]),
    ),
  }));
}

/**
 * Creates a Recharts bar (or any) chart plugin.
 * You supply only the Recharts Renderer component; data reshaping and
 * theme bridging are handled automatically.
 *
 * @example
 * ```tsx
 * import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
 * import { createRechartsPlugin } from 'vizbox/plugins';
 *
 * registerPlugin(createRechartsPlugin({
 *   id: 'recharts-bar',
 *   label: 'Bar (Recharts)',
 *   Renderer: ({ data, theme, width, height, config }) => (
 *     <BarChart width={width} height={height} data={data}>
 *       <CartesianGrid stroke={theme.gridColor} />
 *       <XAxis dataKey={config?.nameKey ?? 'name'} tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
 *       <YAxis tick={{ fill: theme.textColor }} />
 *       <Tooltip />
 *       <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0]} />
 *     </BarChart>
 *   ),
 * }));
 * ```
 */
export function createRechartsPlugin(options: {
  id: string;
  label?: string;
  Renderer: React.ComponentType<RendererProps<RechartsRow[], RechartsTheme, RechartsConfig>>;
  /** Override the default data reshaping if needed. */
  dataAdapter?: (data: TransformedData, config?: RechartsConfig) => RechartsRow[];
}): ChartPlugin<RechartsRow[], RechartsTheme, RechartsConfig> {
  return {
    id: options.id,
    label: options.label ?? options.id,
    dataAdapter: options.dataAdapter ?? defaultDataAdapter,
    themeAdapter: rechartsThemeAdapter,
    Renderer: options.Renderer,
  };
}
```

**The `console.warn` calls in `defaultDataAdapter` are load-bearing, not incidental logging.** An earlier version silently fell back to `''` for `nameKey`/`dataKey` with no warning when no matching field type existed — every row then mapped to `{ name: '', value: 0, ... }` with zero signal to the developer that auto-detection failed (this produces an empty-looking chart with no error). The fix adds a `console.warn` naming which key failed and why, while still rendering (a thrown error here would break the whole `ViewSwitcher` tree over what might be a minor, single-tab data quirk — see Section 15, bug 3, for the full reasoning on why "warn and keep rendering" was chosen over "throw"). Do not remove these warnings or make them silent again. Do not upgrade them to thrown errors either, without a human decision to change that tradeoff.

Also note: `defaultDataAdapter` coerces every extra field's value with `typeof v === 'number' ? v : String(v)` (except `null`, preserved as `null`) — booleans become `'true'`/`'false'` strings here (contrast with `geoNormalize`, which coerces booleans to `1`/`0`). This is a real, if minor, inconsistency between two transform-adjacent pieces of the codebase; it's tested/locked-in behavior in this file, not a bug to unify.

### `src/plugins/__tests__/recharts-adapter.test.ts`

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { createRechartsPlugin, rechartsThemeAdapter } from '../recharts-adapter.js';
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

const withBothFields: TransformedData = {
  rows: [{ region: 'East', sales: 100 }],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'sales', type: 'number' },
  ],
};

const numbersOnly: TransformedData = {
  rows: [{ sales: 100, returns: 5 }],
  fields: [
    { key: 'sales', type: 'number' },
    { key: 'returns', type: 'number' },
  ],
};

const stringsOnly: TransformedData = {
  rows: [{ region: 'East', city: 'NYC' }],
  fields: [
    { key: 'region', type: 'string' },
    { key: 'city', type: 'string' },
  ],
};

function plugin() {
  return createRechartsPlugin({ id: 'rc-test', Renderer: () => null });
}

describe('recharts-adapter defaultDataAdapter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('auto-detects nameKey/dataKey and does not warn when both field types are present', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(withBothFields);
    expect(rows).toEqual([{ region: 'East', sales: 100, name: 'East', value: 100 }]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('warns and falls back to an empty name when no string field exists', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(numbersOnly);
    expect(rows[0]?.name).toBe('');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/nameKey/);
  });

  it('warns and falls back to a zero value when no number field exists', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(stringsOnly);
    expect(rows[0]?.value).toBe(0);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/dataKey/);
  });

  it('does not warn when nameKey/dataKey are given explicitly, even if field types would not auto-detect', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const rows = plugin().dataAdapter(numbersOnly, { nameKey: 'sales', dataKey: 'returns' });
    expect(rows[0]).toEqual({ sales: 100, returns: 5, name: '100', value: 5 });
    expect(warn).not.toHaveBeenCalled();
  });

  it('coerces boolean and null extra fields, and handles multiple rows', () => {
    const data: TransformedData = {
      rows: [
        { region: 'East', sales: 100, active: true, note: null },
        { region: 'West', sales: 200, active: false, note: null },
      ],
      fields: [
        { key: 'region', type: 'string' },
        { key: 'sales', type: 'number' },
      ],
    };
    const rows = plugin().dataAdapter(data);
    expect(rows).toEqual([
      { region: 'East', sales: 100, active: 'true', note: null, name: 'East', value: 100 },
      { region: 'West', sales: 200, active: 'false', note: null, name: 'West', value: 200 },
    ]);
  });
});

describe('rechartsThemeAdapter', () => {
  it('maps ThemeDefinition to RechartsTheme', () => {
    expect(rechartsThemeAdapter(fakeTheme)).toEqual({
      colors: ['#111111', '#222222'],
      fontFamily: 'Fake Sans',
      fontSize: '11px',
      gridColor: '#cccccc',
      textColor: '#000002',
      background: '#aaaaaa',
    });
  });
});

describe('createRechartsPlugin wiring', () => {
  it('defaults label to id', () => {
    const p = createRechartsPlugin({ id: 'rc-wiring-1', Renderer: () => null });
    expect(p.label).toBe('rc-wiring-1');
  });

  it('uses the provided label when given', () => {
    const p = createRechartsPlugin({ id: 'rc-wiring-2', label: 'My Chart', Renderer: () => null });
    expect(p.label).toBe('My Chart');
  });

  it('uses rechartsThemeAdapter as the themeAdapter', () => {
    const p = createRechartsPlugin({ id: 'rc-wiring-3', Renderer: () => null });
    expect(p.themeAdapter(fakeTheme)).toEqual(rechartsThemeAdapter(fakeTheme));
  });

  it('uses a custom dataAdapter instead of the default when provided', () => {
    const customDataAdapter = vi.fn(() => [{ name: 'custom', value: 1 }]);
    const p = createRechartsPlugin({ id: 'rc-wiring-4', Renderer: () => null, dataAdapter: customDataAdapter });
    const result = p.dataAdapter(withBothFields);
    expect(customDataAdapter).toHaveBeenCalledWith(withBothFields);
    expect(result).toEqual([{ name: 'custom', value: 1 }]);
  });

  it('passes the Renderer through unchanged', () => {
    const Renderer = () => null;
    const p = createRechartsPlugin({ id: 'rc-wiring-5', Renderer });
    expect(p.Renderer).toBe(Renderer);
  });
});
```


### `src/plugins/nivo-adapter.ts`

The third and newest adapter, added as a reference implementation proving the plugin architecture generalizes beyond the two libraries it was originally designed against. Two decisions here differ deliberately from the Recharts adapter — see the design-decisions log (Section 16) for the full reasoning, summarized in the comments below.

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
 * import { createNivoPlugin } from 'vizbox/plugins';
 *
 * registerPlugin(createNivoPlugin<{ name: string; value: number }[], { dataKey?: string; nameKey?: string }>({
 *   id: 'nivo-bar',
 *   label: 'Bar (Nivo)',
 *   dataAdapter: (data) => data.rows as { name: string; value: number }[],
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

**Two decisions that deliberately diverge from `createRechartsPlugin` — do not "fix" this into matching Recharts:**

1. **`dataAdapter` is required, with no default**, unlike Recharts' auto-detecting `defaultDataAdapter`. Nivo chart types disagree too sharply on data shape for a safe universal default: bar wants flat rows, pie wants `{id, value}[]`, line wants `{id, data: [{x,y}]}[]`. Guessing wrong would silently produce a broken chart. This matches `createD3Plugin`'s precedent (also a required `dataAdapter`), not Recharts'.
2. **`NivoTheme` mirrors Nivo's real nested `theme`-prop shape** (`background`, `text`, `axis.{domain,ticks,legend}`, `grid`, `tooltip`), rather than being a flat token bag like `D3Theme`/`RechartsTheme`. D3 has no formal theme prop (you paint SVG yourself) and Recharts components take individual style props, so a flat bag is the right fit there. Nivo is different: every Nivo chart accepts one `theme` object prop with this exact nested shape. Producing that shape directly lets a caller do `<ResponsiveBar theme={theme} colors={theme.colors} />` with zero manual reshaping.

**One conversion detail to preserve:** `theme.typography.fontSizeSm` is a CSS string (`'12px'`) but Nivo's theme wants a bare number, hence `parseInt(theme.typography.fontSizeSm, 10)`. This has a known, deliberately-accepted edge case: it silently produces `0`/`NaN` for a theme whose `fontSizeSm` uses non-pixel units (e.g. `'0.875rem'`). This was flagged during code review and explicitly parked (not fixed) since neither shipped theme (`light.ts`/`dark.ts`) triggers it. If ever hardening this, use `parseFloat` with a `Number.isFinite` guard and a sane fallback (e.g. `12`) — but that change has not been made in the current codebase; reproduce the `parseInt` as-is unless deliberately fixing it.

### `src/plugins/__tests__/nivo-adapter.test.ts`

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

### `src/plugins/index.ts`

```ts
export { createD3Plugin } from './d3-adapter.js';
export type { D3Theme, D3PluginOptions } from './d3-adapter.js';

export { createRechartsPlugin, rechartsThemeAdapter } from './recharts-adapter.js';
export type { RechartsTheme, RechartsRow, RechartsConfig } from './recharts-adapter.js';

export { createNivoPlugin, nivoThemeAdapter } from './nivo-adapter.js';
export type { NivoTheme, NivoPluginOptions } from './nivo-adapter.js';
```

Note `toD3Theme` is deliberately **not** in this list (it's internal to `d3-adapter.tsx`) while `rechartsThemeAdapter` and `nivoThemeAdapter` **are** exported — this is intentional: the D3 adapter's theme conversion is always automatic and never needs to be called directly by a consumer, while Recharts/Nivo consumers writing a custom `dataAdapter` sometimes want to call the theme adapter directly too (e.g. for testing, or for composing a hybrid plugin).

---

## 14. Top-Level Barrel (`src/index.ts`)

```ts
// Theme layer
export { ThemeProvider, useTheme, lightTheme, darkTheme } from './theme/index.js';
export { categoricalColor, sequentialColor, divergingColor, thresholdScale } from './theme/index.js';
export type {
  ThemeDefinition,
  ColorPalette,
  TypographyTokens,
  SpacingTokens,
  SurfaceTokens,
  TextTokens,
  ThemeProviderProps,
} from './theme/index.js';

// Transform layer
export {
  flatten,
  aggregate,
  pivot,
  groupBy,
  geoNormalize,
  TransformPipeline,
} from './transforms/index.js';
export type {
  DataRow,
  DataTransform,
  ChainableTransform,
  TransformedData,
  FieldMeta,
  HierarchyNode,
  GeoData,
  GeoFeature,
  FlattenOptions,
  AggregateOptions,
  AggregationFn,
  PivotOptions,
  GroupByOptions,
  GeoNormalizeOptions,
} from './transforms/index.js';

// Plugin registry
export { registerPlugin, getPlugin, listPlugins, registerAndGetId } from './registry/index.js';
export type { ChartPlugin, ViewSpec, RendererProps } from './registry/types.js';
export { createNativePlugin } from './registry/native-plugin.js';
export type { NativeChartProps, NativeConfig } from './registry/native-plugin.js';

// Core layer
export {
  WidgetContainer,
  ViewSwitcher,
  CollapseManager,
  useCollapse,
} from './core/index.js';
export type {
  WidgetContainerProps,
  ViewSwitcherProps,
  CollapseManagerProps,
  CollapseState,
} from './core/index.js';

// Viz layer (re-export key symbols — consumers can also import from 'vizbox/viz')
export {
  DataTable,
  HorizontalBarChart,
  LineChart,
  PieChart,
  Choropleth,
  ForceGraph,
  TreeView,
} from './viz/index.js';

// Plugin layer
export { createD3Plugin, createRechartsPlugin, createNivoPlugin } from './plugins/index.js';
export type { D3Theme, RechartsTheme, RechartsConfig, NivoTheme } from './plugins/index.js';
```

**Deliberate asymmetry, verified against precedent — preserve it:** this top-level barrel exports each adapter's **factory function and its primary theme type**, but **not** `rechartsThemeAdapter`, `nivoThemeAdapter`, `D3PluginOptions`, `NivoPluginOptions`, or `RechartsRow` — those remain reachable only via `vizbox/plugins` (Section 13). Similarly, `__resetRegistryForTests` from the registry layer is absent here entirely (Section 10). When adding a fourth adapter, follow the same split: full surface in `plugins/index.ts`, factory + primary theme type only at the top level.

---

## 15. Known Bugs Found & Fixed During QA — Do Not Reintroduce

The skeptical QA review (`.planning/test-suite-qa-review-2026-08-09.md`) found five distinct real bugs by reading untested code paths, not by measuring coverage percentages. All five are already fixed in the source given in Sections 8–14 above. They are collected here as a single definitive numbered list because several earlier sections cross-reference them by number, and this is the list those numbers resolve to. A sixth item — a dead API parameter in `pipeline.ts` — is included at the end because it was found and fixed during the same review, but it is deliberately **not** numbered alongside the five: nothing ever consumed it, so it never produced a wrong result, unlike bugs 1–5 which all had an observable incorrect behavior.

Each entry gives: what the naive/broken implementation looked like, why it's wrong, how it was proven wrong (test written first), and how it was fixed. If you are reconstructing this codebase from scratch and arrive at the "obvious" implementation described in "Broken form," stop — that is the exact bug this section exists to prevent.

### Bug 1 — `flatten.ts` silently drops `Date` values

- **Where:** `src/transforms/flatten.ts`, inside the recursive `flattenRow` walk.
- **Broken form:** flatten's recursion branch is guarded by `typeof value === 'object' && value !== null && !Array.isArray(value)`. A JavaScript `Date` instance satisfies that guard (`typeof someDate === 'object'`), so the naive implementation recurses into it via `Object.entries(value)`. But a `Date`'s internal timestamp is not an own enumerable property — `Object.entries(new Date())` is `[]`. The recursion produces zero keys for that field, so it silently vanishes from the flattened output row. No error, no warning, no test failure unless you specifically assert the field still exists.
- **Why it matters:** any caller flattening real-world data containing `Date` objects (extremely common — API responses, ORM results) loses those columns entirely with no signal.
- **Proof:** `src/transforms/__tests__/flatten.test.ts` asserts a row containing a `Date` field produces an output row where that field is present and equals the ISO string, run against the old code first to confirm it failed (the field was simply absent from the result object).
- **Fix:** add an explicit `value instanceof Date` branch **before** the generic-object recursion check, converting to `value.toISOString()`.

### Bug 2 — `flatten.ts`'s `inferType` misclassifies year-like numeric strings as dates

- **Where:** `src/transforms/flatten.ts`, `inferType` function.
- **Broken form:** `inferType` tries `!isNaN(Date.parse(v))` directly on every string value to decide if a column is a `'date'` column. `Date.parse` is far more permissive than intuition suggests: `Date.parse("2020")` succeeds (interpreted as January 1, 2020 UTC). A column of ordinary numeric-looking strings like `"2020"`, `"1999"`, `"2023"` (e.g. a "founding year" field) gets classified as `'date'` instead of `'string'` or `'number'`.
- **Why it matters:** downstream consumers that branch on inferred field type (axis formatting, sort order, chart type selection) mishandle the column.
- **Proof:** `flatten.test.ts` includes a case asserting a column of `"2020"`-style strings infers as `'string'` (or `'number'`, depending on the fixture), confirmed to fail against the old direct-`Date.parse` check.
- **Fix:** guard with `typeof v === 'string' && isNaN(Number(v)) && !isNaN(Date.parse(v))` — only attempt the date interpretation once the value has already failed a plain numeric parse. A companion test confirms a genuine date string (e.g. `"2020-01-15"`) still correctly infers as `'date'`, so the fix doesn't overcorrect.

### Bug 3 — `recharts-adapter.ts`'s `defaultDataAdapter` silently falls back with no signal

- **Where:** `src/plugins/recharts-adapter.ts`, `defaultDataAdapter`.
- **Broken form:** when no field of a matching type is found for `nameKey`/`dataKey` auto-detection, the naive implementation falls back to `''` for the missing key with no warning. Every row then maps to something like `{ name: '', value: 0 }` — Recharts renders an empty-looking or all-zero chart, and there is nothing in the console or return value indicating why.
- **Why it matters:** this is a silent-failure mode exactly where developers most need a signal — the chart *looks* broken but gives no clue that the cause is a data-shape mismatch, not a Recharts bug.
- **Proof:** a test spies on `console.warn` and asserts it is called (naming which key — `nameKey` or `dataKey` — failed to auto-detect) when the fallback path is hit, confirmed to fail against the old silent version.
- **Fix:** add `console.warn` calls naming the specific failed key, while still returning the fallback and rendering (see the design-decision note below on why "warn and keep rendering" was chosen over "throw").

### Bug 4 — `native-plugin.tsx`'s config-spread-order lets a colliding key clobber real props

- **Where:** `src/registry/native-plugin.tsx`, `NativeRenderer`.
- **Broken form:** `<Component data={data} theme={theme} width={width} height={height} {...config} />` — config spread **last**. If `config` happens to contain a key literally named `data`, `theme`, `width`, or `height`, that spread overwrites the real prop with whatever garbage value the config object had.
- **Why this typechecks at all:** `NativeConfig` is defined as `Omit<NativeChartProps, 'data' | 'width' | 'height' | 'theme'>`. `Omit` removes those four property names from the type's *named* members, but `NativeChartProps` also carries an index signature (`[key: string]: unknown`) for arbitrary passthrough config keys, and `Omit` does not remove index signatures. So `NativeConfig` still structurally permits a `data` key — a `{ data: 'evil' }` object literal typechecks as a valid `NativeConfig` with zero compiler complaint.
- **Why it matters:** any consumer whose config object happens to reuse one of those four names (easy to do by accident, e.g. a chart-specific `width` sub-option) gets a chart silently rendered with the wrong dimensions or wrong data, with no error anywhere.
- **Proof:** `src/registry/__tests__/native-plugin.test.tsx`, test `'never lets a colliding config key override the real data/theme/width/height props'` — passes `config: { data: 'clobbered', theme: 'clobbered', width: -1, height: -1 }` alongside real `data`/`theme`/`width`/`height` props and asserts the real values won. Confirmed to fail against the old spread order first.
- **Fix:** reorder to `<Component {...config} data={data} theme={theme} width={width} height={height} />` — config spread **first**, so the explicit real props always win regardless of what keys `config` contains.

### Bug 5 — RTL doesn't clean up between tests in the same file

- **Where:** test infrastructure, not source code — `vitest.setup.ts` / `vitest.config.ts`.
- **Broken form:** `@testing-library/react` auto-registers a global `afterEach(cleanup)` **only if it detects Vitest's globals API is active**, which requires `test.globals: true` in `vitest.config.ts`. This project's `vitest.config.ts` does not set that flag (deliberately — see Section 7's note on why globals are off), and no manual `afterEach(() => cleanup())` existed anywhere. Every `render()` call across every test in a given file left its DOM mounted; the next test's `render()` just added more DOM on top.
- **Why it matters:** tests asserting against a specific `data-testid` or a scoped container still pass by coincidence (they find their own element regardless of leftover siblings). Tests that query broadly — `screen.queryAllByRole('tab')`, `screen.getAllByText(...)` — silently over-count, because they're matching against every previous test's leaked DOM plus the current test's DOM. This was caught only because a P2 test explicitly asserted `queryAllByRole('tab')` returns **zero** results for an empty `views` array, and it returned 10 instead (leftover tabs from every earlier test in `view-switcher.test.tsx`).
- **Proof:** the empty-`views` test in `src/core/__tests__/view-switcher.test.tsx` failed with an unexpected non-zero count before the fix; confirmed the full 82-test suite still passed after the fix (ruling out that the fix broke anything relying on stale DOM, which nothing did).
- **Fix:** add `afterEach(() => cleanup())` from `@testing-library/react` (plus the `import { afterEach } from 'vitest'` and `import { cleanup } from '@testing-library/react'` it needs) to `vitest.setup.ts`, shown in full in Section 7.

### Related, unnumbered — `pipeline.ts` had a dead, never-forwarded `options` parameter

- **Where:** `src/transforms/pipeline.ts`, `PipelineStep.transform`.
- **What it was:** an earlier version of the type was `transform(data: TransformedData, options?: Record<string, unknown>): TransformedData`, suggesting callers could pass per-step configuration through `TransformPipeline.run()`. But `run()` never actually read or forwarded a second argument to any step after the first — the parameter was pure dead API surface. It didn't produce a *wrong* result (nothing consumed it, so there was nothing to get wrong) — it was a trap for the next implementer, who might reasonably assume passing `{ someOption: true }` as a second `run()` argument would work, when it silently does nothing.
- **Why it's listed separately from bugs 1–5:** those five all had an observable incorrect output or missing cleanup. This one had no observable effect at all until someone tried to rely on it, at which point it would silently no-op rather than error — arguably worse ergonomics, but not a "the code produces a wrong answer" bug in the same sense.
- **Proof:** `src/transforms/__tests__/pipeline.test.ts` includes a regression test asserting that a step function after the first in a chain receives **exactly one** argument — locking in "no hidden options-forwarding channel exists" as intended behavior, not an oversight.
- **Fix:** remove the `options` parameter from the `PipelineStep.transform` type entirely. If a step needs configuration, close over it in a plain closure at the call site (see the `chains flatten → aggregate` test in `pipeline.test.ts` for the pattern) — do not add the parameter back.

## 16. Design Decisions Log

This is a consolidated list of deliberate behaviors that could be mistaken for bugs — each one was flagged inline where it occurs (Sections 8–14), and is repeated here as a single lookup table so a rebuild doesn't "fix" any of them without a human decision. Unlike Section 15, none of these are wrong; they are judgment calls the QA review explicitly considered and chose to leave as-is, usually documenting the choice with a test rather than changing the code.

1. **`aggregate.ts` returns `0`, not `null`/throw, for an empty numeric bucket.** If a `groupBy` bucket has zero rows contributing a numeric value to an aggregated field, `applyAgg` silently returns `0`. This is inconsistent with the Recharts adapter's analogous case (Bug 3, Section 15), which warns instead of failing silently — the QA review scoped `aggregate.ts`'s case as "add a test locking in current behavior," not "fix," because changing the return type from `number` to `number | null` would be a breaking API change requiring every consumer to handle the new case, and no evidence existed that any real caller was affected. Revisit only with a human decision, since it changes a public return type.

2. **`recharts-adapter.ts` warns and still renders, rather than throwing, when auto-detection fails.** The alternative (throwing) was explicitly considered and rejected: throwing here would crash the entire `ViewSwitcher` tree over what might be a single misconfigured tab, which is worse than one chart rendering visibly-empty with a console warning explaining why.

3. **`native-plugin.tsx`'s config spread order (config first, then explicit props) is the fix, not a stylistic choice.** Covered fully as Bug 4 in Section 15; listed again here because it's easy to "clean up" back to the broken order if someone reads the code without the test.

4. **`WidgetContainer` renders at `0×0` for one frame before the `ResizeObserver` reports a real size, when a dimension is given as a CSS string (e.g. `'100%'`) rather than a number.** This is intentional — there is no synchronous way to know a percentage-based dimension's pixel size before layout happens, and jsdom (and real browsers) only report it asynchronously via `ResizeObserver`. Consumers rendering percentage-sized `WidgetContainer`s should expect and handle a `0×0` initial render (e.g. children should tolerate zero dimensions gracefully, typically by rendering nothing until width/height are positive).

5. **`ViewSwitcher` silently falls back to `views[0]` when `activeView` names an id that doesn't exist in `views`.** No warning, no error — just renders the first view instead. This was explicitly flagged in the QA review as "do not fix without a human decision," because the alternative behaviors (throw, render nothing, render an error state) are all plausible and the review didn't have enough information about real consumer expectations to pick one. A test locks in the current fallback-to-first behavior; changing it is a legitimate design conversation, not a bug fix.

6. **`ViewSwitcher` renders normally (empty tab strip, no content) when `views` is an empty array**, rather than throwing or rendering a placeholder message. Locked in by a P2 test. Considered acceptable because an empty `views` array is a valid (if unusual) transient state, e.g. while views are being computed asynchronously.

7. **The tab strip height is a hardcoded constant, `tabH = 36`,** not derived from the theme or measured from rendered content. Every height calculation passed down to a plugin's renderer (`height - 36`) depends on this. If the visual tab strip height ever changes (font size, padding), this constant must be updated by hand — it will not track the change automatically. This is a known, accepted simplification, not an oversight.

8. **`CollapseManager`'s `useCollapse` throws when called outside a `CollapseManager`, while `theme/provider.tsx`'s `useTheme` silently falls back to `lightTheme` when called outside a `ThemeProvider`.** These two hooks intentionally have opposite failure modes. Theme has a safe, sensible default (light theme) so components can be used in isolation (e.g. in tests, in Storybook) without wrapping boilerplate. Collapse state has no sensible default — a component that calls `useCollapse` needs real shared state to coordinate with siblings, and silently returning fake/local state would produce confusing, hard-to-debug behavior (each caller getting its own disconnected collapse state instead of a shared error). Do not make these two hooks consistent with each other; the inconsistency is the correct design.

9. **`Choropleth` renders an informational placeholder, not a real map, when no `projectedPaths` are supplied.** There is deliberately no geographic-projection library dependency anywhere in this codebase (see Rule 5 in Section 2 — zero runtime dependencies beyond React). `Choropleth` expects the caller to supply already-projected SVG path data; without it, the component cannot draw a map, so it renders a clear placeholder rather than either crashing or silently rendering nothing.

10. **`ForceGraph`'s O(n²) force simulation runs its layout pass exactly once, gated by an `initialized` ref**, not on every render or every data change. This is a deliberate performance/simplicity tradeoff for a reference implementation — real force-directed layouts either re-run continuously (expensive, needs its own scheduler) or accept a one-shot initial layout (cheap, static after mount). This codebase takes the one-shot approach. A doc comment on the component states the O(n²) complexity explicitly so a future implementer doesn't scale it up to thousands of nodes without addressing this.

11. **`ForceGraph`'s edge rows are distinguished from node rows structurally** (presence vs. absence of a `source` field on the row), not via a discriminant `type` field. This mirrors how flattened/transformed tabular data naturally arrives (one row shape, distinguished by which optional fields are populated) rather than requiring callers to inject an artificial type tag.

12. **`TreeNodeRow` (inside `tree-view.tsx`) takes `theme` as an explicit prop, never via `useTheme()`.** Every other viz component reads theme from context. `TreeNodeRow` is recursive (a node renders its own children as more `TreeNodeRow`s), and threading `theme` explicitly through props — rather than each recursive instance independently calling `useTheme()` — was chosen so the whole recursive tree is guaranteed to render with one single consistent theme snapshot, immune to a theoretical context update landing mid-recursion.

13. **The Nivo adapter's `dataAdapter` is a required field with no default**, unlike the Recharts adapter, which provides `defaultDataAdapter` as a fallback when the caller doesn't supply one. This is a deliberate divergence, not an inconsistency to "fix into matching." Nivo's chart data shapes vary far more wildly across its chart types (bar vs. line vs. pie vs. heatmap all expect structurally different data) than Recharts', so a single sensible auto-detection heuristic isn't realistic — forcing the caller to always supply `dataAdapter` explicitly is safer than guessing wrong silently.

14. **`NivoTheme` is a nested object structure** (mirroring Nivo's real `theme` prop shape, e.g. `theme.typography.fontSizeSm`) **plus a separate flat `colors` convenience field**, whereas `D3Theme` and `RechartsTheme` are flat. This mirrors the actual shape Nivo's real theming API expects (so a real Nivo consumer's `theme` prop assignment is a direct passthrough of `nivoThemeAdapter`'s output), while `colors` is added on top purely for convenience since categorical colors are the single most commonly needed value.

15. **`nivoThemeAdapter` uses `parseInt(theme.typography.fontSizeSm, 10)` to convert a CSS font-size string to a bare number Nivo expects**, and this is a known, deliberately parked edge case: it assumes the string is a `px` value (or otherwise starts with a parseable integer) and will silently produce wrong results for a theme using `rem`, `em`, or other units (e.g. `parseInt('1.5rem', 10)` → `1`, which is very wrong for a font size). This was identified during the Nivo adapter's build and explicitly scoped out as future work rather than blocking the adapter's initial release — VizBox's two built-in themes (`light.ts`, `dark.ts`) both use `px` throughout, so it doesn't manifest with the shipped themes, but a custom theme using other units would hit it.

16. **The top-level barrel (`src/index.ts`) and the plugins barrel (`src/plugins/index.ts`) export deliberately asymmetric surfaces** — see the callout at the end of Section 14. Full detail: `src/index.ts` exports each adapter's factory function and *primary* theme type only; secondary theme-adapter functions (`rechartsThemeAdapter`, `nivoThemeAdapter`), secondary option types (`D3PluginOptions`, `NivoPluginOptions`, `RechartsRow`), and `toD3Theme` are reachable only via `vizbox/plugins`. This keeps the top-level import surface small and focused on "the thing most consumers need" (register a chart), while power users who need direct access to a theme-adapter function (e.g. to reuse it outside a plugin) import from the more specific `vizbox/plugins` path.

17. **`__resetRegistryForTests` exists specifically to support tests, and must never be added to any public barrel's explicit export list.** Both `src/core/index.ts` and `src/index.ts` re-export by naming each symbol individually — never `export *` — which is what keeps this test-only function out of the public API automatically, as long as its name is never added to those export statements. It is imported directly from `src/registry/index.js` (not through a barrel) in every test file that calls `registerPlugin`, since the registry is a single shared module-level `Map` and would otherwise leak registered plugin ids across test files.

## 17. Full `README.md` Text (Verbatim)

Reproduce this file exactly at the repo root. It is the user-facing documentation and is validated by the compiling-example check in Section 18 (the Nivo example in particular must retain its explicit generic type parameters — see Section 13's callout on why the plain-inference version doesn't typecheck).

````markdown
# VizBox

A layered React + TypeScript UI library for data visualization widgets. Works with tabular, hierarchical, geographic, and time-series data. Plug in any chart library — built-in SVG charts, D3, Recharts, Nivo, or your own.

## Install

```bash
npm install vizbox
# peer deps
npm install react react-dom
# optional: for D3-based charts
npm install d3
# optional: for Recharts-based charts
npm install recharts
# optional: for Nivo-based charts
npm install @nivo/bar
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  CONTAINER LAYER                                        │
│  WidgetContainer  (ResizeObserver, pipeline, title)     │
│  ViewSwitcher     (tab strip, delegates to plugin)      │
│  CollapseManager  (expand/collapse drill-down)          │
├─────────────────────────────────────────────────────────┤
│  PLUGIN REGISTRY  src/registry/                         │
│  ChartPlugin<TData, TTheme, TConfig>                    │
│    dataAdapter:  TransformedData → TData                │
│    themeAdapter: ThemeDefinition → TTheme               │
│    Renderer:     { data, theme, width, height, config } │
├─────────────────────────────────────────────────────────┤
│  THEME LAYER  src/theme/                                │
│  ThemeProvider · useTheme · lightTheme · darkTheme      │
│  categoricalColor · sequentialColor · divergingColor    │
├─────────────────────────────────────────────────────────┤
│  TRANSFORM LAYER  src/transforms/                       │
│  flatten · aggregate · pivot · groupBy · geoNormalize   │
│  TransformPipeline                                      │
└─────────────────────────────────────────────────────────┘
```

Each layer may only import from layers below it. The transform layer has zero React dependencies.

---

## 5-minute quickstart

```tsx
import { ThemeProvider, WidgetContainer, ViewSwitcher, groupBy, registerPlugin } from 'vizbox';
import { nativeBarPlugin, nativeTablePlugin } from 'vizbox/viz';

// 1. Register the plugins you want to switch between (once at app startup)
registerPlugin(nativeBarPlugin);
registerPlugin(nativeTablePlugin);

// 2. Your raw data — any shape
const salesData = [
  { region: 'North', product: 'Widget A', revenue: 12000 },
  { region: 'North', product: 'Widget B', revenue: 8500 },
  { region: 'South', product: 'Widget A', revenue: 9300 },
  { region: 'South', product: 'Widget B', revenue: 14200 },
];

// 3. Wrap in ThemeProvider + WidgetContainer
export function SalesWidget() {
  return (
    <ThemeProvider theme="dark">
      <WidgetContainer
        data={salesData}
        transforms={[groupBy('region', 'revenue')]}
        title="Revenue by Region"
        width={600}
        height={400}
      >
        {(data, width, height) => (
          <ViewSwitcher
            views={[{ id: 'bar', label: 'Bar Chart' }, { id: 'table', label: 'Table' }]}
            data={data}
            width={width}
            height={height}
          />
        )}
      </WidgetContainer>
    </ThemeProvider>
  );
}
```

---

## Core concepts

### WidgetContainer

Runs data through a transform pipeline and provides the result to children via a render prop. Supports fluid sizing via ResizeObserver — pass `width="100%"` and let the DOM drive the dimensions.

```tsx
<WidgetContainer data={raw} transforms={[flatten, aggregate({ groupBy: ['x'], aggregations: { y: 'sum' } })]}>
  {(transformedData, width, height) => (
    <ViewSwitcher views={[{ id: 'bar' }]} data={transformedData} width={width} height={height} />
  )}
</WidgetContainer>
```

### ViewSwitcher

Renders a tab strip and the active plugin. Controlled or uncontrolled.

```tsx
<ViewSwitcher
  views={[
    { id: 'bar', label: 'Bar Chart' },
    { id: 'table', label: 'Table' },
    { id: 'my-d3-chart', label: 'Custom' },
  ]}
  data={data}
  width={600}
  height={400}
  activeView="bar"
  onViewChange={(id) => setActiveView(id)}
/>
```

### CollapseManager

Provides expand/collapse state and drill-down/roll-up navigation for hierarchical widgets.

```tsx
<CollapseManager defaultExpanded={['root']}>
  <TreeView data={hierarchicalData} width={400} height={500} theme={theme} />
</CollapseManager>
```

Access from any descendant:

```tsx
const { drillDown, rollUp, drillPath, isExpanded, toggle } = useCollapse();
```

### Transform pipeline

```tsx
import { TransformPipeline, flatten, aggregate, groupBy } from 'vizbox';

const pipeline = new TransformPipeline([
  flatten,                            // normalize nested objects
  groupBy('category', 'revenue'),     // group + build hierarchy
]);

const result = pipeline.run(rawData); // → TransformedData
```

---

## Built-in visualizations

Register any of the pre-built native plugins at startup:

```tsx
import { registerPlugin } from 'vizbox';
import {
  nativeBarPlugin,
  nativeLinePlugin,
  nativePiePlugin,
  nativeTablePlugin,
  nativeTreePlugin,
  nativeChoroplethPlugin,
  nativeForceGraphPlugin,
} from 'vizbox/viz';

registerPlugin(nativeBarPlugin);    // id: 'bar'
registerPlugin(nativeLinePlugin);   // id: 'line'
registerPlugin(nativePiePlugin);    // id: 'pie'
registerPlugin(nativeTablePlugin);  // id: 'table'
registerPlugin(nativeTreePlugin);   // id: 'tree'
registerPlugin(nativeChoroplethPlugin); // id: 'choropleth'
registerPlugin(nativeForceGraphPlugin); // id: 'force-graph'
```

| Plugin id | Chart | Required data shape |
|-----------|-------|---------------------|
| `line` | LineChart | rows with x (string/date) and y (number) fields |
| `bar` | HorizontalBarChart | rows with a label (string) and value (number) field |
| `pie` | PieChart | rows with a label and value field |
| `choropleth` | Choropleth | `TransformedData` with `.geo` from `geoNormalize` |
| `force-graph` | ForceGraph | rows with `id`/`label`, plus edge rows with `source`/`target` |
| `tree` | TreeView | `TransformedData` with `.hierarchy` from `groupBy` |
| `table` | DataTable | any rows |

---

## Plugging in a D3 chart

```tsx
import * as d3 from 'd3';
import { createD3Plugin, registerPlugin } from 'vizbox';

registerPlugin(createD3Plugin({
  id: 'bubble',
  label: 'Bubble Chart',
  dataAdapter: (data) => data.rows,    // reshape for D3
  mount(el, rows, theme, w, h) {
    const svg = d3.select(el).append('svg').attr('width', w).attr('height', h);
    svg.selectAll('circle')
      .data(rows)
      .join('circle')
      .attr('cx', (d) => Number(d['x'] ?? 0))
      .attr('cy', (d) => Number(d['y'] ?? 0))
      .attr('r', 6)
      .attr('fill', theme.colors[0] ?? 'steelblue');  // theme is D3Theme
  },
  update(el, rows, theme, w, h) {
    // d3 update pattern
  },
  destroy(el) {
    d3.select(el).selectAll('*').remove();
  },
}));
```

The `D3Theme` passed to mount/update has: `colors`, `sequentialColors`, `fontFamily`, `fontSize`, `background`, `foreground`, `border`. It's derived automatically from the active VizBox theme.

---

## Plugging in a Recharts chart

```tsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { createRechartsPlugin, registerPlugin } from 'vizbox';

registerPlugin(createRechartsPlugin({
  id: 'recharts-bar',
  label: 'Bar (Recharts)',
  Renderer: ({ data, theme, width, height, config }) => (
    <BarChart width={width} height={height} data={data}>
      <CartesianGrid stroke={theme.gridColor} />
      <XAxis dataKey={config?.nameKey ?? 'name'} tick={{ fill: theme.textColor, fontFamily: theme.fontFamily }} />
      <YAxis tick={{ fill: theme.textColor }} />
      <Tooltip />
      <Bar dataKey={config?.dataKey ?? 'value'} fill={theme.colors[0]} />
    </BarChart>
  ),
}));
```

---

## Plugging in a Nivo chart

```tsx
import { ResponsiveBar } from '@nivo/bar';
import { createNivoPlugin, registerPlugin } from 'vizbox';

registerPlugin(createNivoPlugin<{ name: string; value: number }[], { dataKey?: string; nameKey?: string }>({
  id: 'nivo-bar',
  label: 'Bar (Nivo)',
  dataAdapter: (data) => data.rows as { name: string; value: number }[],
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

## Writing a custom plugin from scratch

```tsx
import { registerPlugin } from 'vizbox';
import type { ChartPlugin } from 'vizbox';

const heatmapPlugin: ChartPlugin<number[][], HeatmapTheme, HeatmapConfig> = {
  id: 'heatmap',
  label: 'Heatmap',
  dataAdapter(data, config) {
    // reshape TransformedData → 2D number array
    return /* ... */;
  },
  themeAdapter(theme, config) {
    return { colors: theme.colors.sequential };
  },
  Renderer({ data, theme, width, height }) {
    return <canvas width={width} height={height} /* ... */ />;
  },
};

registerPlugin(heatmapPlugin);
```

---

## Custom theme

```tsx
import type { ThemeDefinition } from 'vizbox';
import { lightTheme, ThemeProvider } from 'vizbox';

const brandTheme: ThemeDefinition = {
  ...lightTheme,
  name: 'brand',
  colors: {
    ...lightTheme.colors,
    categorical: ['#0055ff', '#ff6600', '#00cc88', '#cc00ff'],
  },
  surface: {
    ...lightTheme.surface,
    borderRadius: '12px',
  },
};

<ThemeProvider theme={brandTheme}>
  ...
</ThemeProvider>
```

---

## License

MIT

````

## 18. Verification Checklist

Run these commands, in order, from the repository root after reproducing every file in Sections 7–17. Expected output is given exactly as observed against the real repository at commit `9581d94` ("Close P2 edge-case gaps from the QA review") — if your rebuild diverges from these numbers, something was copied incorrectly or a step was skipped.

```bash
npm install
```
Installs `react`, `react-dom` as dependencies and the dev toolchain (`typescript`, `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@vitejs/plugin-react`, etc. — see Section 7's `package.json` for the exact versions). No runtime dependency beyond `react`/`react-dom` should be installed (Rule 5, Section 2) — `d3`, `recharts`, and `@nivo/bar` are peer/optional dependencies only, never required for `npm install` to succeed.

```bash
npm run typecheck
```
Runs `tsc -p tsconfig.esm.json --noEmit`. **Expected: exits 0, no output beyond the npm script banner.** This is the strict-mode check (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`, etc. from Rule 6, Section 2) — if you hit an error here, the most likely causes are: the native-plugin config-spread bug type-widening subtlety (Section 15, Bug 4) reproduced backwards, or the Nivo adapter's example/JSDoc using an under-specified generic (Section 13/17's note on the compiling Nivo example).

```bash
npm test
```
Runs `vitest run`. **Expected exact output:**
```
 Test Files  11 passed (11)
      Tests  82 passed (82)
```
Per-file breakdown (order may vary, counts must not):

| Test file | Tests |
|---|---|
| `src/transforms/__tests__/flatten.test.ts` | 11 |
| `src/transforms/__tests__/aggregate.test.ts` | 9 |
| `src/transforms/__tests__/pipeline.test.ts` | 5 |
| `src/registry/__tests__/index.test.ts` | 6 |
| `src/registry/__tests__/native-plugin.test.tsx` | 6 |
| `src/core/__tests__/container.test.tsx` | 4 |
| `src/core/__tests__/view-switcher.test.tsx` | 9 |
| `src/core/__tests__/view-switcher-adapters.test.tsx` | 4 |
| `src/plugins/__tests__/d3-adapter.test.tsx` | 5 |
| `src/plugins/__tests__/recharts-adapter.test.ts` | 11 |
| `src/plugins/__tests__/nivo-adapter.test.ts` | 12 |
| **Total** | **82** |

If any count is lower, a test was dropped during transcription — go back to the relevant layer section and re-copy that test file verbatim. If any count is higher, an extra test was added that isn't documented anywhere in this spec — that's not necessarily wrong, but it means this document is no longer an exact match for what you built and Section 19's manifest should be updated to note the addition.

```bash
npm run build
```
Runs `tsc -p tsconfig.esm.json && tsc -p tsconfig.cjs.json` — both the ESM and CJS builds. **Expected: exits 0, no output beyond the two npm script banners.** Produces `dist/esm/` and `dist/cjs/` (both gitignored — see Section 7's `.gitignore`).

```bash
find src -name "*.test.ts*" | wc -l
```
**Expected: `11`.**

```bash
git ls-files | grep -E '^src/.*\.tsx?$' | wc -l
```
**Expected: `47`** (36 non-test source files + 11 test files, across all six layers plus the top-level `src/index.ts`). If your count is 46, you likely omitted `src/viz/types.ts` (Section 12's known-unused-but-must-reproduce file).

### What "done" looks like

A correct rebuild has:
- Zero runtime dependencies beyond `react` + `react-dom` (verify: `package.json`'s `"dependencies"` key, per Rule 5 in Section 2).
- Zero uses of `any` or `as unknown` outside the one documented, commented cast in `pipeline.ts` (verify: `grep -rn "as unknown\|: any\b" src/` and confirm every hit is that one line, per Rule 2 in Section 2).
- All five bugs from Section 15 fixed in the form described there (not just "produces correct output for the specific test," but structurally fixed the way described — e.g. Bug 4's spread order, not some other workaround that happens to pass the same test).
- All seventeen design decisions from Section 16 preserved as documented behavior, not "fixed."
- The exact test/file counts above.

## 19. Appendix — Complete File Manifest

Every file this document specifies, grouped by layer, in the order it must be built (Section 6's Build Order). Paths are relative to the repository root.

**Configuration (Section 7):**
`package.json`, `deno.json`, `tsconfig.json`, `tsconfig.esm.json`, `tsconfig.cjs.json`, `vitest.config.ts`, `vitest.setup.ts`, `.gitignore`, `.github/workflows/ci.yml`, `LICENSE`

**Layer 1 — Transforms (Section 8), zero React dependencies:**
`src/transforms/types.ts`, `src/transforms/flatten.ts`, `src/transforms/aggregate.ts`, `src/transforms/pivot.ts` *(no test — known gap)*, `src/transforms/group-by.ts` *(no test — known gap)*, `src/transforms/geo-normalize.ts` *(no test — known gap)*, `src/transforms/pipeline.ts`, `src/transforms/index.ts`
Tests: `src/transforms/__tests__/flatten.test.ts` (11), `src/transforms/__tests__/aggregate.test.ts` (9), `src/transforms/__tests__/pipeline.test.ts` (5)

**Layer 2 — Theme (Section 9):**
`src/theme/types.ts`, `src/theme/light.ts`, `src/theme/dark.ts`, `src/theme/color-scale.ts` *(no test — known gap)*, `src/theme/provider.tsx`, `src/theme/index.ts`
Tests: none — known gap (Section 9 flags `provider.tsx`'s no-throw default as the highest-value target if extending coverage here).

**Layer 3 — Registry (Section 10):**
`src/registry/types.ts`, `src/registry/index.ts`, `src/registry/native-plugin.tsx`
Tests: `src/registry/__tests__/index.test.ts` (6), `src/registry/__tests__/native-plugin.test.tsx` (6)

**Layer 4 — Core (Section 11):**
`src/core/container.tsx`, `src/core/view-switcher.tsx`, `src/core/collapse-manager.tsx` *(no test — known gap)*, `src/core/index.ts`
Tests: `src/core/__tests__/container.test.tsx` (4), `src/core/__tests__/view-switcher.test.tsx` (9), `src/core/__tests__/view-switcher-adapters.test.tsx` (4)

**Layer 5 — Viz (Section 12), no dedicated unit tests for any of the 7 components — the single highest-value coverage gap in the whole codebase:**
`src/viz/types.ts` *(unused, reproduce as-is)*, `src/viz/data-table.tsx`, `src/viz/horizontal-bar-chart.tsx`, `src/viz/line-chart.tsx`, `src/viz/pie-chart.tsx`, `src/viz/choropleth.tsx`, `src/viz/force-graph.tsx`, `src/viz/tree-view.tsx`, `src/viz/plugins.ts`, `src/viz/index.ts`
Tests: none.

**Layer 6 — Plugins (Section 13):**
`src/plugins/d3-adapter.tsx`, `src/plugins/recharts-adapter.ts`, `src/plugins/nivo-adapter.ts`, `src/plugins/index.ts`
Tests: `src/plugins/__tests__/d3-adapter.test.tsx` (5), `src/plugins/__tests__/recharts-adapter.test.ts` (11), `src/plugins/__tests__/nivo-adapter.test.ts` (12)

**Top-level barrel (Section 14):**
`src/index.ts`

**Documentation:**
`README.md` (Section 17), this document itself if you choose to carry it forward into the rebuilt repo.

**Total: 36 non-test source files, 11 test files, 82 tests, 0 runtime dependencies beyond `react`/`react-dom`, 5 documented-and-fixed bugs, 17 documented design decisions.**

---

*End of rebuild specification. This document was generated from the VizBox repository as of commit `9581d94`, immediately before the P3 QA-plan phase (coverage tooling in CI + a testing-convention note) was implemented. If the source repository has moved past that commit, treat any discrepancy between this document and the live code as this document being stale — the code is always the source of truth; update this document to match, don't force the code to match a stale spec.*
