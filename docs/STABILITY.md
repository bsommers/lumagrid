# Stability policy

This page says what each stability tag promises for the `lumagrid` public API, which exports carry which tag, and the conventions that go with them. The TSDoc tags on each export are the source of truth. The API reference (`npm run docs:api`) and the API reports are generated from them.

## What the tags promise

| Tag | Promise |
|-----|---------|
| `@public` | Frozen for 1.0. Changes only in a major release. |
| `@experimental` | May change in a minor release. Always paired with `@beta`: api-extractor only understands `@public`, `@beta`, `@alpha` and `@internal`, so `@beta` carries the same meaning to it. `typedoc.json` excludes `@beta` from the generated reference. |
| `@deprecated` | Still works and is kept for at least one minor release, then removed in the next major. Each deprecation is listed under **Deprecated** in `CHANGELOG.md`. The current deprecations are removed in 2.0. |

Stability is expressed only through these TSDoc tags. There is no separate `lumagrid/experimental` entry point. An export without `@public` or `@experimental` is an error in the API report check (see [How the surface is guarded](#how-the-surface-is-guarded)).

## Stable (`@public`)

- **Theme layer:** `ThemeDefinition` tokens, `ThemeProvider`, `useTheme`, `lightTheme` and `darkTheme`, and the color scales (`categoricalColor`, `sequentialColor`, `divergingColor`, `thresholdScale`).
- **Transforms:** the transform types (`DataTransform`, `ChainableTransform`, `TransformedData`, `HierarchyNode`, `GeoData`, `PipelineStep`) and the built-in transforms (`flatten`, `aggregate`, `pivot`, `groupBy`, `geoNormalize`, `TransformPipeline`).
- **Registry and plugin contract:** `ChartPlugin` (its renderer field is named `Renderer`), `registerPlugin`, `getPlugin`, `listPlugins`, `createNativePlugin`, `ViewSpec`, `RendererProps`, `NativeChartProps` and `NativeConfig`.
- **Containers:** `WidgetContainer`, `ViewSwitcher`, `CollapseManager`, `useCollapse`, and their props types.
- **Native charts:** the seven chart components (`DataTable`, `HorizontalBarChart`, `LineChart`, `PieChart`, `Choropleth`, `ForceGraph`, `TreeView`) and their core props. The seven `native*Plugin` presets are stable too.
- **Adapter factories:** `createD3Plugin`, `createRechartsPlugin` and `createNivoPlugin`.
- **Entry points:** `lumagrid`, `lumagrid/transforms`, `lumagrid/theme`, `lumagrid/viz` and `lumagrid/plugins`.

## Experimental (`@experimental`, also `@beta`)

These may change in a minor release.

- **Adapter config and theme shapes:** `D3Theme`, `D3PluginOptions`, `RechartsTheme`, `RechartsRow`, `RechartsConfig`, `NivoTheme` and `NivoPluginOptions`, plus the helpers `rechartsThemeAdapter` and `nivoThemeAdapter`.
- **Choropleth projection:** the `projectedPaths` prop.
- **ForceGraph extras:** the `relayout`, `seed` and `iterations` options.

## Field props

Native charts name their columns by role. The same role name means the same thing in every chart that uses it:

| Role prop | Meaning | Used by |
|-----------|---------|---------|
| `valueField` | Numeric measure | bar (bar length), line (y value), pie (slice size), choropleth (color value) |
| `labelField` | Category or display label | bar (bar label), line (x category), pie (slice label), force graph (node label) |
| `idField` | Node identifier | force graph |
| `colorField` | Groups rows into series | line |

Resolution order for each prop: the role name, then the legacy alias if the chart has one, then inference from `data.fields`. ForceGraph falls back to the literal `id` and `label` columns, and Choropleth falls back to `value`. When a role name and its alias are both passed, the role name wins.

The legacy `xField` and `yField` props are deprecated and map to role names as follows (also listed in `CHANGELOG.md`):

| Chart | `xField` | `yField` |
|-------|----------|----------|
| HorizontalBarChart | `valueField` | `labelField` |
| LineChart | `labelField` | `valueField` |
| PieChart | `labelField` | `valueField` |
| ForceGraph | `idField` | `labelField` |
| Choropleth | (none) | `valueField`; `valueProperty` still takes precedence |

## Registry semantics

- `registerPlugin(plugin)` stores the plugin under `plugin.id` and returns that id.
- Registering an id that already exists replaces the earlier plugin. Outside `NODE_ENV === 'production'` it also calls `console.warn`. Where `process` is undefined, nothing is logged. Replacement is what keeps hot reload and test re-registration working.
- `registerAndGetId` is deprecated and kept until 2.0. Use `registerPlugin`, which now returns the id.
- There is no public unregister or reset function. `__resetRegistryForTests` is marked `@internal` and is not re-exported from any barrel.

## Registry test convention

The registry is one shared module-level `Map`. A test file that calls `registerPlugin` imports `__resetRegistryForTests` directly from the registry module (not from a barrel) and calls it in `beforeEach`. [CONTRIBUTING.md](../CONTRIBUTING.md#testing-conventions) has the full example. Because the reset clears state between tests, plugin ids do not need to be unique across the suite.

## Transforms

- `aggregate`, `pivot` and `geoNormalize` are transform objects. Their options are passed at call time, as `transform(data, options)`. Called without options they return the input unchanged, so a missing option fails silently.
- `groupBy(field, valueField?)` is a factory. It returns a transform object.
- `TransformPipeline` steps never receive options. A step that needs options has to close over them, for example `{ name: 'pivot', transform: (d) => pivot.transform(d, opts) }`.

## How the surface is guarded

- `npm run docs:api` generates the API reference with typedoc into `docs/api/`. That folder is gitignored.
- `npm run api:check` runs api-extractor on the built declarations (`npm run build:esm` must have run first) for each entry point. It compares the result with the committed reports in `etc/`. It fails when a report is out of date or an export has no release tag.
- After an intentional change to the public API, run `npm run api:update` and commit the updated reports under `etc/`. Do not edit them by hand.
- `bash scripts/api.sh parity` fails when a TSDoc block carries `@experimental` without `@beta`, or the reverse.
- `scripts/ci.sh` runs `api:check` after the build, so the local gate and the hosted backstop both enforce it.
