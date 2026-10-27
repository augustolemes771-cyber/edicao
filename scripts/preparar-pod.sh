#!/usr/bin/env bash
# Prepara um pod Ubuntu (RunPod) para renderizar: instala, se faltar, Node 22, ffmpeg e as bibliotecas do Chrome headless.
# O painel roda isto pelo ssh (ssh pod bash -s < scripts/preparar-pod.sh). Cada passo imprime "##PCT n texto" para a barra.
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
SUDO=''
if [ "$(id -u)" -ne 0 ]; then SUDO='sudo'; fi
passo() { echo "##PCT $1 $2"; }
falta() { ! dpkg -s "$1" >/dev/null 2>&1; }

passo 3 'Atualizando a lista de pacotes'
$SUDO apt-get update -qq >/dev/null

passo 15 'Ferramentas básicas'
$SUDO apt-get install -y -qq --no-install-recommends ca-certificates curl gnupg tar xz-utils >/dev/null

MAIOR=$(node -v 2>/dev/null | sed -E 's/^v([0-9]+).*/\1/' || true)
if [ -z "$MAIOR" ] || [ "$MAIOR" -lt 22 ]; then
	passo 25 'Instalando o Node 22'
	curl -fsSL https://deb.nodesource.com/setup_22.x | $SUDO bash - >/dev/null
	$SUDO apt-get install -y -qq nodejs >/dev/null
else
	passo 25 "Node $(node -v) já instalado"
fi

if ! command -v ffmpeg >/dev/null; then
	passo 50 'Instalando o ffmpeg'
	$SUDO apt-get install -y -qq --no-install-recommends ffmpeg >/dev/null
else
	passo 50 'ffmpeg já instalado'
fi

# Bibliotecas que o Chrome headless do Remotion pede. No Ubuntu 24.04 a libasound2 virou libasound2t64.
ASOUND=libasound2
if apt-cache show libasound2t64 >/dev/null 2>&1; then ASOUND=libasound2t64; fi
LIBS=(libnss3 libdbus-1-3 libatk1.0-0 libatk-bridge2.0-0 libgbm1 "$ASOUND" libxrandr2 libxkbcommon0 libxfixes3 libxcomposite1 libxdamage1 libpango-1.0-0 libcairo2 libcups2 libdrm2 libxshmfence1 libegl1 libgles2 libgl1 fonts-liberation)
FALTAM=()
for l in "${LIBS[@]}"; do
	if falta "$l"; then FALTAM+=("$l"); fi
done
if [ ${#FALTAM[@]} -gt 0 ]; then
	passo 70 "Instalando ${#FALTAM[@]} biblioteca(s) do Chrome"
	$SUDO apt-get install -y -qq --no-install-recommends "${FALTAM[@]}" >/dev/null
else
	passo 70 'Bibliotecas do Chrome já instaladas'
fi

passo 95 'Conferindo'
echo "Node: $(node -v)"
echo "ffmpeg: $(ffmpeg -version | head -1 | cut -d' ' -f3)"
if command -v nvidia-smi >/dev/null; then
	echo "GPU: $(nvidia-smi --query-gpu=name --format=csv,noheader | head -1)"
else
	echo 'GPU: nenhuma placa NVIDIA (o render vai pela CPU)'
fi
passo 100 'Pod pronto'
