#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

DOMAIN="${ADMIN_DOMAIN:-admin.zetruv.dualangka.com}"
LIVE_ROOT="${ADMIN_LIVE_ROOT:-/var/www/zetruv-admin/dist-admin}"
NGINX_AVAILABLE="/etc/nginx/sites-available/zetruv-admin"
NGINX_ENABLED="/etc/nginx/sites-enabled/zetruv-admin"
API_SNIPPET="/etc/nginx/snippets/zetruv-api.conf"
STAMP="$(date +%Y%m%d%H%M%S)"
BACKUP_ROOT="/var/backups/zetruv-admin/${STAMP}"
CONFIG_BACKUP="${NGINX_AVAILABLE}.backup-${STAMP}"
DEPLOYED=0
CONFIG_CHANGED=0

if [[ "${EUID:-$(id -u)}" -ne 0 ]]; then
  echo 'Run this deploy script as root.' >&2
  exit 1
fi

for cmd in nginx curl npm python3 dig; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required." >&2; exit 1; }
done

[[ -f "$API_SNIPPET" ]] || {
  echo "Missing backend proxy snippet: $API_SNIPPET" >&2
  echo 'Deploy the backend Nginx API proxy first.' >&2
  exit 1
}

DNS_CF="$(dig +short @1.1.1.1 "$DOMAIN" A | sed -n '1p')"
DNS_GOOGLE="$(dig +short @8.8.8.8 "$DOMAIN" A | sed -n '1p')"
if [[ -z "$DNS_CF" || -z "$DNS_GOOGLE" ]]; then
  echo "DNS for $DOMAIN is not visible on both public resolvers yet." >&2
  echo "Cloudflare: ${DNS_CF:-<empty>}" >&2
  echo "Google: ${DNS_GOOGLE:-<empty>}" >&2
  exit 2
fi

echo "DNS Cloudflare: $DNS_CF"
echo "DNS Google: $DNS_GOOGLE"

echo "=== ADMIN BUILD ==="
npm install --no-audit --no-fund
bash scripts/smoke-admin-build.sh
[[ -f dist-admin/index.html ]] || { echo 'dist-admin/index.html was not produced.' >&2; exit 1; }

EXPECTED_JS=$(python3 - <<'PY'
import pathlib, re
text = pathlib.Path('dist-admin/index.html').read_text()
m = re.search(r'<script[^>]+src="([^"]+\.js)"', text)
if not m:
    raise SystemExit('Could not find admin JS asset in dist-admin/index.html')
print(m.group(1))
PY
)

echo "Admin domain: $DOMAIN"
echo "Admin live root: $LIVE_ROOT"
echo "Expected admin JS: $EXPECTED_JS"

mkdir -p "$LIVE_ROOT" "$BACKUP_ROOT"
if [[ -n "$(find "$LIVE_ROOT" -mindepth 1 -maxdepth 1 -print -quit 2>/dev/null)" ]]; then
  cp -a "$LIVE_ROOT/." "$BACKUP_ROOT/"
  echo "Admin backup: $BACKUP_ROOT"
else
  rmdir "$BACKUP_ROOT" 2>/dev/null || true
  BACKUP_ROOT=""
fi

rollback() {
  set +e
  if [[ "$DEPLOYED" == "1" ]]; then
    echo 'Rolling back admin frontend...' >&2
    find "$LIVE_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
    if [[ -n "$BACKUP_ROOT" && -d "$BACKUP_ROOT" ]]; then
      cp -a "$BACKUP_ROOT/." "$LIVE_ROOT/"
    fi
  fi
  if [[ "$CONFIG_CHANGED" == "1" ]]; then
    if [[ -f "$CONFIG_BACKUP" ]]; then
      cp -a "$CONFIG_BACKUP" "$NGINX_AVAILABLE"
    else
      rm -f "$NGINX_AVAILABLE" "$NGINX_ENABLED"
    fi
    nginx -t >/dev/null 2>&1 && systemctl reload nginx >/dev/null 2>&1
  fi
}
trap rollback ERR

DEPLOYED=1
find "$LIVE_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
cp -a dist-admin/. "$LIVE_ROOT/"

if [[ -f "$NGINX_AVAILABLE" ]]; then
  cp -a "$NGINX_AVAILABLE" "$CONFIG_BACKUP"
fi

cat >"$NGINX_AVAILABLE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN;

    root $LIVE_ROOT;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    include $API_SNIPPET;
}
NGINX
CONFIG_CHANGED=1
ln -sfn "$NGINX_AVAILABLE" "$NGINX_ENABLED"

nginx -t
systemctl reload nginx

HTTP_CODE=$(curl -sS -o /tmp/zetruv-admin-http.html -w '%{http_code}' "http://${DOMAIN}/")
if [[ "$HTTP_CODE" != "200" ]]; then
  echo "Admin HTTP smoke returned $HTTP_CODE" >&2
  exit 1
fi

grep -Fq "$EXPECTED_JS" /tmp/zetruv-admin-http.html || {
  echo "Admin HTTP page does not reference expected asset $EXPECTED_JS" >&2
  exit 1
}

API_CODE=$(curl -sS -o /tmp/zetruv-admin-api.json -w '%{http_code}' "http://${DOMAIN}/api/v1/homepage")
if [[ "$API_CODE" != "200" ]]; then
  echo "Admin-domain API proxy returned $API_CODE" >&2
  exit 1
fi

python3 - <<'PY'
import json
with open('/tmp/zetruv-admin-api.json', encoding='utf-8') as f:
    data = json.load(f)
if not isinstance(data, dict):
    raise SystemExit('Admin-domain API proxy did not return a JSON object.')
PY

if command -v certbot >/dev/null 2>&1; then
  echo '=== ADMIN SSL ==='
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect --register-unsafely-without-email
  nginx -t
  systemctl reload nginx

  HTTPS_CODE=$(curl -sS -o /tmp/zetruv-admin-https.html -w '%{http_code}' "https://${DOMAIN}/")
  [[ "$HTTPS_CODE" == "200" ]] || { echo "Admin HTTPS smoke returned $HTTPS_CODE" >&2; exit 1; }
  grep -Fq "$EXPECTED_JS" /tmp/zetruv-admin-https.html || {
    echo "Admin HTTPS page does not reference expected asset $EXPECTED_JS" >&2
    exit 1
  }

  HTTPS_API_CODE=$(curl -sS -o /tmp/zetruv-admin-api-https.json -w '%{http_code}' "https://${DOMAIN}/api/v1/homepage")
  [[ "$HTTPS_API_CODE" == "200" ]] || { echo "Admin HTTPS API proxy returned $HTTPS_API_CODE" >&2; exit 1; }

  echo "PASS: admin console live at https://${DOMAIN}"
else
  echo "PASS: admin console live over HTTP at http://${DOMAIN}"
  echo 'certbot is not installed; SSL was not configured.'
fi

trap - ERR
DEPLOYED=0
CONFIG_CHANGED=0

if [[ -n "$BACKUP_ROOT" ]]; then
  echo "Backup kept at: $BACKUP_ROOT"
fi
