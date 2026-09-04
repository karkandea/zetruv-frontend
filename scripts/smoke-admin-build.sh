#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo '=== ADMIN PRODUCTION BUILD ==='
rm -rf dist-admin
npm run build:admin

[[ -f dist-admin/index.html ]] || { echo 'FAIL: dist-admin/index.html missing' >&2; exit 1; }
ADMIN_JS=$(python3 - <<'PY'
import pathlib, re
text = pathlib.Path('dist-admin/index.html').read_text()
m = re.search(r'<script[^>]+src="([^"]+\.js)"', text)
if not m:
    raise SystemExit('FAIL: admin JS asset not found')
print(m.group(1))
PY
)
ADMIN_JS_FILE="dist-admin${ADMIN_JS}"
[[ -f "$ADMIN_JS_FILE" ]] || { echo "FAIL: built admin asset missing: $ADMIN_JS_FILE" >&2; exit 1; }

grep -Fq '/api/v1' "$ADMIN_JS_FILE" || { echo 'FAIL: admin bundle does not target /api/v1' >&2; exit 1; }
grep -Fq '/cms/auth/login' "$ADMIN_JS_FILE" || { echo 'FAIL: admin login API contract missing from bundle' >&2; exit 1; }
grep -Fq 'Zetruv Admin' dist-admin/index.html || { echo 'FAIL: wrong HTML entry built' >&2; exit 1; }
grep -Fq 'lucide' "$ADMIN_JS_FILE" || { echo 'FAIL: Lucide icon library missing from admin bundle' >&2; exit 1; }

if grep -Fq 'popular-ml' "$ADMIN_JS_FILE"; then
  echo 'FAIL: storefront homepage mock leaked into admin bundle' >&2
  exit 1
fi

echo "Admin JS asset: $ADMIN_JS"
echo 'PASS: admin build is isolated from storefront, targets the live CMS API, and includes Lucide icons'
