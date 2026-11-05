#!/usr/bin/env bash
# Efeitos de cena para vídeos de mistério (trovão, tranca, carimbo, coração, fita, tique-taque, apagão, rangido, vento, sting)
# e a trilha de ambiente do historia-2 (chuva + mar + vento + drone grave). Tudo sintetizado com o ffmpeg.
# Uso: bash scripts/gerar-sfx-misterio.sh
set -euo pipefail
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$RAIZ/public/sfx"
mkdir -p "$DIR" "$RAIZ/public/projetos/historia-2"
f() { ffmpeg -hide_banner -loglevel error -y "$@"; }
OUT="-ar 48000 -ac 2"

# trovão: estalo seco + rumor grave que demora a sumir
f -f lavfi -i "anoisesrc=d=2.8:c=brown:a=1" -f lavfi -i "anoisesrc=d=0.14:c=white:a=0.9" -filter_complex \
 "[0]lowpass=f=240,afade=t=in:d=0.05,afade=t=out:st=0.4:d=2.4,volume=3.2[a];[1]highpass=f=1200,afade=t=out:d=0.14[b];[a][b]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95" $OUT "$DIR/trovao.wav"
# tranca: dois cliques metálicos (ferrolho)
f -f lavfi -i "aevalsrc='0.7*sin(2*PI*1900*t)*exp(-t*140)':d=0.1" -f lavfi -i "aevalsrc='0.8*sin(2*PI*820*t)*exp(-t*70)+0.3*sin(2*PI*2400*t)*exp(-t*160)':d=0.2" -filter_complex \
 "[1]adelay=150|150[b];[0][b]amix=inputs=2:duration=longest:normalize=0" $OUT "$DIR/tranca.wav"
# carimbo: pancada seca em cima da mesa
f -f lavfi -i "aevalsrc='0.95*sin(2*PI*(95+70*exp(-t*30))*t)*exp(-t*16)':d=0.5" -f lavfi -i "anoisesrc=d=0.08:c=pink:a=0.7" -filter_complex \
 "[1]lowpass=f=1400,afade=t=out:d=0.08[n];[0][n]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95" $OUT "$DIR/carimbo.wav"
# coração: duas batidas graves
f -f lavfi -i "aevalsrc='0.9*sin(2*PI*58*t)*exp(-t*13)':d=0.35" -f lavfi -i "aevalsrc='0.7*sin(2*PI*52*t)*exp(-t*14)':d=0.35" -filter_complex \
 "[1]adelay=230|230[b];[0][b]amix=inputs=2:duration=longest:normalize=0" $OUT "$DIR/coracao.wav"
# fita: clique de play + chiado de fita velha
f -f lavfi -i "aevalsrc='0.7*sin(2*PI*600*t)*exp(-t*90)':d=0.12" -f lavfi -i "anoisesrc=d=1.2:c=white:a=0.5" -filter_complex \
 "[1]highpass=f=3500,lowpass=f=9000,volume=0.35,afade=t=in:d=0.1,afade=t=out:st=0.7:d=0.5[h];[0][h]amix=inputs=2:duration=longest:normalize=0" $OUT "$DIR/fita.wav"
# tique-taque de relógio
f -f lavfi -i "aevalsrc='0.5*sin(2*PI*2600*t)*exp(-t*110)':d=0.08" -f lavfi -i "aevalsrc='0.4*sin(2*PI*1800*t)*exp(-t*100)':d=0.08" -filter_complex \
 "[1]adelay=500|500[b];[0][b]amix=inputs=2:duration=longest:normalize=0" $OUT "$DIR/tictac.wav"
# apagão: queda de tom + estalo grave
f -f lavfi -i "aevalsrc='0.7*sin(2*PI*(420*exp(-t*3.2)+40)*t)*exp(-t*2.2)':d=1.4" -f lavfi -i "aevalsrc='0.9*sin(2*PI*50*t)*exp(-t*10)':d=0.4" -filter_complex \
 "[0][1]amix=inputs=2:duration=longest:normalize=0,alimiter=limit=0.95" $OUT "$DIR/apagao.wav"
# rangido de porta/madeira
f -f lavfi -i "aevalsrc='0.35*(sin(2*PI*(210+70*sin(2*PI*5*t)+60*t)*t)+0.5*sin(2*PI*(420+140*sin(2*PI*5*t)+120*t)*t))*sin(PI*t/1.3)':d=1.3" -af "lowpass=f=2500" $OUT "$DIR/rangido.wav"
# rajada de vento
f -f lavfi -i "anoisesrc=d=2.6:c=pink:a=0.9" -af "bandpass=f=700:width_type=h:w=900,afade=t=in:d=1.0,afade=t=out:st=1.2:d=1.4,volume=1.4" $OUT "$DIR/vento.wav"
# sting: cluster dissonante de suspense
f -f lavfi -i "aevalsrc='0.22*(sin(2*PI*233*t)+sin(2*PI*247*t)+sin(2*PI*349*t)+sin(2*PI*370*t))*exp(-t*2.2)+0.5*sin(2*PI*55*t)*exp(-t*3)':d=2.0" $OUT "$DIR/sting.wav"

# trilha de ambiente do historia-2 (60,7 s): chuva fina + mar + vento + drone grave, com respiração lenta
f -f lavfi -i "anoisesrc=d=60.7:c=pink:a=0.5" -f lavfi -i "anoisesrc=d=60.7:c=brown:a=1" -f lavfi -i "anoisesrc=d=60.7:c=pink:a=0.6" \
 -f lavfi -i "aevalsrc='0.22*sin(2*PI*55*t)+0.14*sin(2*PI*58.3*t)+0.08*sin(2*PI*82.4*t)':d=60.7" -filter_complex \
 "[0]highpass=f=2500,lowpass=f=9500,volume=0.45[chuva];[1]lowpass=f=520,tremolo=f=0.13:d=0.55,volume=1.1[mar];[2]bandpass=f=550:width_type=h:w=700,tremolo=f=0.1:d=0.7,volume=0.5[vento];[3]tremolo=f=0.1:d=0.4[drone];\
[chuva][mar][vento][drone]amix=inputs=4:duration=longest:normalize=0,afade=t=in:d=1.5,afade=t=out:st=58.2:d=2.5,alimiter=limit=0.9" $OUT "$RAIZ/public/projetos/historia-2/ambiente.wav"
ls -la "$DIR"/{trovao,tranca,carimbo,coracao,fita,tictac,apagao,rangido,vento,sting}.wav "$RAIZ/public/projetos/historia-2/ambiente.wav"
