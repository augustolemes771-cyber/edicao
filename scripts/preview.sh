#!/usr/bin/env bash
# Prévia rápida para assistir e aprovar.
# Uso: npm run preview -- <projeto> [--de SEG] [--ate SEG] [--res 540|720|1080] [opções do remotion]
#   --de / --ate  renderiza só esse trecho (em segundos do vídeo editado), para revisar uma alteração
#   --res         altura da prévia na vertical (largura na horizontal); padrão 720, 540 é ~2x mais rápido
# Ex.: npm run preview -- depoimento-danilow --de 53 --ate 58.3 --res 540
set -euo pipefail
P="${1:?Uso: npm run preview -- <projeto> [--de SEG] [--ate SEG] [--res 540|720|1080]}"; shift || true
cd "$(dirname "$0")/.."
DE=""; ATE=""; RES=720; EXTRA=()
while [ $# -gt 0 ]; do
  case "$1" in
    --de) DE="$2"; shift 2 ;;
    --ate) ATE="$2"; shift 2 ;;
    --res) RES="$2"; shift 2 ;;
    *) EXTRA+=("$1"); shift ;;
  esac
done
# A composição tem 1080 no lado menor: a escala é RES/1080 (2/3 = 720p, 1/2 = 540p, 1 = 1080p).
case "$RES" in
  540) ESCALA=0.5 ;;
  720) ESCALA=0.6666666666666666 ;;
  1080) ESCALA=1 ;;
  *) echo "--res aceita 540, 720 ou 1080"; exit 1 ;;
esac
FPS=30
QUADROS=(); NOME="$P-preview"
if [ -n "$DE" ] || [ -n "$ATE" ]; then
  INI=$(awk "BEGIN{printf \"%d\", ${DE:-0} * $FPS}")
  if [ -n "$ATE" ]; then FIM=$(awk "BEGIN{printf \"%d\", $ATE * $FPS - 1}"); QUADROS=(--frames="$INI-$FIM"); else QUADROS=(--frames="$INI-"); fi
  NOME="$P-preview-${DE:-0}s-${ATE:-fim}s"
fi
mkdir -p out
npx remotion render "$P" "out/$NOME.mp4" --scale="$ESCALA" --crf=26 "${QUADROS[@]}" "${EXTRA[@]}"
echo "Prévia: out/$NOME.mp4"
