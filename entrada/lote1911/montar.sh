# Monta os finais do lote, 2 por vez (limite da placa: máx. 2 NVENC).
cd /c/Users/MVM/edicao-painel
cut -f1 entrada/lote1911/lista-montar.tsv | grep -v -x -f <(printf '%s\n' "$@") | xargs -P 2 -I{} bash -c 'PYTHONIOENCODING=utf8 python scripts/montar-ads.py {} 2>&1 | tail -1'
echo FIM
