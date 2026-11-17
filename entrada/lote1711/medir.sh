cd /c/Users/MVM/edicao-painel
for p in $(cut -f1 entrada/lote1711/lista.tsv); do
  python scripts/pausas-fala.py $p
  python scripts/rosto-legenda.py $p 2>&1 | tail -1
done
echo FIM
