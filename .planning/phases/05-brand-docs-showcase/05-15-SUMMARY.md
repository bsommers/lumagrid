---
phase: 05-brand-docs-showcase
plan: 15
subsystem: ci-pages
tags: [github-pages, workflow, hardening, repo-rename]
status: complete

requires:
  - phase: 05-brand-docs-showcase
    provides: "05-12/05-13/05-14 site, chart pages and README; package.json scripts docs:api and site:build"
provides:
  - ".github/workflows/pages.yml: SHA-pinned, least-privilege Pages build and deploy workflow"
  - "scripts/check-pages.mjs: static site/dist artifact check and --url live check"
  - "GitHub repository renamed to bsommers/lumagrid; local origin repointed"
affects: [05-16]

actuals:
  tokens: 12000
  tasks: 3
  commits: 1
plan_head_before: 0e0c0370c8e81116ea6492f1c512eff715fa7d53
plan_head_after: c9a3c98
commits: 1

key-files:
  created:
    - .github/workflows/pages.yml
    - scripts/check-pages.mjs

key-decisions:
  - "Pages workflow uses Node 22 on the runner and copies docs/api into site/dist/api after the Vite build (emptyOutDir would otherwise wipe it)"

requirements-completed: [D-11, D-02, D-15]
---

# Phase 5 Plan 15: Pages workflow, local dry-run, repo rename and remote repoint Summary

A hardened GitHub Pages workflow (all five actions pinned by full SHA, read-only token except the deploy job, no pull request trigger, non-cancelling concurrency) plus an artifact and live-URL checker; its exact job steps were dry-run locally, and after explicit user approval the repository was renamed to bsommers/lumagrid and the local origin repointed. Nothing is pushed and Pages is not yet enabled (plan 05-16).

## Tasks

| Task | Name | Commit / Outcome |
|------|------|------------------|
| 1 (tracer) | Pages workflow, dry-run, checker, full local gate | c9a3c98 |
| 2 (human-action) | Rename repo bsommers/uitoolbox to bsommers/lumagrid | user-approved ("go ahead"); `gh repo rename lumagrid --repo bsommers/uitoolbox --yes` exit 0; `gh repo view bsommers/lumagrid --json url --jq .url` printed https://github.com/bsommers/lumagrid; the old name resolves to the same URL via redirect |
| 3 (human-action) | Repoint origin | user-approved ("go ahead"); `git remote set-url origin https://github.com/bsommers/lumagrid`; `git remote get-url origin` printed the new URL; `git ls-remote --exit-code origin HEAD` exit 0 (remote HEAD 5986765) |

Tasks 2 and 3 were `checkpoint:human-action` gates (`blocking-human`). The orchestrator ran them after the user's explicit approval and verified the results; the executor ran no outward-facing command.

## Task 1 verification

- Action SHAs re-verified with read-only `git ls-remote` against github.com: checkout v7.0.1, setup-node v7.1.0, configure-pages v6.0.0, upload-pages-artifact v5.0.0, deploy-pages v5.0.1 all matched the planned SHAs; no tag had moved.
- Workflow grep gate passed: every `uses:` has a 40-hex SHA, 5 first-party actions, persist-credentials false, cancel-in-progress false, id-token write, 2 timeouts, no pull request trigger, no headless-browser reference.
- Local dry-run: `npm run docs:api` (no typedoc warnings), `npm run site:build`, `cp -r docs/api site/dist/api`, then `node scripts/check-pages.mjs` printed "artifact OK" (index.html, capture.html, api/index.html, og.png, favicon.ico, site.webmanifest, /lumagrid/ base, no local home paths in the API docs). `eslint scripts/check-pages.mjs --max-warnings 0` clean. `--url http://evil.example/` is rejected with exit 1; the live check was not run.
- `node scripts/check-docs.mjs`: `docs:check OK`. `bash scripts/ci.sh`: "local CI passed in 17s". `scripts/ci.sh` untouched (D-15).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Workflow header comment tripped the plan's own grep gate**
- **Found during:** Task 1 verification
- **Issue:** the pages.yml header comment contained the literal `pull_request`, failing `! grep -q 'pull_request'`.
- **Fix:** reworded to "pull request trigger".
- **Files modified:** .github/workflows/pages.yml
- **Commit:** c9a3c98 (fixed before the commit)

## Known Stubs

None.

## Threat Flags

None. The new trust surface (workflow token, Pages artifact) is covered by T-05-19 and T-05-20 in the plan.

## Items for the next plan (05-16)

- Order remains: enable Pages (Settings > Pages > Source: GitHub Actions), then push. `configure-pages` fails fast if Pages is not enabled.
- Run `node scripts/check-pages.mjs --url https://bsommers.github.io/lumagrid/` after the first deploy.

## Self-Check: PASSED

- FOUND: .github/workflows/pages.yml, scripts/check-pages.mjs
- FOUND commit c9a3c98 (ancestor of HEAD)
- `git remote get-url origin` is https://github.com/bsommers/lumagrid
