#!/usr/bin/env bash
# Render final em 4K (--scale=2), 50 Mbps, e mix em -14 LUFS / -1,5 dBTP sem mexer no vídeo.
# Uso: npm run render -- <projeto> [opções do remotion]
set -euo pipefail
P="${1:?Uso: npm run render -- <projeto>}"; shift || true
cd "$(dirname "$0")/.."
mkdir -p out
npx tsx scripts/conferir.ts "$P" > "out/$P-conferir.txt" || { cat "out/$P-conferir.txt"; echo "Corrija os erros antes do render."; exit 1; }
npx remotion render "$P" "out/$P-bruto.mp4" --scale=2 --codec=h264 --video-bitrate=50M --audio-codec=aac --audio-bitrate=320k --hardware-acceleration=if-possible "$@"

# Loudness em duas passadas (EBU R128): mede, depois aplica linear.
MEDIDA=$(ffmpeg -hide_banner -nostats -i "out/$P-bruto.mp4" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
pega() { echo "$MEDIDA" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
ffmpeg -hide_banner -loglevel error -y -i "out/$P-bruto.mp4" -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$(pega input_i):measured_TP=$(pega input_tp):measured_LRA=$(pega input_lra):measured_thresh=$(pega input_thresh):offset=$(pega target_offset):linear=true,aresample=48000" \
  -c:a aac -b:a 320k -movflags +faststart "out/$P-final.mp4"
echo "Medição final:"
ffmpeg -hide_banner -nostats -i "out/$P-final.mp4" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
echo "Pronto: out/$P-final.mp4"
