[← README](../README.md)

# Purpose

Why Lumagrid exists, the rules it is built on, and what it deliberately leaves out.

## Contents

- [The problem](#the-problem)
- [Tenets](#tenets)
- [Who it is for](#who-it-is-for)
- [Non-goals](#non-goals)
- [Trust notes](#trust-notes)
- [License](#license)
- [Status](#status)

## The problem

Apps that show data in tables, trees, maps and charts tend to end up with one hand-rolled widget per view. Each has its own data shaping, its own colors and its own resize handling, and swapping a bar chart for a table or for a chart from another library means rewriting the glue.

Lumagrid is a set of drop-in, themeable, type-safe data widgets over tabular, hierarchical and geographic data. You give a widget raw data and a list of views. The library shapes the data once, applies one theme everywhere and lets the user switch between views.

## Tenets

- **A one-way layer rule.** Each layer imports only from layers below it: transforms, then theme, then registry, then core, then viz and plugins. The dependency direction is what keeps each layer testable and replaceable. See [ARCHITECTURE.md](ARCHITECTURE.md#layers).
- **A transform layer with no React dependency.** Flattening, grouping, pivoting and geographic normalization are plain functions over data. They run anywhere JavaScript runs, and they are importable on their own as `lumagrid/transforms`.
- **An explicit theme in native charts.** The native SVG charts take their `theme` as a prop and read every color and size from it. Nothing is hard-coded in a chart, so light, dark and brand themes are all the same code path.
- **A pluggable `ChartPlugin` contract.** A chart integration is a data adapter, a theme adapter and a renderer component. The built-in SVG charts, the D3, Recharts and Nivo adapters and your own charts all go through the same registry. See [ARCHITECTURE.md](ARCHITECTURE.md#plugin-contract).
- **A written stability policy.** Every export is tagged as frozen or experimental, and the API surface is checked on every local CI run. See [STABILITY.md](STABILITY.md).

## Who it is for

React developers who want data widgets that look consistent across an app and that can be themed, switched between views and extended without adopting a full charting engine. It suits dashboards, admin screens and internal tools where one widget may need to show the same data as a chart, a table or a tree.

## Non-goals

- **It does not fetch data.** Lumagrid takes data you already have. Loading, caching and refreshing are the app's job.
- **It does not ship a map projection engine.** `Choropleth` takes pre-projected SVG paths through its `projectedPaths` prop (an experimental option). Without them it shows a placeholder that says so. Use a projection library of your choice, such as D3, to produce the paths.
- **It is not a full charting engine.** It ships seven native charts for common cases. For anything else, wrap a charting library you already use as a `ChartPlugin`.
- **It does not bundle the chart libraries.** The D3, Recharts and Nivo adapters take your renderer. The libraries are your dependencies.

## Trust notes

These statements were checked against the source in `src/` (library code, test files excluded):

- No network calls: a search for `fetch(`, `XMLHttpRequest`, `WebSocket` and `sendBeacon` finds nothing.
- No raw HTML injection: a search for `dangerouslySetInnerHTML`, `innerHTML`, `outerHTML`, `insertAdjacentHTML` and `document.write` finds nothing. Charts are built from React elements.
- No dynamic code execution: a search for `eval(` and `new Function` finds nothing, and there are no dynamic `import()` calls.
- No browser storage: a search for `localStorage`, `sessionStorage` and `document.cookie` finds nothing.
- No runtime dependencies: `package.json` has no `dependencies` field. The only requirements are the `react` and `react-dom` peers.

These notes describe the library source as of this writing, not a security audit. Code you pass in, such as your own `Renderer`, a custom transform or a theme, runs with the same trust as the rest of your app.

## License

Apache-2.0. See [LICENSE](../LICENSE) and [NOTICE](../NOTICE).

## Status

Pre-release (version 0.1.0). The stability policy in [STABILITY.md](STABILITY.md) says what is frozen for 1.0 and what may still change. Publishing to npm is pending: it is deferred by the owner and tracked in [RELEASE-PLAN.md](RELEASE-PLAN.md#publishing-to-npm).
