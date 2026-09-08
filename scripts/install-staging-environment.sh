#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

[[ ${EUID:-$(id -u)} -eq 0 ]] || { echo 'Run as root.' >&2; exit 1; }

STAGING_DOMAIN='staging.zetruv.com'
ADMIN_DOMAIN='admin-staging.zetruv.com'
API_DOMAIN='api-staging.zetruv.com'
EXPECTED_IP='103.175.207.127'
DEPLOY_USER='zetruv-deploy'
WRAPPER='/usr/local/bin/deploy-zetruv-frontend-staging'

for cmd in nginx curl certbot tar; do
  command -v "$cmd" >/dev/null 2>&1 || { echo "$cmd is required." >&2; exit 1; }
done
id "$DEPLOY_USER" >/dev/null 2>&1 || { echo "Missing deploy user: $DEPLOY_USER" >&2; exit 1; }

check_dns_best_effort() {
  local domain="$1"
  local resolved
  resolved=$(getent ahostsv4 "$domain" 2>/dev/null | awk 'NR==1 {print $1}' || true)
  if [[ "$resolved" == "$EXPECTED_IP" ]]; then
    echo "$domain DNS: $resolved"
  else
    echo "WARN: local VPS resolver returned '${resolved:-<empty>}' for $domain; continuing because Certbot will perform external validation."
  fi
}

check_dns_best_effort "$STAGING_DOMAIN"
check_dns_best_effort "$ADMIN_DOMAIN"
check_dns_best_effort "$API_DOMAIN"

curl -fsS --resolve "$API_DOMAIN:443:$EXPECTED_IP" "https://$API_DOMAIN/health" >/dev/null || {
  echo "STAGING API is not healthy at https://$API_DOMAIN/health" >&2
  exit 1
}

cat > "$WRAPPER" <<'WRAPPER'
#!/usr/bin/env bash
set -euo pipefail

EXPECTED_SHA="${1:-}"
ROOT="/var/www/zetruv-staging"
ADMIN_ROOT="/var/www/zetruv-admin-staging"
DOMAIN="staging.zetruv.com"
ADMIN_DOMAIN="admin-staging.zetruv.com"
API="https://api-staging.zetruv.com"
FORBIDDEN_APIS=("https://api-dev.zetruv.com" "https://api-dev.zetruv.dualangka.com")
ARCHIVE_URL="https://codeload.github.com/karkandea/zetruv-frontend/tar.gz/${EXPECTED_SHA}"

[[ "$EXPECTED_SHA" =~ ^[0-9a-f]{40}$ ]] || { echo "ERROR: invalid commit SHA"; exit 1; }

exec 9>"/tmp/zetruv-frontend-staging.lock"
flock -n 9 || { echo "ERROR: another staging deployment is running"; exit 1; }

BUILD_ROOT="$(mktemp -d /tmp/zetruv-frontend-staging-build.XXXXXX)"
ARCHIVE="${BUILD_ROOT}/source.tar.gz"
cleanup() { rm -rf "$BUILD_ROOT"; }
trap cleanup EXIT

echo "=== DOWNLOAD exact STAGING commit ${EXPECTED_SHA} ==="
curl -fL --retry 3 --connect-timeout 10 --max-time 120 "$ARCHIVE_URL" -o "$ARCHIVE"
mkdir -p "${BUILD_ROOT}/src"
tar -xzf "$ARCHIVE" -C "${BUILD_ROOT}/src" --strip-components=1
cd "${BUILD_ROOT}/src"

echo "=== BUILD staging ==="
rm -rf dist dist-admin
npm install --no-audit --no-fund
npm run build:all:staging
bash scripts/smoke-staging-environment.sh

[[ -f dist/index.html ]] || { echo "ERROR: dist/index.html missing"; exit 1; }
[[ -f dist-admin/index.html ]] || { echo "ERROR: dist-admin/index.html missing"; exit 1; }

for root in dist dist-admin; do
  grep -R -F "${API}/api/v1" "$root" >/dev/null || {
    echo "ERROR: $root bundle does not contain ${API}/api/v1"
    exit 1
  }
  for forbidden in "${FORBIDDEN_APIS[@]}"; do
    if grep -R -F "${forbidden}/api/v1" "$root" >/dev/null; then
      echo "ERROR: $root bundle contains wrong environment API: ${forbidden}"
      exit 1
    fi
  done
done

publish_release() {
  local root="$1"
  local source_dir="$2"
  local releases="${root}/releases"
  local release="${releases}/${EXPECTED_SHA}"
  mkdir -p "$releases"
  rm -rf "$release"
  mkdir -p "$release"
  cp -a "${source_dir}/." "$release/"
  local previous=""
  if [[ -L "${root}/current" ]]; then
    previous="$(readlink -f "${root}/current" || true)"
  fi
  ln -sfn "$release" "${root}/current"
  printf '%s' "$previous"
}

echo "=== CREATE RELEASE ==="
PREVIOUS="$(publish_release "$ROOT" dist)"
ADMIN_PREVIOUS="$(publish_release "$ADMIN_ROOT" dist-admin)"

rollback() {
  set +e
  if [[ -n "$PREVIOUS" && -d "$PREVIOUS" ]]; then
    echo "Rolling back storefront..." >&2
    ln -sfn "$PREVIOUS" "${ROOT}/current"
  fi
  if [[ -n "$ADMIN_PREVIOUS" && -d "$ADMIN_PREVIOUS" ]]; then
    echo "Rolling back admin..." >&2
    ln -sfn "$ADMIN_PREVIOUS" "${ADMIN_ROOT}/current"
  fi
}
trap rollback ERR

echo "=== LIVE SMOKE staging ==="
smoke_bundle() {
  local domain="$1"
  local expected_api="$2"
  local tmp_html tmp_js js_path
  tmp_html="$(mktemp)"
  tmp_js="$(mktemp)"
  curl -fsS --resolve "${domain}:443:127.0.0.1" "https://${domain}/" > "$tmp_html"
  js_path="$(grep -oE 'src="[^"]+\.js"' "$tmp_html" | head -1 | cut -d'"' -f2)"
  [[ -n "$js_path" ]] || { echo "ERROR: JS asset not found for $domain" >&2; return 1; }
  curl -fsS --resolve "${domain}:443:127.0.0.1" "https://${domain}${js_path}" > "$tmp_js"
  grep -Fq "${expected_api}/api/v1" "$tmp_js" || {
    echo "ERROR: live bundle for $domain has wrong API" >&2
    return 1
  }
  rm -f "$tmp_html" "$tmp_js"
}

smoke_bundle "$DOMAIN" "$API"
smoke_bundle "$ADMIN_DOMAIN" "$API"
curl -fsS --resolve "${API#https://}:443:127.0.0.1" "${API}/health" >/dev/null

trap - ERR

echo "PASS: staging"
echo "Commit : ${EXPECTED_SHA}"
echo "URL    : https://${DOMAIN}"
echo "Admin  : https://${ADMIN_DOMAIN}"
echo "API    : ${API}"
WRAPPER
chmod 755 "$WRAPPER"
chown root:root "$WRAPPER"

install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/www/zetruv-staging
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/www/zetruv-staging/releases
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/www/zetruv-admin-staging
install -d -o "$DEPLOY_USER" -g "$DEPLOY_USER" /var/www/zetruv-admin-staging/releases

STOREFRONT_SITE='/etc/nginx/sites-available/zetruv-frontend-staging-client'
ADMIN_SITE='/etc/nginx/sites-available/zetruv-admin-staging'

cat > "$STOREFRONT_SITE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $STAGING_DOMAIN;

    root /var/www/zetruv-staging/current;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
NGINX

cat > "$ADMIN_SITE" <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name $ADMIN_DOMAIN;

    root /var/www/zetruv-admin-staging/current;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }
}
NGINX

ln -sfn "$STOREFRONT_SITE" /etc/nginx/sites-enabled/zetruv-frontend-staging-client
ln -sfn "$ADMIN_SITE" /etc/nginx/sites-enabled/zetruv-admin-staging

nginx -t
systemctl reload nginx

certbot --nginx -d "$STAGING_DOMAIN" --non-interactive --agree-tos --redirect --register-unsafely-without-email
certbot --nginx -d "$ADMIN_DOMAIN" --non-interactive --agree-tos --redirect --register-unsafely-without-email

nginx -t
systemctl reload nginx

echo "PASS: STAGING frontend runtime prepared for https://$STAGING_DOMAIN and https://$ADMIN_DOMAIN"
echo "STAGING deploy wrapper installed: $WRAPPER"
