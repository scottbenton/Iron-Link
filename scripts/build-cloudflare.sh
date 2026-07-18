#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
POSTHOG_CLI_BIN="${ROOT_DIR}/node_modules/.bin/posthog-cli"

cd "${ROOT_DIR}"

echo "Running frontend build..."
npm run build

if [[ "${CF_PAGES_BRANCH:-}" != "main" ]]; then
  echo "Skipping PostHog source map upload on branch '${CF_PAGES_BRANCH:-<unset>}'"
  exit 0
fi

require_env() {
  local name="$1"
  local value="${!name:-}"

  if [[ -z "${value}" ]]; then
    echo "Missing required environment variable '${name}' for the Cloudflare main build." >&2
    exit 1
  fi
}

require_env CF_PAGES_COMMIT_SHA
require_env POSTHOG_CLI_PROJECT_ID
require_env POSTHOG_CLI_API_KEY

if [[ ! -x "${POSTHOG_CLI_BIN}" ]]; then
  echo "PostHog CLI is not installed at ${POSTHOG_CLI_BIN}. Run npm ci so @posthog/cli is available." >&2
  exit 1
fi

echo "Injecting PostHog source map metadata into dist..."
"${POSTHOG_CLI_BIN}" sourcemap inject --directory dist

echo "Uploading PostHog source maps for iron-link-web at ${CF_PAGES_COMMIT_SHA}..."
cli_args=()

if [[ -n "${POSTHOG_CLI_HOST:-}" ]]; then
  cli_args+=(--host "${POSTHOG_CLI_HOST}")
fi

upload_args=(
  sourcemap upload
  --directory dist
  --release-name iron-link-web
  --release-version "${CF_PAGES_COMMIT_SHA}"
  --delete-after
)

POSTHOG_CLI_PROJECT_ID="${POSTHOG_CLI_PROJECT_ID}" \
POSTHOG_CLI_API_KEY="${POSTHOG_CLI_API_KEY}" \
"${POSTHOG_CLI_BIN}" "${cli_args[@]}" "${upload_args[@]}"
