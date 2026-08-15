# Test Suite QA Review — VizBox

**Date:** 2026-08-09
**Role:** Skeptical QA pass over the existing test suite (35 tests, 6 files)
**Method:** Read every test file against the source it exercises, line by line, looking for
what a green run does *not* prove. "35/35 passing" is a fact about the tests that exist,
not a claim about the code's correctness — this review is about the gap between the two.

## Verdict up front

The suite is honest as far as it goes — no mocked-behavior tests, no snapshot rubber-stamping,
assertions check real output values. But it covers roughly **6 of the library's ~20 source
modules**, and the 6 it covers were the ones easiest to unit-test in isolation (pure functions,
one component with a clean seam), not the ones most likely to break in production. Three of
the untested modules have latent bugs this review found just by reading them — bugs the
existing 35 tests cannot see because they never touch that code.

**Grade: C.** Good hygiene on what's there; large, non-random blind spots on what isn't.

## What's actually tested vs. what ships

| Module | Tests | Lines | Notes |
|---|---|---|---|
| `transforms/aggregate.ts` | ✅ 4 | 81 | partial — see gaps below |
| `transforms/flatten.ts` | ✅ 6 | 69 | partial — see gaps below |
| `transforms/pipeline.ts` | ✅ 4 | 52 | partial — see gaps below |
| `registry/index.ts` | ✅ 5 | 26 | solid |
| `core/view-switcher.tsx` | ✅ 4 | 91 | partial — see gaps below |
| `plugins/nivo-adapter.ts` | ✅ 12 | 102 | solid |
| `plugins/d3-adapter.tsx` | ❌ 0 | 127 | **largest untested file in the plugin layer** |
| `plugins/recharts-adapter.ts` | ❌ 0 | 92 | has a real auto-detection bug, see below |
| `registry/native-plugin.tsx` | ❌ 0 | 49 | used by all 7 built-in charts |
| `core/container.tsx` | ❌ 0 | 118 | `ResizeObserver` lifecycle, untested |
| `core/collapse-manager.tsx` | ❌ 0 | 105 | zero coverage |
| `theme/color-scale.ts` | ❌ 0 | 73 | computational logic, not static data |
| `viz/*.tsx` (7 chart components) | ❌ 0 | 739 | the code consumers actually render |

Roughly 1,180 of the ~1,870 source lines (63%) have no test touching them at all. The three
"solid" rows are also, not coincidentally, the three most recently written test files —
coverage tracks what this session happened to add, not a plan.

**The pattern worth naming:** `nivo-adapter.ts` — the newest adapter, arguably the least likely
to be used yet — has 12 tests. `d3-adapter.tsx`, the original and probably most-used adapter,
has zero. Test coverage here tracks recency of authorship, not risk or usage.

## Bugs this review found by reading untested code

These aren't style nits. Each is a concrete input that produces silently wrong output, and
none of them would be caught by the current suite because it never exercises the code path.

### 1. `flatten.ts` silently drops `Date` values

`flattenObject` (`src/transforms/flatten.ts:16`) recurses into anything that's
`typeof === 'object' && !Array.isArray`. A `Date` instance satisfies that check, so it
recurses into it via `Object.entries(dateInstance)` — which is `[]`, because `Date`'s
timestamp isn't an own enumerable property. Result: **a `Date` field vanishes from the
output row entirely**, no key, no error, no `[object Object]` fallback. A row like
`{ createdAt: new Date(), name: 'x' }` flattens to `{ name: 'x' }`.

No test passes a `Date`, an array, `undefined`, or any non-plain-object value into `flatten` —
every existing test uses plain nested objects and primitives only.

### 2. `flatten.ts`'s date-type inference will misclassify plain numeric-looking strings

`inferType` (`src/transforms/flatten.ts:37`) calls `Date.parse(v)` on every string value to
decide if a column is type `'date'`. `Date.parse` is far more permissive than most people
expect — 4-digit strings like `"2020"` or `"1999"` parse as valid dates (interpreted as a
year). A perfectly ordinary string column containing years-as-strings would be silently
typed `'date'` instead of `'string'`, which matters because `FieldMeta.type` drives
auto-detection elsewhere (see #3). **`'date'` is one of four values in the `FieldMeta['type']`
union and is never once produced or asserted in the current test suite.**

### 3. `recharts-adapter.ts`'s auto-detection silently produces empty charts

`defaultDataAdapter` (`src/plugins/recharts-adapter.ts:41-51`) does:
```ts
const nameKey = config?.nameKey ?? data.fields.find((f) => f.type === 'string')?.key ?? '';
const dataKey = config?.dataKey ?? data.fields.find((f) => f.type === 'number')?.key ?? '';
```
If no field of the right type exists — plausible after the misclassification in #2, or for
any dataset that's e.g. all-numeric or all-string — `nameKey`/`dataKey` fall back to `''`.
Every row then maps to `{ name: '', value: 0, ... }`. The chart renders, empty, with no error
and no signal to the consumer that auto-detection failed. Zero tests exercise this function
at all — not the happy path, not the fallback.

### 4. `pipeline.ts`'s per-step `options` parameter is effectively dead code

`TransformPipeline.run` (`src/transforms/pipeline.ts:32-46`) only ever calls
`step.transform(result)` for steps after the first — no `options` argument is ever forwarded.
`PipelineStep.transform`'s signature (`pipeline.ts:9`) accepts `options?: Record<string, unknown>`,
but there is no code path through `TransformPipeline` that can ever supply one. The existing
"chains flatten → aggregate" test (`pipeline.test.ts:13-32`) works around this by wrapping
`aggregate` in a closure that hardcodes its options — which demonstrates the pipeline *working
around* its own unusable API surface, not exercising it. This is either a missing feature
(steps need per-step config) or dead API surface that should be removed; either way it's
currently undocumented and untested in both directions.

### 5. `container.tsx` has a real first-paint state, and it's unverified

`WidgetContainer` (`src/core/container.tsx:70-71`) resolves width/height to `measuredSize?.w
?? 0` before the `ResizeObserver` has fired at least once. On every mount with a CSS-string
width/height (the documented common case — `width="100%"` is the default), children render
first with `width={0} height={0}`, then re-render once the observer reports real dimensions.
Whether children (chart components, `ViewSwitcher`) handle a `0×0` render pass gracefully is
completely unverified — nothing in the suite mounts `WidgetContainer` at all.

## Gaps in the modules that *do* have tests

Not just "more tests would be nice" — these are specific, named cases the current tests
don't cover, in files the suite claims to test:

- **`aggregate.ts`**: `'min'`, `'max'`, `'first'`, `'last'` aggregation functions are never
  tested (only `'sum'`, `'count'`, `'avg'`). Multiple `groupBy` keys at once — untested (only
  ever one key). Multiple aggregations in the same call — untested (only ever one field).
  A group where the aggregated field is non-numeric for every row in the bucket — `values`
  filters to `[]`, `applyAgg` returns `0` silently (`aggregate.ts:11`) — untested, and this is
  the same silent-zero failure mode as #3 above, just in the sibling module.
- **`flatten.ts`**: empty-object rows (`{}`), deeply nested (3+ levels), and a key that
  collides with the separator character are all untested in addition to the Date/array/date-
  inference gaps above.
- **`pipeline.ts`**: `stepNames` for a multi-step pipeline is untested (only ever asserted for
  a single-step pipeline, where the interesting "does order/count come out right" question
  can't be answered). What happens when the first step's `transform` throws — untested.
- **`view-switcher.tsx`**: the `activeView` **controlled** prop is never actually tested
  driving the rendered view — all 4 tests use uncontrolled tab-click state. An `activeView`
  pointing at an id absent from `views` silently falls back to `views[0]`
  (`view-switcher.tsx:29`) rather than erroring or showing nothing — untested, and a real
  way for a consumer's bug (typo'd id) to silently show the wrong chart instead of failing
  loudly. `tabPosition="bottom"` is untested (only the default `'top'` is exercised). An empty
  `views` array is untested — falls into the "no plugin registered" branch with an empty-string
  id interpolated into the message.
- **`nivo-adapter.ts`**: `parseInt(theme.typography.fontSizeSm, 10)` (`nivo-adapter.ts:29`,
  flagged and parked during the adapter's own review) silently produces `0`/`NaN` for a
  theme using non-pixel font-size units — no test exercises a non-`'Npx'` value. No test
  registers the plugin through `registerPlugin` and renders it via `ViewSwitcher` end-to-end
  the way `view-switcher.test.tsx` does for a fake plugin — the Nivo path is only unit-tested
  in isolation, never integration-tested through the actual dispatch path a consumer uses.

## Process gaps (not about any one test, about the suite as a system)

- **No coverage measurement exists.** No `@vitest/coverage-*` package is installed, no
  `--coverage` flag anywhere, no threshold gate in `.github/workflows/ci.yml`. "35 tests
  passing" is the only signal CI produces — coverage could regress indefinitely with no one
  noticing, since there's no number that would move.
- **The plugin registry (`src/registry/index.ts:4`) is a module-level singleton `Map` with
  no reset mechanism.** Every test file that calls `registerPlugin` (currently
  `registry/index.test.ts` and `view-switcher.test.tsx`) avoids collisions purely by
  convention — hand-picking unique id strings per test (`'registry-test-a'`,
  `'vs-test-basic'`, etc.). Nothing enforces this. The first contributor who copies an
  existing test and forgets to rename the id gets a flaky, order-dependent failure that will
  be genuinely confusing to debug, because the failure will implicate the *second* test that
  happens to run, not the one that actually has the bug. There's no exported
  `__resetRegistryForTests()` or equivalent, and no lint/convention doc warning about it.
- **No mutation/purity tests.** Several transform functions are documented (implicitly, by
  their `Chainable`/`DataTransform` interfaces) as pure, but nothing asserts that the input
  `TransformedData`/rows array isn't mutated in place. `aggregate.test.ts:47`'s
  "returns original data when no options provided" test checks referential identity for the
  no-op case only — the far more important case (does `aggregate` with real options mutate
  the caller's input rows while building its output?) is unchecked.

## Improvement plan

Ordered by risk × cheapness.

### P0 — fix or test the silent-failure bugs found above — done 2026-08-09
1. ~~`flatten.ts`: decide the intended behavior for `Date`/array/`undefined` values~~ — **done.**
   `Date` values now convert via `.toISOString()` instead of being silently dropped
   (`flatten.ts` — explicit `instanceof Date` check before the recursion branch). Arrays and
   `undefined` were already handled correctly (stringified via the existing fallback branch)
   and now have regression tests locking that in. See `flatten.test.ts`.
2. ~~`flatten.ts`: fix or scope down `inferType`'s date detection~~ — **done.** A string is
   now only date-candidate if `isNaN(Number(v))` — i.e. it must fail to parse as a plain
   number before `Date.parse` is even tried. `"2020"`/`"1999"` now correctly infer as
   `'string'`; real date strings still infer as `'date'`.
3. ~~`recharts-adapter.ts`: either throw/warn ... or add a test~~ — **done, warn chosen.**
   `defaultDataAdapter` now calls `console.warn` (naming which key — `nameKey` or `dataKey`
   — and why) when it falls back to auto-detection failure, and still renders rather than
   throwing (a throw here would break the whole `ViewSwitcher` tree over one tab's data
   quirk). New test file `src/plugins/__tests__/recharts-adapter.test.ts` — first tests this
   file has ever had.
4. ~~`pipeline.ts`: resolve the dead `options` parameter~~ — **done, removed.** YAGNI: the
   closure-based workaround already demonstrated in the pipeline tests is the actual pattern
   in use, and is arguably clearer than a separate options-forwarding mechanism would be.
   `PipelineStep.transform` no longer accepts an `options` argument; `TransformPipeline.run`
   was already never passing one, so this is a type-only change with no runtime behavior
   difference — verified by the full suite staying green throughout.

All four verified via `npm run typecheck` (both `tsconfig.esm.json` and `tsconfig.cjs.json`),
`npm test` (45/45 passing, up from 35), and `npm run build`.

### P1 — close coverage on the untested-but-load-bearing modules — done 2026-08-15
5. ~~`core/container.tsx`: test the `ResizeObserver` wiring~~ — **done, no bug found.** New
   `src/core/__tests__/container.test.tsx` installs a fake `ResizeObserver` (jsdom has none —
   `new ResizeObserver(...)` would throw in this test environment without it) and verifies:
   no observer is created when both `width`/`height` are numbers; a CSS-string dimension
   renders `0×0` before the observer fires, then updates once it does; the observer
   disconnects on unmount. All 4 pass against the existing implementation unchanged.
6. ~~`plugins/d3-adapter.tsx`: test `toD3Theme` mapping and `createD3Plugin`'s lifecycle~~ —
   **done, no bug found.** New `src/plugins/__tests__/d3-adapter.test.tsx` — theme mapping,
   `mount` called once and not `update` on first render, `update` (not `mount` again) on
   prop change, neither called on an identical re-render, `destroy` called with the container
   element on unmount. This was the largest untested file in the plugin layer; all 5 tests
   pass unchanged.
7. ~~`plugins/recharts-adapter.ts`: test `defaultDataAdapter`'s auto-detection~~ — **done.**
   The fallback-warning behavior was already covered by the P0-3 fix; added the remaining
   gaps: `rechartsThemeAdapter` mapping (previously untested, like #6), `createRechartsPlugin`
   wiring (label default/override, `themeAdapter` identity, custom `dataAdapter` override),
   and row-value coercion (boolean/null extra fields, multiple rows). 11 tests total in that
   file now (was 4 after P0).
8. ~~`registry/native-plugin.tsx`: test identity adapters and config spreading~~ — **done, and
   this one found a real bug.** A test proving a colliding `config` key (e.g. `{ data: ... }`)
   can never override the real `data`/`theme`/`width`/`height` props failed RED against the
   unmodified code — `native-plugin.tsx:38` spread `{...config}` *after* the explicit props,
   so a colliding key silently won. Fixed by moving the config spread first
   (`<Component {...config} data={data} theme={theme} width={width} height={height} />`).
   New `src/registry/__tests__/native-plugin.test.tsx`, 6 tests.
9. ~~Add a registry test-reset mechanism~~ — **done.** `__resetRegistryForTests()` added to
   `src/registry/index.ts` (deliberately not re-exported from `core/index.ts` or the
   top-level barrel — wiping shared plugin state has no place in the public API). Both files
   that call `registerPlugin` (`registry/index.test.ts`, `view-switcher.test.tsx`) now call it
   in `beforeEach`; existing unique test ids were left as-is rather than renamed, since the
   reset — not the naming — is what removes the fragility.

All nine verified via `npm run typecheck` (both configs), `npm test` (68/68 passing, up from
45), and `npm run build`.

### P2 — round out edge cases in already-tested modules
10. `aggregate.ts`: add tests for `min`/`max`/`first`/`last`, multi-key `groupBy`, multiple
    simultaneous aggregations, and the empty-bucket-values silent-zero case.
11. `view-switcher.tsx`: add tests for the controlled `activeView` prop actually driving the
    rendered view, `activeView` pointing at a nonexistent id, `tabPosition="bottom"`, and an
    empty `views` array.
12. Add one end-to-end test per adapter (D3, Recharts, Nivo, native) that goes
    `registerPlugin` → `<ViewSwitcher>` → asserts the right `Renderer` mounted, not just the
    factory functions in isolation.

### P3 — process
13. Add `@vitest/coverage-v8` and a `test:coverage` script; wire a coverage step into
    `.github/workflows/ci.yml`. Start by reporting the number, not gating on a threshold —
    agree on a realistic floor once the P0/P1 gaps above are closed, then gate.
14. Add a one-paragraph testing convention note (e.g. in `CONTRIBUTING.md` or a comment in
    a shared test-utils file) covering the registry-id-collision hazard from item 9, so it's
    documented once rather than re-discovered per contributor.

## What this review deliberately did not do

- Did not run or add a mutation-testing tool (e.g. Stryker) — worth considering after P0-P2
  land, not before; mutation testing on a suite with known coverage holes just reports the
  holes back.
- Did not evaluate `viz/*.tsx` component visual/rendering correctness (would need
  browser-level or visual-regression tooling, a separate decision from unit test coverage).
- Did not fix any of the bugs found in "Bugs this review found" — flagged and prioritized
  above (P0), not implemented, per the scope of this review.
