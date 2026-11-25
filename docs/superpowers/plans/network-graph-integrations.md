# Network graph integrations: Reagraph, react-force-graph, React Three Fiber

Status: proposed. Target release: 0.2.0.

## How these fit Lumagrid

Lumagrid never imports a chart engine. An adapter factory in `lumagrid/plugins` returns a `ChartPlugin`, and the app supplies the engine inside `Renderer`. All three libraries follow that rule: optional peer dependencies, no engine code in the core bundle.

| Library | Role in Lumagrid | Shape |
|---|---|---|
| Reagraph | Batteries-included 2D/3D graph | `createReagraphPlugin` in `lumagrid/plugins` |
| react-force-graph | Popular force layout, 2D/3D/VR/AR | `createForceGraphPlugin` in `lumagrid/plugins` |
| R3F + drei + d3-force-3d | Toolkit, not a chart | New `lumagrid/r3f` entry: hooks, scene primitives and `createR3FGraphPlugin` |

Constraints that shape every milestone:

- **Data.** The native `ForceGraph` already reads edges from rows with a `source` field (`src/viz/force-graph.tsx`). All three plugins need the same rows to `{nodes, links}` conversion, so it is built once (M0).
- **Theme.** One `graphThemeAdapter` maps `ThemeDefinition` to node, edge, label, background and highlight tokens. Each engine's adapter reshapes those.
- **WebGL.** The conformance kit renders with `renderToMarkup` (SSR). WebGL engines cannot render there, so the kit needs a documented skip or stub path (M0).
- **React range.** Lumagrid supports React >=18. R3F v9 needs React 19 and v8 targets React 18, so peer ranges and the docs must say so. Verify each library's peers at install time.
- **Bundle.** Three.js is large. Every graph demo on the site is lazy loaded, like the existing Nivo, D3 and Recharts cards.

## Milestones

### M0. Graph foundation (blocks M1-M3)

Goal: one shared data, theme and test layer for all graph engines.

- `toGraph(data, config)` in `lumagrid/transforms`: pure, no React. Produces `{nodes, links}` using the same role names as the native ForceGraph (`id`, `label`, `group`, `source`, `target`, `weight`), with dedupe, dangling-edge handling and a node cap.
- `graphThemeAdapter` in `lumagrid/theme` or `lumagrid/plugins`, reading `categorical` colors and surface/text tokens.
- Shared types: `GraphNode`, `GraphLink`, `GraphEvents` (`onNodeClick`, `onSelectionChange`, `onHover`).
- Graph fixtures in `lumagrid/testing`. A WebGL-aware conformance mode: `renders-sample` and `theme-switch` run against a stubbed renderer, and the engine check is marked `skip` with a reason.
- Tests: transform unit tests, determinism (seeded layouts), no-mutation of input.

Done when: `npm run lint`, `typecheck`, `test`, `api:check` pass, and the native ForceGraph can optionally reuse `toGraph` without behavior change.

### M1. Reagraph plugin

Goal: `createReagraphPlugin` for 2D/3D graphs.

- Optional peer `reagraph`. Config exposes `layoutType`, `mode` (2d/3d), `clusterAttribute`, `selection`/lasso and path highlighting (`pathSelectionType`), mapped to Reagraph props.
- Theme adapter returns a Reagraph `Theme` object for light and dark.
- Presets: `reagraph-2d`, `reagraph-3d`, `reagraph-clustered`.
- Docs: `docs/guide/charts/network-reagraph.md`, `plugins-and-adapters.md` section and a snippet in the compiled snippets project.
- Example plus a lazy site gallery card.

Done when: conformance kit green (stub mode), docs check and snippet typecheck green, one Playwright screenshot of the demo.

### M2. react-force-graph plugin

Goal: `createForceGraphPlugin({variant: '2d' | '3d'})`.

- Optional peers `react-force-graph-2d` and `react-force-graph-3d`. Engine supplied by the app as `Renderer` children, so the adapter does not import it.
- Config maps d3-force knobs (`cooldownTicks`, link distance, charge), particle flow along edges, node sizing by degree or `weight`, and click-to-focus camera.
- Document the VR/AR packages as "bring your own `Renderer`" with a short recipe. No Lumagrid code for them.
- Example, site card and guide page.

Done when: same gates as M1, plus the native-vs-engine comparison table in the README gains a row.

### M3. React Three Fiber toolkit (`lumagrid/r3f`)

Goal: custom 3D graphs with Lumagrid theming and data.

- New entry point `lumagrid/r3f` (ESM, CJS, types, api-extractor report, smoke-dist, `docs:check`). Optional peers: `three`, `@react-three/fiber`, `@react-three/drei`, `d3-force-3d`.
- Primitives: `useForceLayout3D` (runs `d3-force-3d` over `toGraph` output, seedable and stoppable), `<InstancedNodes>`, `<EdgeLines>`, `<NodeLabels>` (drei `Text` or `Html`), `<CameraRig>` with fly-to-node.
- `createR3FGraphPlugin` composing the primitives so it registers like any other plugin; apps can swap in custom shaders or geometries by passing their own primitives.
- Performance budget decided from measurement: node counts at 60 fps with instancing.
- Guide: extends `bring-your-own-engine.md` with a worked R3F scene.

Done when: the primitives are exported with `@beta` tags, the layout hook has deterministic tests, and the example runs through `examples:build`.

### M4. Showcase, docs and release

- Site: new "Network" section with the three demos, lazy loaded, reduced-motion respected. WebGL screenshots in `npm run visuals` (headless Chromium with software GL) and `visuals:check`.
- Docs: guide index, ARCHITECTURE (new entry point and layer rule), STABILITY, README comparison table, `keeping-docs-in-sync` pass for counts.
- Release 0.2.0: CHANGELOG, API reports, `smoke:dist`, `npm audit` and license check for every new peer, package-size note.

## Order and dependencies

M0 -> M1 -> M2 -> M3 -> M4. M1 goes first because it has the most built-in features and the smallest adapter. M2 and M3 can run in parallel after M0 if two people are working.

## Open questions

1. Does the native `ForceGraph` move onto `toGraph` in M0, or stay untouched until 0.2.0?
2. Is `lumagrid/r3f` its own entry point (recommended, isolates three.js peers) or a folder under `lumagrid/plugins`?
3. Minimum node count the demos must handle (affects the M3 instancing budget).
