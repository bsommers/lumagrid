---
phase: "5"
slug: "brand-docs-showcase"
# status lifecycle: draft (seeded by plan-phase) → validated (set by validate-phase §6)
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-07"
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution. Derived from 05-RESEARCH.md § Validation Architecture.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest ^1.6.0 + jsdom + Testing Library (existing) |
| **Config file** | `vitest.config.ts`, `vitest.setup.ts` |
| **Quick run command** | `bash scripts/ci.sh --fast` |
| **Full suite command** | `bash scripts/ci.sh` |
| **Estimated runtime** | ~11 seconds (full) |

---

## Sampling Rate

- **After every task commit:** `bash scripts/ci.sh --fast` + the task's specific command
- **After every plan wave:** `bash scripts/ci.sh` and `node scripts/check-docs.mjs` (once it exists)
- **Before `/gsd-verify-work`:** full suite green; `npm run visuals` run once, outputs committed, `node scripts/check-visuals.mjs` green
- **Max feedback latency:** 15 seconds (ci.sh); visuals/site:build are on-demand, outside ci.sh (D-15, D-21)

---

## Per-Task Verification Map (by decision; planner binds to task IDs)

| Decision | Behavior | Test Type | Automated Command | File Exists | Status |
|----------|----------|-----------|-------------------|-------------|--------|
| D-01/D-03/D-05 | No stale `vizbox`; `[lumagrid]` prefix | grep + unit | `node scripts/check-docs.mjs`; `! git grep -n '\[uitoolbox\]\|\[vizbox\]' src`; `npx vitest run src/__tests__/barrels.test.ts` | ❌ W0 (check-docs) | ⬜ pending |
| D-03 | API reports regenerated & match | gate | `npm run api:check` | ✅ | ⬜ pending |
| D-04/D-20 | Historical docs + .ontology carry note | grep | `node scripts/check-docs.mjs` (historical-note check) | ❌ W0 | ⬜ pending |
| D-06 | Mark integer-aligned & symmetric | unit | `npx vitest run brand/__tests__/mark.test.ts` | ❌ W0 | ⬜ pending |
| D-07 | AA contrast; tokens CSS ↔ TS agree | unit | `npx vitest run site/src/__tests__/tokens.test.ts` | ❌ W0 | ⬜ pending |
| D-08 | Wordmark has no `<text>`/font-family | grep | `! grep -l '<text\|font-family' brand/wordmark.svg brand/lockup.svg` | ❌ W0 | ⬜ pending |
| D-09 | Icon set dims, ICO 16+32, manifest | script | `node scripts/build-brand.mjs && node scripts/check-brand.mjs` | ❌ W0 | ⬜ pending |
| D-10/D-12/D-18 | Site typechecks, gallery renders 7 native + 3 adapters | unit + build | `npm run typecheck:site && npx vitest run site/src/__tests__/gallery.test.tsx && npm run site:build` | ❌ W0 | ⬜ pending |
| D-11 | pages.yml SHA-pinned, least privilege | grep | every `uses:` matches `@[0-9a-f]{40}`; permissions block present | ❌ W0 | ⬜ pending |
| D-13 | Reduced motion disables animation; no horizontal scroll | unit + visuals assertion | CSS test + `scrollWidth <= innerWidth` at 375px inside `npm run visuals` | ❌ W0 | ⬜ pending |
| D-14/D-15/D-19 | 14 PNG + 10 SVG; ci.sh has no Playwright | script + grep | `npm run visuals && node scripts/check-visuals.mjs`; `! grep -i playwright scripts/ci.sh` | ❌ W0 | ⬜ pending |
| D-16 | Guide snippets compile and match docs | gate | `npm run typecheck:docs && node scripts/check-docs.mjs && npx vitest run docs/guide` | ❌ W0 | ⬜ pending |
| D-21 | ci.sh runs site typecheck/lint, not site:build | grep | `grep -q typecheck:site scripts/ci.sh && ! grep -q 'site:build' scripts/ci.sh` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `scripts/check-docs.mjs`, `scripts/check-brand.mjs`, `scripts/check-visuals.mjs`
- [ ] `brand/__tests__/mark.test.ts`, `site/src/__tests__/{tokens,gallery}.test.tsx`, `docs/guide/snippets/__tests__/snippets.test.tsx`
- [ ] vitest alias for `lumagrid`; eslint `**/*.mjs` node-globals block; `.gitignore` `site/dist/`
- [ ] Dependency installs (approval checkpoints): playwright-core 1.64.1, opentype.js 2.0.0, fontsource fonts, d3 7.9.2 / recharts 3.10.1 / @nivo/bar 0.99.0

---

## Manual-Only Verifications

| Behavior | Decision | Why Manual | Test Instructions |
|----------|----------|------------|-------------------|
| Mark legible at 16px | D-06 | Perceptual | Open `favicon-16.png` / browser tab after `build-brand` |
| Mermaid diagrams render | D-17 | No renderer dependency allowed | View docs on GitHub preview |
| Repo renamed; Pages live | D-02/D-11 | Outward-facing, human checkpoint | `gh repo view bsommers/lumagrid --json url`; `curl -sI https://bsommers.github.io/lumagrid/ \| head -1` |
| Site look & feel (neon grid, phone width) | D-12/D-13 | Visual judgement | Open `site:preview`, check desktop + 375px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
