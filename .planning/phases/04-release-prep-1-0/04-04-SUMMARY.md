---
phase: 04-release-prep-1-0
plan: 04
subsystem: theme-core-plugins
tags: [api, tsdoc, release-tags, theme, core, plugins]
requires: ["04-01"]
provides:
  - "@public on all 15 theme exports (token interfaces, ThemeDefinition, ThemeProvider, useTheme, light/dark themes, color scales)"
  - "@public on 9 core declarations; AnyTransform now exported from container.tsx and the core barrel"
  - "createD3Plugin, createRechartsPlugin, createNivoPlugin @public; 9 adapter theme/option/config shapes @beta + @experimental"
  - "WidgetContainer @example fenced in a tsx code block"
affects: [04-07]
tech-stack:
  added: []
  patterns: ["experimental = @beta + @experimental, stated 'may change in a minor release'"]
key-files:
  created: []
  modified:
    - src/theme/types.ts
    - src/theme/light.ts
    - src/theme/dark.ts
    - src/theme/provider.tsx
    - src/theme/color-scale.ts
    - src/core/container.tsx
    - src/core/view-switcher.tsx
    - src/core/collapse-manager.tsx
    - src/core/index.ts
    - src/plugins/d3-adapter.tsx
    - src/plugins/recharts-adapter.ts
    - src/plugins/nivo-adapter.ts
decisions:
  - "Stable adapter factories reference experimental option types by design (D-08/D-09); plan 04-07 silences the incompatible-release-tags rule"
requirements-completed: [REL-03]
status: complete
actuals:
  tokens: 6000
  tasks: 3
  commits: 3
commits: 3
plan_head_before: a3b2fa1d94cf8ea9e3f3664e8262f1ad9a52d8c6
plan_head_after: b09880e144a05430c2f46447b03cc49a6e0d0cbe
completed: 2026-11-08
---

# Phase 04 Plan 04: Theme, core and plugin-adapter release tags Summary

Theme, core and adapter layers are tagged for the API freeze (36 declarations across 12 files), `AnyTransform` is now a nameable exported type, and the WidgetContainer example is fenced; no runtime behaviour changed.

## What was done

- Task 1 (0f2e5cf): `@public` on 15 theme exports; summaries added where no block existed.
- Task 2 (1b930ca): `@public` on 9 core declarations; `AnyTransform` exported with a summary and re-exported from `src/core/index.ts`; `@example` wrapped in a tsx fence.
- Task 3 (b09880e): three adapter factories `@public`; `D3Theme`, `D3PluginOptions`, `RechartsTheme`, `RechartsRow`, `RechartsConfig`, `rechartsThemeAdapter`, `NivoTheme`, `NivoPluginOptions`, `nivoThemeAdapter` carry `@beta` and `@experimental` with a "may change in a minor release" note.

## Verification

Tag counts: theme 15 `@public`; core 9 `@public`; plugins 3 `@public`, 9 `@beta`, 9 `@experimental`. `npm run typecheck`, `npm run lint` and `npx vitest run` (217 tests) pass.

## Deviations from Plan

None - plan executed exactly as written. REL-03 is left open in REQUIREMENTS.md until the phase ends, per orchestrator instruction.

## Known Stubs

None.

## Threat Flags

None.

## Self-Check: PASSED

All 12 modified files exist; commits 0f2e5cf, 1b930ca and b09880e are ancestors of HEAD.
