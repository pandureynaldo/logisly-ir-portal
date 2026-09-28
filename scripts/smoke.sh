#!/usr/bin/env bash
set -euo pipefail
API="${API_ORIGIN:-http://localhost:3001}"

echo "== health =="
curl -sf "$API/api/health" | grep -q '"ok":true'
echo "ok"

echo "== unauthenticated /api/me expects 401 =="
code=$(curl -s -o /dev/null -w "%{http_code}" "$API/api/me")
test "$code" = "401"
echo "ok ($code)"

echo "== unauthenticated create expects 401 =="
code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/api/incidents" -H 'Content-Type: application/json' -d '{"description":"x"}')
test "$code" = "401"
echo "ok ($code)"

echo "Smoke passed."
