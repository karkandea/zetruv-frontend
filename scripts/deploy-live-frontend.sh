#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

DOMAIN="zetruv.dualangka.com"
NGINX_CONFIG="/etc/nginx/sites-available/zetruv"
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_ROOT="/var/backups/zetruv-frontend/${STAMP}"
DEPLOYED=0
LIVE_ROOT=""

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo 'Run this deploy script as root.' >&2
  exit 1
fi

for cmd in nginx python3 curl npm; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required." >&2; exit 1; }
done
[[ -f "$NGINX_CONFIG" ]] || { echo "Missing $NGINX_CONFIG" >&2; exit 1; }

LIVE_ROOT=$(python3 - "$NGINX_CONFIG" "$DOMAIN" <<'PY'
import pathlib, re, sys

path = pathlib.Path(sys.argv[1])
domain = sys.argv[2]
text = path.read_text()
server_start = re.compile(r'\bserver\s*\{', re.I)
server_name = re.compile(r'\bserver_name\s+[^;]*\b' + re.escape(domain) + r'\b[^;]*;', re.I)
listen_443 = re.compile(r'\blisten\s+[^;]*(?<!\d)443(?!\d)[^;]*;', re.I)
root_re = re.compile(r'(?m)^\s*root\s+([^;]+);')

matches = []
for m in server_start.finditer(text):
    brace = text.find('{', m.start())
    depth = 0
    end = None
    for i in range(brace, len(text)):
        if text[i] == '{':
            depth += 1
        elif text[i] == '}':
            depth -= 1
            if depth == 0:
                end = i + 1
                break
    if end is None:
        continue
    block = text[m.start():end]
    if not (server_name.search(block) and listen_443.search(block)):
        continue
    root_match = root_re.search(block)
    if root_match:
        matches.append(root_match.group(1).strip())

if len(matches) != 1:
    print(f'Expected exactly one HTTPS root for {domain}, found {len(matches)}.', file=sys.stderr)
    sys.exit(2)
print(matches[0])
PY
)

[[ -n "$LIVE_ROOT" && "$LIVE_ROOT" == /* && "$LIVE_ROOT" != "/" ]] || {
  echo "Unsafe or empty live root: $LIVE_ROOT" >&2
  exit 1
}
[[ -d "$LIVE_ROOT" ]] || { echo "Live root does not exist: $LIVE_ROOT" >&2; exit 1; }

echo "Live frontend root: $LIVE_ROOT"

echo '=== BUILD + PRODUCTION BUNDLE SMOKE ==='
npm install --no-audit --no-fund
bash scripts/smoke-production-backend.sh
[[ -f dist/index.html ]] || { echo 'dist/index.html was not produced.' >&2; exit 1; }

EXPECTED_JS=$(python3 - <<'PY'
import pathlib, re
text = pathlib.Path('dist/index.html').read_text()
m = re.search(r'<script[^>]+src="([^"]+\.js)"', text)
if not m:
    raise SystemExit('Could not find built JS asset in dist/index.html')
print(m.group(1))
PY
)

echo "Expected live JS asset: $EXPECTED_JS"

echo '=== PREDEPLOY API + NGINX CHECK ==='
nginx -t
curl -fsS "https://${DOMAIN}/api/v1/homepage" >/tmp/zetruv-api-before.json
python3 - <<'PY'
import json
with open('/tmp/zetruv-api-before.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
if not isinstance(data, dict):
    raise SystemExit('Homepage API JSON root is not an object.')
print('PASS: live backend API is healthy before frontend deploy')
PY

mkdir -p "$BACKUP_ROOT"
cp -a "$LIVE_ROOT/." "$BACKUP_ROOT/"
echo "Frontend backup: $BACKUP_ROOT"

rollback() {
  set +e
  if [[ "$DEPLOYED" == "1" ]]; then
    echo 'Rolling back live frontend...' >&2
    find "$LIVE_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    cp -a "$BACKUP_ROOT/." "$LIVE_ROOT/"
    echo "Rollback restored from $BACKUP_ROOT" >&2
  fi
}
trap rollback ERR

DEPLOYED=1
find "$LIVE_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a dist/. "$LIVE_ROOT/"

echo '=== LIVE FRONTEND SMOKE ==='
curl -fsS "https://${DOMAIN}/" >/tmp/zetruv-live-index.html

grep -Fq "$EXPECTED_JS" /tmp/zetruv-live-index.html || {
  echo "Live index does not reference expected asset $EXPECTED_JS" >&2
  exit 1
}

curl -fsS "https://${DOMAIN}${EXPECTED_JS}" >/tmp/zetruv-live-app.js
grep -Fq '/api/v1' /tmp/zetruv-live-app.js || {
  echo 'Live production bundle does not contain /api/v1.' >&2
  exit 1
}

if grep -Fq 'popular-ml' /tmp/zetruv-live-app.js; then
  echo 'Live production bundle still contains homepage mock marker.' >&2
  exit 1
fi

curl -fsS "https://${DOMAIN}/api/v1/homepage" >/tmp/zetruv-live-api.json
python3 - <<'PY'
import json
with open('/tmp/zetruv-live-api.json', 'r', encoding='utf-8') as f:
    data = json.load(f)
if not isinstance(data, dict):
    raise SystemExit('Live homepage API JSON root is not an object.')
print('PASS: live frontend and homepage API are reachable')
PY

trap - ERR
DEPLOYED=0

echo 'PASS: live frontend serves the production backend-integrated bundle'
echo "Backup kept at: $BACKUP_ROOT"
