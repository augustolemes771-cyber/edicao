# Uso: quadros.sh <saida.jpg> "proj:t1,t2" ...  -> folha com um quadro por tempo, na ordem (8 por linha)
out=$1; shift; S=$(mktemp -d); i=0
for it in "$@"; do p=${it%%:*}; for t in $(echo ${it#*:} | tr ',' ' '); do i=$((i+1))
  ffmpeg -v error -ss $t -i public/projetos/$p/bruto.mov -frames:v 1 -vf "scale=240:426:force_original_aspect_ratio=decrease,pad=240:426" -y $S/$(printf %03d $i).jpg; done; done
ffmpeg -v error -i $S/%03d.jpg -vf "tile=8x$(( (i+7)/8 ))" -frames:v 1 -y $out; rm -rf $S; echo "$i quadros"
