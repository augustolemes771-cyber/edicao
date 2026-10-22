#!/usr/bin/env bash
# Prévia rápida em 720p para assistir e aprovar. Uso: npm run preview -- <projeto> [opções do remotion]
set -euo pipefail
P="${1:?Uso: npm run preview -- <projeto>}"; shift || true
cd "$(dirname "$0")/.."
mkdir -p out
npx remotion render "$P" "out/$P-preview.mp4" --scale=0.6666666666666666 --crf=26 "$@"
echo "Prévia: out/$P-preview.mp4"
