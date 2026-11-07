---
phase: 04-release-prep-1-0
plan: 03
subsystem: registry-transforms
tags: [api, registry, tsdoc, release-tags, group-by]
requires: ["04-01"]
provides:
  - "registerPlugin returns the plugin id and warns on duplicate ids outside production (process-safe)"
  - "registerAndGetId deprecated (kept until 2.0); __resetRegistryForTests tagged internal and unexported"
  - "groupBy declared as a factory type; groupBy(...).transform(...) typechecks without a cast"
  - "@public on all 31 registry and transform exports; PipelineStep exported from the transforms barrel"
affects: [04-06, 04-07]
tech-stack:
  added: []
  patterns: [module-local ambient process declaration instead of @types/node]
key-files:
  created: []
  modified:
    - src/registry/index.ts
    - src/registry/types.ts
    - src/registry/native-plugin.tsx
    - src/registry/__tests__/index.test.ts
    - src/transforms/group-by.ts
    - src/transforms/__tests__/group-by.test.ts
    - src/transforms/aggregate.ts
    - src/transforms/flatten.ts
    - src/transforms/geo-normalize.ts
    - src/transforms/pivot.ts
    - src/transforms/pipeline.ts
    - src/transforms/types.ts
    - src/transforms/index.ts
decisions:
  - "groupBy stays a factory (D-15 option 1); shapes documented in the ChainableTransform TSDoc"
  - "Duplicate-id warning guarded by typeof process !== 'undefined' then process.env.NODE_ENV literal access"
status: complete
actuals:
  tokens: 9000
  tasks: 3
  commits: 3
plan_head_before: b3a5d1c2d1c1464338d52e034cfc58e1cbed152c
plan_head_after: 5bbdf3c7c477395c72fcba44b871fbbc6ef2c151
---

# Phase 04 Plan 03: Registry semantics, groupBy type fix and release tags Summary

Registry duplicate ids now warn in dev, `registerPlugin` returns the id, `groupBy` is typed as the factory it is, and every registry and transform export carries `@public`.

## What was done

- Task 1 (242b566): `registerPlugin` returns `string`; warns via `console.warn` on duplicate id when `process` exists and `NODE_ENV !== 'production'`; still overwrites. `registerAndGetId` delegates and is `@deprecated`. Five new tests (first registration, duplicate warn, production silent, `process` undefined, returned id).
- Task 2 (0eecd9a): `groupBy` annotated `(field, valueField?) => ChainableTransform<GroupByOptions>`; cast helper removed from the test; added `name` test. Emitted declaration verified as the factory signature.
- Task 3 (5bbdf3c): `@public` on 31 exports (10 registry, 21 transforms); `ChartPlugin` TSDoc notes the field is `Renderer`; `ChainableTransform` TSDoc describes the pre-configured vs factory shapes; `PipelineStep` exported from `src/transforms/index.ts`.

## Verification

`npm run typecheck`, `npm run lint` and `npx vitest run` (217 tests) pass. `__resetRegistryForTests` appears in non-test source only at its definition.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

All 13 modified files exist; commits 242b566, 0eecd9a and 5bbdf3c are ancestors of HEAD.
