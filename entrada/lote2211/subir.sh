# Copia os finais para G:\My Drive\17-11-2026 14h12\<Criadora>\"<Criadora> <nome original>.mp4" (o Drive do PC sobe sozinho);
# depois a pasta é movida para dentro de augusto pelo conector.
cd /c/Users/MVM/edicao-painel
D="/g/My Drive/$(cat entrada/lote2211/pasta-drive.txt)"
while IFS=$'\t' read p id cam; do
  f=out/$p-final.mp4; [ -s $f ] || { echo "FALTA $p"; continue; }
  case ${p%%-*} in al) c=Aline;; la) c=Larissa;; le) c="Letícia";; li) c="Lívia";; lo) c=Lorena;; ma) c=Mariana;; mc) c="Maria Clara";;
    *) c=Vanessa;; esac
  n=$(basename "$cam"); n=${n//:/-}; n=${n%.*}; [ "$n" = "$(basename "$cam")" ] || true
  base=$(basename "$cam"); case "$base" in *.*) n="${base%.*}";; *) n="$base";; esac; n=${n//:/-}
  # nomes com "/" (ex.: pasta "17/11 AD 01" e arquivo "17/11 AD 01.mov") vêm partidos pelo basename: usa o fim do caminho do Drive
  [ "$p" = v1711-ad01 ] && n="17-11 AD 01"
  mkdir -p "$D/$c"; cp $f "$D/$c/$c $n.mp4" && echo "ok $p -> $c/$c $n.mp4"
done < <(grep -v '^li-1611-01' entrada/lote2211/lista.tsv)
