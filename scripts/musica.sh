#!/usr/bin/env bash
# Prepara a trilha: normaliza em -14 LUFS para o volume -22 dB do edit.ts ficar ~22 dB abaixo da voz.
# Uso: npm run musica -- <projeto> <arquivo de áudio>
set -euo pipefail
P="${1:?Uso: npm run musica -- <projeto> <arquivo>}"; A="${2:?Falta o arquivo de áudio}"
cd "$(dirname "$0")/.."
mkdir -p "public/projetos/$P"
ffmpeg -hide_banner -loglevel error -y -i "$A" -vn -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:a aac -b:a 256k "public/projetos/$P/musica.m4a"
echo "Trilha em public/projetos/$P/musica.m4a. No edit.ts: musica: {arquivo: 'musica.m4a'}"
