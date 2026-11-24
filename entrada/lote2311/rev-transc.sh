cd /c/Users/MVM/edicao-painel
for p in $(cat entrada/lote2311/rev-lista.txt | tr -d '\r'); do
  [ -s src/projetos/rev-$p/transcricao.json ] && continue
  node scripts/transcrever.mjs rev-$p out/$p-final.mp4 > out/transc-rev-$p.log 2>&1 && echo "OK $p" || echo "ERRO $p"
done
echo FIM
