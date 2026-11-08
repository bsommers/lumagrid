#!/usr/bin/env bash
# API-surface runner for VizBox (api-extractor reports plus release-tag parity).
#
#   scripts/api.sh check    run api-extractor on every entry point; fails if a committed report differs or is missing
#   scripts/api.sh update   same, with --local so the reports in etc/ are rewritten
#   scripts/api.sh parity   fail when a TSDoc block carries @experimental without @beta, or the reverse
#
# check and update need the ESM declarations: run `npm run build:esm` first (`npm run api:update` does).
set -euo pipefail
cd "$(dirname "$0")/.."

usage() { echo "usage: scripts/api.sh check|update|parity" >&2; exit 2; }

[[ $# -eq 1 ]] || usage
mode="$1"
case "$mode" in
  check | update | parity) ;;
  *) usage ;;
esac

# api-extractor 7.x knows @public/@beta/@alpha/@internal only, so every experimental declaration
# carries both @experimental and @beta. Verify the pairing block comment by block comment.
parity() {
  local rc=0
  while IFS= read -r -d '' file; do
    awk -v file="$file" '
      /\/\*\*/ { inblock = 1; start = FNR; has_exp = 0; has_beta = 0 }
      inblock && /@experimental/ { has_exp = 1 }
      inblock && /@beta/ { has_beta = 1 }
      inblock && /\*\// {
        if (has_exp != has_beta) {
          printf "parity: %s:%d: TSDoc block has %s without %s\n", file, start, has_exp ? "@experimental" : "@beta", has_exp ? "@beta" : "@experimental" > "/dev/stderr"
          bad = 1
        }
        inblock = 0
      }
      END { exit bad }
    ' "$file" || rc=1
  done < <(find src -type f \( -name '*.ts' -o -name '*.tsx' \) -not -path '*/__tests__/*' -print0)
  return "$rc"
}

if [[ "$mode" == "parity" ]]; then
  parity
  echo "parity: ok"
  exit 0
fi

if [[ ! -f dist/esm/index.d.ts ]]; then
  echo "api.sh: dist/esm/index.d.ts missing; run npm run build:esm first" >&2
  exit 2
fi

flags=()
[[ "$mode" == "update" ]] && flags+=(--local)

failed=0
for entry in index transforms theme viz plugins; do
  echo "==> api-extractor ($mode): $entry"
  node_modules/.bin/api-extractor run --config "etc/api-extractor.$entry.json" ${flags[@]+"${flags[@]}"} || failed=1
done

parity || failed=1
exit "$failed"
