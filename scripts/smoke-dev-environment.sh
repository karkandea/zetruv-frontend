#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

API_BASE='https://api-dev.zetruv.com/api/v1'
STOREFRONT_URL='https://dev.zetruv.com'

echo '=== DEV STOREFRONT + ADMIN BUILD ==='
rm -rf dist dist-admin
npm run build:all:dev

[[ -f dist/index.html ]] || { echo 'FAIL: dist/index.html missing.' >&2; exit 1; }
[[ -f dist-admin/index.html ]] || { echo 'FAIL: dist-admin/index.html missing.' >&2; exit 1; }

grep_bundle() {
  local root="$1"
  local needle="$2"
  grep -R -Fq --include='*.js' "$needle" "$root"
}

reject_bundle() {
  local root="$1"
  local needle="$2"
  if grep -R -Fq --include='*.js' "$needle" "$root"; then
    echo "FAIL: unexpected value in $root bundle: $needle" >&2
    exit 1
  fi
}

echo '1/6 storefront uses DEV API'
grep_bundle dist "$API_BASE" || { echo "FAIL: storefront bundle does not contain $API_BASE" >&2; exit 1; }

echo '2/6 admin uses DEV API'
grep_bundle dist-admin "$API_BASE" || { echo "FAIL: admin bundle does not contain $API_BASE" >&2; exit 1; }

echo '3/6 admin uses canonical CMS login'
grep_bundle dist-admin '/cms/auth/login' || { echo 'FAIL: canonical CMS login route missing from admin bundle.' >&2; exit 1; }

echo '4/6 admin points back to DEV storefront'
grep_bundle dist-admin "$STOREFRONT_URL" || { echo "FAIL: admin bundle does not contain $STOREFRONT_URL" >&2; exit 1; }

echo '5/6 no STAGING API leaked into DEV builds'
for root in dist dist-admin; do
  reject_bundle "$root" 'api-staging.zetruv.com'
  reject_bundle "$root" 'api-staging.zetruv.dualangka.com'
done

echo '6/6 builds are independently publishable'
[[ -d dist/assets ]] || { echo 'FAIL: storefront assets missing.' >&2; exit 1; }
[[ -d dist-admin/assets ]] || { echo 'FAIL: admin assets missing.' >&2; exit 1; }

echo 'PASS: DEV storefront and admin builds are isolated, independently publishable, and both target api-dev.zetruv.com.'
