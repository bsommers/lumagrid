[← Project README](../../README.md)

# Troubleshooting

Problems that readers actually hit, each with its symptom, its cause and its fix. Every entry was checked against the source or the tests of the library.

## Contents

1. [A view shows "No plugin registered"](#1-a-view-shows-no-plugin-registered)
2. [The console warns about a duplicate registration](#2-the-console-warns-about-a-duplicate-registration)
3. [ForceGraph draws nodes but no edges](#3-forcegraph-draws-nodes-but-no-edges)
4. [Choropleth shows "features loaded" instead of a map](#4-choropleth-shows-features-loaded-instead-of-a-map)
5. [A chart is blank or zero-size](#5-a-chart-is-blank-or-zero-size)
6. [TreeView throws "useCollapse must be used inside a CollapseManager"](#6-treeview-throws-usecollapse-must-be-used-inside-a-collapsemanager)
7. [xField and yField are deprecated](#7-xfield-and-yfield-are-deprecated)
8. [An import of d3, recharts or @nivo/bar cannot be resolved](#8-an-import-of-d3-recharts-or-nivobar-cannot-be-resolved)
9. [TypeScript cannot find lumagrid/viz](#9-typescript-cannot-find-lumagridviz)
10. [Tests see plugins left over from other tests](#10-tests-see-plugins-left-over-from-other-tests)

## 1. A view shows "No plugin registered"

**Symptom:** the chart area shows the text `No plugin registered for "bar". Call registerPlugin(...) first.` (with your own id) where a chart should be.

**Cause:** `ViewSwitcher` looks up each view's `id` in the plugin registry. Nothing was registered under that id before the first render, or the id in `views` is spelled differently from the plugin's `id`. The tab strip still appears, with the id as the tab label.

**Fix:** call `registerPlugin(nativeBarPlugin)` (or your own plugin) once at application startup, and make sure the `id` in `views` matches the plugin's `id` exactly. The built-in ids are `table`, `bar`, `line`, `pie`, `tree`, `choropleth` and `force-graph`. See [Registering plugins](./getting-started.md#registering-plugins) and [the registry](./plugins-and-adapters.md#the-registry).

## 2. The console warns about a duplicate registration

**Symptom:** the console shows `[lumagrid] Plugin "bar" is already registered; replacing the earlier registration. This is expected under hot reload.`

**Cause:** `registerPlugin` was called twice with the same `id`. The second plugin replaces the first. The warning appears only when `process.env.NODE_ENV` is not `production`, and it is silent where `process` is undefined.

**Fix:** if it appears once after a hot reload, ignore it: it is the intended behavior. If it appears on every start, two pieces of code register the same id, so give one of them a different `id` or register in a single place. See [the registry](./plugins-and-adapters.md#the-registry).

## 3. ForceGraph draws nodes but no edges

**Symptom:** the nodes appear, but no lines connect them.

**Cause:** `ForceGraph` reads edges from rows that have a `source` column with a value; rows without one are nodes. Each edge row also needs a `target`. An edge is drawn only when both its `source` and its `target` equal the id of a node row, and an edge that names an unknown node is skipped without any message. Ids are compared as strings. A node row must not carry a `source` value, or it is read as an edge.

**Fix:** put the edges in the same `rows` as the nodes, with `source` and `target` holding node ids. The node id comes from `idField` (or the `id` column) and must match those values exactly. For example, nodes `{ id: 'a', label: 'A' }` and `{ id: 'b', label: 'B' }` plus the edge row `{ source: 'a', target: 'b' }`.

## 4. Choropleth shows "features loaded" instead of a map

**Symptom:** a panel reads `Choropleth`, `N features loaded`, and a line telling you to pass `projectedPaths`, with a row of color swatches.

**Cause:** the library has no projection engine. `Choropleth` draws a map only when you give it `projectedPaths`, an object mapping each feature id to an SVG path string. The prop is experimental. Without it, the chart shows this placeholder, and the data (`data.geo`, for example from `geoNormalize`) is otherwise fine.

**Fix:** compute the paths with a projection in your own code (for example D3's `geoPath`) and pass them in the view's `config`: `config: { projectedPaths }`. Features whose id has no path are left out. See [Transforms](./transforms.md) for how `geo` data is built and the [stability list](../STABILITY.md) for the experimental status.

## 5. A chart is blank or zero-size

**Symptom:** the container is there, the title shows, but the chart area is empty (or, in a test, rendering throws `ResizeObserver is not defined`).

**Cause:** `WidgetContainer` passes numeric `width` and `height` to its children. When you give `width` or `height` as a CSS string (the default `width` is `'100%'`), it measures the element with a `ResizeObserver`, and until a size is measured the children receive `0`. A parent element with no width or height therefore measures `0` and the chart draws nothing visible. In a test environment such as jsdom, which has no `ResizeObserver`, a CSS-string size does not even get that far: rendering throws `ReferenceError: ResizeObserver is not defined`.

**Fix:** give the container explicit numbers (`width={600} height={400}`) when you do not control the parent's size, in tests, and in examples. When you want fluid sizing, make sure the parent element has a real width and height.

## 6. TreeView throws "useCollapse must be used inside a CollapseManager"

**Symptom:** rendering the `tree` view fails with the error `useCollapse must be used inside a CollapseManager`.

**Cause:** `TreeView` reads its expand and collapse state from the nearest `CollapseManager`, and there is none above it.

**Fix:** wrap the `ViewSwitcher` (or the `TreeView`) in `<CollapseManager>`; the `defaultExpanded` prop lists the node ids that start open. `CollapseManager` is exported from `lumagrid`.

## 7. xField and yField are deprecated

**Symptom:** your editor shows `xField` or `yField` struck through, or a chart uses a column you did not expect after you mixed old and new props.

**Cause:** the legacy `xField` and `yField` props are deprecated and will be removed in 2.0, and what they mean depends on the chart. Each chart now names its columns by role (`valueField`, `labelField`, `idField`, `colorField`). When a role name and its legacy alias are both given, the role name wins.

**Fix:** replace the alias with the role name from the mapping table in [STABILITY](../STABILITY.md#field-props); for example, on a bar chart `xField` becomes `valueField` and `yField` becomes `labelField`. See [Role field names](./getting-started.md#role-field-names).

## 8. An import of d3, recharts or @nivo/bar cannot be resolved

**Symptom:** your bundler or Node reports that it cannot resolve `d3`, `recharts` or `@nivo/bar` (the exact wording depends on the tool).

**Cause:** Lumagrid does not bundle chart libraries. The adapter factories in `lumagrid/plugins` do not import them either: your own mount code or `Renderer` does, so the library has to exist in your application.

**Fix:** install the library you import, for example `npm install d3`, `npm install recharts` or `npm install @nivo/bar`. See [Adapters](./plugins-and-adapters.md#adapters).

## 9. TypeScript cannot find lumagrid/viz

**Symptom:** `Cannot find module 'lumagrid/viz' or its corresponding type declarations`, together with a hint that the types exist but cannot be resolved under your `moduleResolution` setting. The same applies to `lumagrid/transforms`, `lumagrid/theme` and `lumagrid/plugins`.

**Cause:** the sub-path entry points are declared in the `exports` field of the package. `"moduleResolution": "node"` (also called `node10`) ignores `exports`, so it cannot see them.

**Fix:** set `"moduleResolution": "bundler"` for a bundled application, or `"node16"` / `"nodenext"` for a Node ESM project in your `tsconfig.json`. The entry points are listed in [Using and configuring Lumagrid](../USING.md#entry-points).

## 10. Tests see plugins left over from other tests

**Symptom:** a test renders the wrong chart, or a duplicate-registration warning shows up in test output, or a test passes alone and fails together with others.

**Cause:** the plugin registry is one shared module-level map that lives for the whole test process, so a plugin registered in one test is still there in the next.

**Fix:** reset the registry in a `beforeEach`, as described in the testing conventions of [CONTRIBUTING.md](../../CONTRIBUTING.md). That reset helper is internal and is not exported from `lumagrid`; import it from the registry module of this repository when you work on the library itself. In an application's tests, register your plugins in a shared setup file, or give each test its own `id`. See [the registry](./plugins-and-adapters.md#the-registry).
