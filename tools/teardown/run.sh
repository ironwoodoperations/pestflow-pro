#!/usr/bin/env bash
set -euo pipefail
URL="${1:?Usage: ./run.sh <prospect-url> <slug>}"
SLUG="${2:?provide a slug}"
OUT="output/$SLUG"
mkdir -p "$OUT/frames"

echo "==> [1/3] Scoring $URL"
node opportunity-scorer.js "$URL" | tee "$OUT/score.json"

TIER=$(node -e "console.log(require('./$OUT/score.json').tier)" 2>/dev/null || echo "unknown")
echo "==> Tier: $TIER"

echo "==> [2/3] Recording walkthrough"
node record-walkthrough.js "$URL" "$OUT"
VID=$(ls "$OUT"/*.webm | head -1)

echo "==> [3/3] Extracting frames (assembly bridge)"
for t in 2 6 10 14; do ffmpeg -y -i "$VID" -ss $t -vframes 1 "$OUT/frames/frame_$t.png" 2>/dev/null || true; done

echo "==> DONE. Artifacts in $OUT/"
ls -la "$OUT" "$OUT/frames"
