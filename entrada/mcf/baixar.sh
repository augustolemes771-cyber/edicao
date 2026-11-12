cd /c/Users/MVM/edicao-painel
baixa(){ p=$1; id=$2; d=public/projetos/$p; mkdir -p $d; [ -s $d/bruto.mov ] && { echo "$p já"; return; }
  curl -s -L --retry 3 "https://drive.usercontent.google.com/download?id=$id&export=download&confirm=t" -o $d/bruto.part && mv $d/bruto.part $d/bruto.mov && echo "$p ok $(du -h $d/bruto.mov|cut -f1)"; }
export -f baixa
cut -f1,2 entrada/mcf/lista.tsv | xargs -P 4 -L 1 bash -c 'baixa $0 $1'
echo FIM
