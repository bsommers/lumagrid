#!/usr/bin/env bash
# Local CI gate for VizBox. GitHub Actions is disabled for this repo; run this before pushing.
# The pre-push hook runs it automatically (enable once: git config core.hooksPath .githooks).
#
#   scripts/ci.sh           typecheck, lint, tests under coverage (thresholds in vitest.config.ts),
#                           library build, examples build
#   scripts/ci.sh --fast    typecheck, lint, tests (no coverage, no builds)
#
# Mirrors .github/workflows/ci.yml; keep the two in step.
set -euo pipefail
cd "$(dirname "$0")/.."

fast=0
case "${1:-}" in
  --fast) fast=1 ;;
  -h | --help) sed -n '2,8p' "$0"; exit 0 ;;
  "") ;;
  *) echo "ci.sh: unknown option '$1'" >&2; exit 2 ;;
esac

step() { printf '\n==> %s\n' "$*"; }
t0=$SECONDS

# Reinstall only when the lockfile changed since the last install.
if [[ ! -d node_modules || package-lock.json -nt node_modules/.package-lock.json ]]; then
  step "npm ci"
  npm ci --no-audit --no-fund
fi

step "typecheck";  npm run --silent typecheck
step "lint";       npm run --silent lint
if ((fast)); then
  step "tests";    npx vitest run
else
  step "tests + coverage gate"; npm run --silent test:coverage
  step "build";    npm run --silent build
  step "examples build"; npm run --silent examples:build
fi

printf '\nlocal CI passed in %ss\n' "$((SECONDS - t0))"
