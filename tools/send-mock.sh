#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-http://localhost:8080}"
SECRET="${WEBHOOK_SECRET:-change-me}"

curl -i -X POST "${BASE_URL}/webhooks/trello" \
  -H "content-type: application/json" \
  -H "x-webhook-secret: ${SECRET}" \
  --data @"$(dirname "$0")/mock-trello-event.json"
