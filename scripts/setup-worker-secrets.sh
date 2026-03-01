#!/usr/bin/env bash
# setup-worker-secrets.sh
# Sets all Cloudflare Worker secrets from .env.local
# Run once after initial clone or when secrets change.
#
# Usage:
#   CLOUDFLARE_API_TOKEN=your_token bash scripts/setup-worker-secrets.sh
#
# Or, if you're already logged in via `wrangler login`:
#   bash scripts/setup-worker-secrets.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$ROOT_DIR/.env.local"
WORKER_DIR="$ROOT_DIR/apps/worker"

if [ ! -f "$ENV_FILE" ]; then
  echo "❌ .env.local not found at $ENV_FILE"
  exit 1
fi

# Load .env.local (skip comments and blank lines)
set -o allexport
# shellcheck disable=SC1090
source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$')
set +o allexport

cd "$WORKER_DIR"

echo "🔐 Setting Cloudflare Worker secrets for: travel-capsule-worker"
echo ""

put_secret() {
  local NAME="$1"
  local VALUE="${!NAME:-}"
  if [ -z "$VALUE" ]; then
    echo "⚠️  SKIP $NAME (not set in .env.local)"
    return
  fi
  echo "$VALUE" | npx wrangler secret put "$NAME" --name travel-capsule-worker
  echo "✅ $NAME"
}

# Required secrets
put_secret ANTHROPIC_API_KEY
put_secret NANOBANANA_API_KEY
put_secret POLAR_ACCESS_TOKEN
put_secret POLAR_WEBHOOK_SECRET
put_secret SUPABASE_SERVICE_ROLE_KEY
put_secret R2_ACCESS_KEY_ID
put_secret R2_SECRET_ACCESS_KEY
put_secret RESEND_API_KEY
put_secret GOOGLE_PLACES_API_KEY
put_secret CLOUDFLARE_TURNSTILE_SECRET_KEY

echo ""
echo "✅ All secrets deployed to Cloudflare Worker."
echo "   The Worker will pick up new secrets on the next request."
