# Espera os downloads, converte para 30 fps constantes os brutos com taxa variável (máx. 2 NVENC) e transcreve em fila.
cd /c/Users/MVM/edicao-painel
L=entrada/lote2111
until grep -q FIM $L/baixar.log; do sleep 10; done
conv(){ p=$1; d=public/projetos/$p
  fr=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate,avg_frame_rate -of csv=p=0 $d/bruto.mov)
  r=${fr%%,*}; a=${fr##*,}
  ok=$(python -c "r=eval('$r');a=eval('$a');print(int(abs(r-a)<0.05 and abs(r-30)<0.05))")
  [ "$ok" = 1 ] && { echo "$p cfr ($fr)"; return; }
  [ -s $d/bruto-original.mov ] || mv $d/bruto.mov $d/bruto-original.mov
  ffmpeg -v error -y -i $d/bruto-original.mov -vf fps=30 -c:v h264_nvenc -preset p5 -cq 19 -g 15 -bf 0 -c:a aac -b:a 192k -ar 48000 $d/bruto.tmp.mp4 && mv $d/bruto.tmp.mp4 $d/bruto.mov && echo "$p convertido ($fr)"; }
export -f conv
cut -f1 $L/lista.tsv | xargs -P 2 -I{} bash -c 'conv {}' > $L/cfr.log 2>&1
node scripts/fila-transcricao.mjs $(cut -f1 $L/lista.tsv) --paralelo 1 --porjob 0.6 > $L/transcricao.log 2>&1
echo FIM >> $L/transcricao.log
