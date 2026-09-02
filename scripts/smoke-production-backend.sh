#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo '=== PRODUCTION BUILD ==='
npm run build

[[ -d dist/assets ]] || { echo 'FAIL: dist/assets was not produced.' >&2; exit 1; }

BUNDLE_FILES=$(find dist/assets -type f \( -name '*.js' -o -name '*.mjs' \) -print)
[[ -n "$BUNDLE_FILES" ]] || { echo 'FAIL: no JavaScript bundle found.' >&2; exit 1; }

echo '=== SAME-ORIGIN API ASSERTION ==='
if ! grep -Rqs -- '/api/v1' dist/assets; then
  echo 'FAIL: production bundle does not contain /api/v1.' >&2
  exit 1
fi
echo 'PASS: production bundle targets same-origin /api/v1'

echo '=== NO PRODUCTION HOMEPAGE MOCK ASSERTION ==='
for marker in 'popular-ml' 'ml-flash' 'Homepage API unavailable, using frontend mock data.'; do
  if grep -Rqs -- "$marker" dist/assets; then
    echo "FAIL: production bundle still contains homepage mock marker: $marker" >&2
    exit 1
  fi
done
echo 'PASS: homepage mock fallback is absent from production bundle'

echo 'PASS: production frontend backend integration bundle'
