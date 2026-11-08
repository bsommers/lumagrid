---
phase: 05-brand-docs-showcase
plan: 02
subsystem: infra
tags: [npm, playwright-core, vite, vitest, eslint, fontsource, d3, recharts, nivo]

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-01 Lumagrid rename (package name lumagrid)"
provides:
  - "Ten exact-pinned devDependencies approved through a blocking human gate"
  - "scripts/lib/browser.mjs shared browser resolver and launcher with --smoke"
  - "Nine phase npm scripts, .mjs node globals, site/dist ignore, lumagrid vitest alias"
affects: [05-03, 05-04, 05-05, 05-06, 05-07, brand, visuals, site]

actuals:
  tokens: 40000
  tasks: 3
  commits: 2
plan_head_before: 90c1caf02872c0d3ddca5f67ab49b9201b0f821a
plan_head_after: 45007a19ce00c2a7c2d7b2764aa314f9a2258170
commits: 2

tech-stack:
  added: [playwright-core 1.64.1, opentype.js 2.0.0, "@fontsource/orbitron 5.3.0", "@fontsource-variable/orbitron 5.3.0", "@fontsource-variable/inter 5.3.0", "@fontsource-variable/jetbrains-mono 5.3.0", d3 7.9.2, recharts 3.10.1, "@nivo/bar 0.99.0", vite 5.4.21 (exact pin)]
  patterns: ["browser resolution chain: LUMAGRID_CHROME, managed Chromium, /usr/bin/google-chrome", "regex vitest aliases, specific subpath first"]

key-files:
  created: [scripts/lib/browser.mjs, scripts/__tests__/alias.test.ts]
  modified: [package.json, package-lock.json, eslint.config.js, .gitignore, vitest.config.ts]

key-decisions:
  - "Task 1 install gate approved by the user on 2026-11-08 for all ten packages at the plan's exact versions (d3 7.9.2 accepted despite too-new flag; playwright-core 1.64.1 accepted instead of 1.65.0; exact pins; no --force or --legacy-peer-deps)"
  - "No sandbox-disabling flag in the launcher; missing LUMAGRID_CHROME path throws instead of falling through"

patterns-established:
  - "Shared config wiring lives in this plan so later parallel plans never edit package.json, eslint.config.js or vitest.config.ts"

requirements-completed: [D-15, D-18, D-19, D-08, D-14]

coverage:
  - id: D1
    description: "Ten devDependencies installed as exact pins; hasInstallScript count unchanged at 2"
    requirement: "D-18"
    verification:
      - kind: other
        ref: "node pin check script from 05-02-PLAN Task 2 verify; grep -c hasInstallScript package-lock.json = 2"
        status: pass
    human_judgment: false
  - id: D2
    description: "Browser launcher resolves a browser and screenshots a valid PNG; bad LUMAGRID_CHROME fails loudly"
    requirement: "D-19"
    verification:
      - kind: other
        ref: "node scripts/lib/browser.mjs --smoke"
        status: pass
    human_judgment: false
  - id: D3
    description: "Phase scripts, lint globals, ignore and vitest alias wired; ci.sh unchanged and green"
    requirement: "D-15"
    verification:
      - kind: unit
        ref: "scripts/__tests__/alias.test.ts"
        status: pass
      - kind: other
        ref: "bash scripts/ci.sh (local CI passed)"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-11-08
status: complete
---

# Phase 5 Plan 02: Dependencies, Browser Launcher and Shared Wiring Summary

**Ten exact-pinned devDependencies (playwright-core 1.64.1, d3, recharts, nivo, fontsource, opentype.js, vite) installed behind a human gate, plus a shared Chrome resolver/launcher and the phase npm scripts, .mjs lint globals and lumagrid vitest alias.**

## Performance

- **Duration:** ~15 min (continuation; Task 1 gate answered earlier)
- **Completed:** 2026-11-08
- **Tasks:** 3 (Task 1 checkpoint approved by user on 2026-11-08)
- **Files modified:** 7

## Accomplishments
- All ten devDependencies landed as exact pins; hasInstallScript count in package-lock.json stays 2; `npm ls vite` shows 5.4.21; no ERESOLVE.
- `node scripts/lib/browser.mjs --smoke` launches system Chrome 156 and produces a valid PNG; `LUMAGRID_CHROME=/nonexistent` exits 1 naming the variable.
- Nine phase scripts, `**/*.mjs` node globals, `site/dist/**` lint ignore and `.gitignore` entry, and vitest regex aliases for lumagrid and four subpaths (proven by 5 passing alias tests).
- `bash scripts/ci.sh` ends with "local CI passed"; ci.sh untouched and does not mention playwright.

## Task Commits

1. **Task 1: Approve devDependency set** - no commit (checkpoint:human-verify, approved by user 2026-11-08)
2. **Task 2: Install packages and browser launcher** - `7c93c42` (feat)
3. **Task 3: Wire scripts, lint, ignore, alias** - `45007a1` (feat)

**Plan metadata:** committed separately (docs: complete plan)

## Files Created/Modified
- `package.json`, `package-lock.json` - ten exact devDependencies; nine phase scripts
- `scripts/lib/browser.mjs` - resolveChrome, launchBrowser, --smoke
- `scripts/__tests__/alias.test.ts` - alias gate for lumagrid and four subpaths
- `eslint.config.js` - `.mjs` node globals, `site/dist/**` ignore
- `.gitignore` - `site/dist/`
- `vitest.config.ts` - regex resolve.alias to src

## Decisions Made
None beyond the plan; the install approval is recorded in key-decisions.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] ESLint no-useless-assignment in browser.mjs**
- **Found during:** Task 3 (eslint on browser.mjs)
- **Issue:** `let managed = ''` reassigned in try/catch triggered `no-useless-assignment`
- **Fix:** Extracted `managedChromiumPath()` helper
- **Files modified:** scripts/lib/browser.mjs
- **Committed in:** 45007a1 (Task 3 commit)

**2. [Rule 1 - Bug] alias test asserted `flatten` is a function**
- **Found during:** Task 3
- **Issue:** `flatten` is a DataTransform object, not a function
- **Fix:** Assert `toBeDefined()`
- **Files modified:** scripts/__tests__/alias.test.ts
- **Committed in:** 45007a1

**Total deviations:** 2 auto-fixed (both Rule 1). **Impact:** none on scope.

## Issues Encountered
npm warned that `.npmrc` allow-scripts is ignored because package.json declares `allowScripts`; benign and pre-existing. `npm audit` reports 26 vulnerabilities in dev tooling (not addressed, out of scope).

## User Setup Required
None.

## Known Stubs
None.

## Next Phase Readiness
Later plans can create site, brand, visuals and docs-check targets without touching shared config. The `site/vite.config.ts`, `site/tsconfig.json`, `docs/guide/snippets/tsconfig.json` and the `scripts/*.mjs` targets the new npm scripts reference do not exist yet.

## Self-Check: PASSED
Files and commits 7c93c42, 45007a1 verified present.

---
*Phase: 05-brand-docs-showcase*
*Completed: 2026-11-08*
