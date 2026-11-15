cd /c/Users/Administrator/edicao-painel
conv(){ p=$1; d=public/projetos/$p; [ -s $d/bruto-original.mov ] || mv $d/bruto.mov $d/bruto-original.mov
  ffmpeg -v error -y -i $d/bruto-original.mov -vf fps=30 -c:v h264_nvenc -preset p5 -cq 19 -g 15 -bf 0 -c:a aac -b:a 192k -ar 48000 $d/bruto.tmp.mp4 && mv $d/bruto.tmp.mp4 $d/bruto.mov && echo "$p ok $(ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,avg_frame_rate -of csv=p=0 $d/bruto.mov)"; }
export -f conv
cut -f1 entrada/lote1411/lista.tsv | xargs -P 3 -I{} bash -c 'conv {}'
echo FIM
