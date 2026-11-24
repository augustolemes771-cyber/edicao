# Converte (se taxa variável) e transcreve cada vídeo assim que o download termina; um por vez.
cd /c/Users/MVM/edicao-painel
L=entrada/lote2311
conv(){ p=$1; d=public/projetos/$p
  fr=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate,avg_frame_rate -of csv=p=0 $d/bruto.mov)
  r=${fr%%,*}; a=${fr##*,}
  ok=$(python -c "r=eval('$r');a=eval('$a');print(int(abs(r-a)<0.05 and abs(r-30)<0.05))")
  [ "$ok" = 1 ] && { echo "$p cfr ($fr)"; return; }
  [ -s $d/bruto-original.mov ] || mv $d/bruto.mov $d/bruto-original.mov
  ffmpeg -v error -y -i $d/bruto-original.mov -vf fps=30 -c:v h264_nvenc -preset p5 -cq 19 -g 15 -bf 0 -c:a aac -b:a 192k -ar 48000 $d/bruto.tmp.mp4 && mv $d/bruto.tmp.mp4 $d/bruto.mov && echo "$p convertido ($fr)"; }
feito=" "
while :; do
  pend=0
  for p in $(cut -f1 ${LISTA:-$L/lista.tsv}); do
    case "$feito" in *" $p "*) continue;; esac
    pend=1
    [ -s public/projetos/$p/bruto.mov ] || continue
    conv $p
    node scripts/fila-transcricao.mjs $p --paralelo 1 --porjob 0.6 2>&1 | tail -2
    echo "TRANSCRITO $p $(wc -c < src/projetos/$p/transcricao.json)"
    feito="$feito$p "
  done
  [ $pend = 0 ] && break
  sleep 20
done
echo FIM
