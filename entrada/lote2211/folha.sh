# Folha de quadros: uma linha por projeto, 10 quadros espalhados no bruto.
S=$1; shift; cd /c/Users/MVM/edicao-painel
for p in "$@"; do f=public/projetos/$p/bruto.mov; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)
  ffmpeg -v error -y -i $f -vf "fps=10/$d,scale=135:240,drawbox=x=0:y=0:w=135:h=240:color=black@0:t=1,tile=10x1" -frames:v 1 $S/l-$p.png; done
