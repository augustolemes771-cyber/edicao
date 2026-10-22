#!/usr/bin/env bash
# Gera efeitos sonoros simples com o ffmpeg, para o projeto funcionar de cara.
# Para usar a sua biblioteca, troque os arquivos de public/sfx/ mantendo os nomes.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/public/sfx"
mkdir -p "$DIR"
f() { ffmpeg -hide_banner -loglevel error -y "$@"; }

f -f lavfi -i "anoisesrc=d=0.35:c=pink:a=0.9" -af "highpass=f=900,lowpass=f=7000,afade=t=in:d=0.12,afade=t=out:st=0.14:d=0.21,volume=0.9" -ar 48000 -ac 2 "$DIR/swish.wav"
f -f lavfi -i "anoisesrc=d=0.6:c=brown:a=1" -af "highpass=f=200,lowpass=f=3000,afade=t=in:d=0.25,afade=t=out:st=0.28:d=0.32,volume=1.4" -ar 48000 -ac 2 "$DIR/whoosh.wav"
f -f lavfi -i "aevalsrc='0.8*sin(2*PI*(520+900*exp(-t*40))*t)*exp(-t*28)':d=0.18" -ar 48000 -ac 2 "$DIR/pop.wav"
f -f lavfi -i "aevalsrc='0.5*sin(2*PI*2400*t)*exp(-t*90)':d=0.06" -ar 48000 -ac 2 "$DIR/tick.wav"
f -f lavfi -i "aevalsrc='0.18*(sin(2*PI*2093*t)+sin(2*PI*2637*t)+sin(2*PI*3136*t)+sin(2*PI*4186*t))*exp(-t*4)*(0.6+0.4*sin(2*PI*14*t))':d=0.9" -ar 48000 -ac 2 "$DIR/shimmer.wav"
f -f lavfi -i "aevalsrc='0.45*sin(2*PI*(180*t+260*t*t))*min(1,t*3)*exp(-max(0,t-1.1)*12)':d=1.3" -ar 48000 -ac 2 "$DIR/rise.wav"
f -f lavfi -i "aevalsrc='0.95*sin(2*PI*(42+60*exp(-t*9))*t)*exp(-t*3.2)':d=1.0" -af "lowpass=f=400" -ar 48000 -ac 2 "$DIR/boom.wav"
f -f lavfi -i "anoisesrc=d=0.22:c=white:a=0.5" -af "acrusher=bits=4:mode=log:samples=12,highpass=f=1500,afade=t=out:st=0.1:d=0.12" -ar 48000 -ac 2 "$DIR/glitch.wav"
echo "Efeitos em $DIR:"; ls "$DIR"
