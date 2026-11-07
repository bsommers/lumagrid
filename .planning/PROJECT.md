# VizBox

## What This Is
VizBox (`vizbox` v0.1.0) is a layered React + TypeScript library of data-visualization widgets: transforms -> theme -> viz -> core layout (WidgetContainer, ViewSwitcher, CollapseManager), with a first-class ChartPlugin registry and D3 / Recharts / Nivo adapters. Seven native viz: table, bar, line, pie, choropleth, force graph, tree.

## Core Value
Drop-in, themeable, type-safe data widgets where any chart library can be plugged in through one ChartPlugin contract.

## Requirements
### Validated
- Layered architecture with transforms, theme, viz, core (plans/vizbox.md)
- Plugin architecture + registry + D3/Recharts/Nivo adapters (phase 01)
- Vitest suite with jsdom component tests, CI with coverage reporting
### Active
- Viz robustness (NaN handling) and complete test coverage with threshold
- Examples app and ESLint
- 1.0 release: Apache-2.0 license, npm publish, API freeze

## Constraints
- Strict TypeScript; dual ESM/CJS build; subpath exports (transforms, theme, viz, plugins)
- Components are pure functions of props (explicit `theme` prop, no useTheme in viz)

## Key Decisions
| Decision | Rationale | Status |
|---|---|---|
| Identity adapters for native charts via createNativePlugin | No reshaping needed | Good |
| Explicit theme prop, no useTheme() in viz | Pure, testable | Good |
| ResizeObserver only for CSS-string sizes | Avoid overhead | Good |
| Remove deprecated createD3Visualization shim | Cleanup (commit 45f6de2) | Done |
| Relicense to Apache-2.0 | 1.0 release prep | In progress |

---
*Onboarded non-interactively 2026-11-07 from README, REBUILD.md, plans/, docs/superpowers, .planning reviews, git log.*
