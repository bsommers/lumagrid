# Phase 4: Release prep (1.0) - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md; this log preserves the alternatives considered.

**Date:** 2026-11-07
**Phase:** 04-release-prep-1-0
**Areas discussed:** Chart field naming, Registry duplicate ids, What gets frozen, How the API is documented

---

## Chart field naming

| Option | Description | Selected |
|--------|-------------|----------|
| Role-based | valueField/labelField/idField/colorField | ✓ |
| Keep xField/yField | Pin one meaning per axis | |
| Per-chart props | Each chart declares its own fields | |

| Old names | | Selected |
|---|---|---|
| Deprecated aliases | Mapped per chart, removed in 2.0 | ✓ |
| Remove before 1.0 | Hard break on 0.x | |

| Index signature | | Selected |
|---|---|---|
| Keep it | Extras flow through config | ✓ |
| Per-chart config types | Typed configs | |
| You decide | | |

---

## Registry duplicate ids

| Option | Selected |
|--------|----------|
| Warn in dev, overwrite | ✓ |
| Throw | |
| Throw unless replace | |
| Silent overwrite | |

registerAndGetId: **Deprecate** (registerPlugin returns the id). Options: Deprecate / Keep / Remove.
Reset: **Keep test-only**. Options: Keep test-only / Add unregisterPlugin.

---

## What gets frozen

- Adapters: **Factories stable, configs experimental** (vs All stable / All experimental)
- Choropleth projection and ForceGraph extras: **Experimental** (vs Stable)
- CollapseManager/useCollapse: **Stable** (vs Experimental / You decide)
- Marking: **TSDoc tags only** (vs separate `vizbox/experimental` subpath)

---

## How the API is documented

- Reference: **typedoc, generated** (vs hand-written API.md / both)
- Gate: **api-extractor in ci.sh** (vs no gate / export snapshot)
- Changelog: **Now, backfilled** (vs now, from this phase only)
- Stability policy: **"1 and 2"**, meaning both a README section and docs/STABILITY.md. Interpreted as: a full policy in docs/STABILITY.md, a short README section linking to it, and RELEASE-PLAN pointing to it.

## Claude's Discretion

- Whether docs/api is committed or gitignored; precedence of new vs old field names; api-extractor report granularity; wording of the duplicate-id warning.

## Deferred Ideas

- REL-02 npm publish; 0.2 correctness items (LineChart sort, date scale, Deno); visual regression, bundle budget, SSR, and the rc cadence.
