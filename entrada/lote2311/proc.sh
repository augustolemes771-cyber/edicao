# Prepara um projeto do lote (depois da transcrição): nomes, casar, plano, copy, rosto, pausas. Uso: bash proc.sh <p>
p=$1; cd /c/Users/MVM/edicao-painel; L=entrada/lote2311
export PYTHONIOENCODING=utf8
python $L/corrigir-nomes.py $p
(cd $L && python comparar.py $p && cp casado.json casado-$p.json)
python $L/gerar-planos.py $p
(cd $L && python copia.py $p)
python scripts/rosto-topo.py $p 2>&1 | tail -1
python scripts/pausas-fala.py $p 2>&1 | tail -1
python scripts/rosto-legenda.py $p 2>&1 | tail -1
python scripts/montar-ads.py $p --so-cortes 2>&1 | tail -25
S=/c/Users/MVM/AppData/Local/Temp/claude/438daadc4292fa56/f65b5eb9-8c2c-4b5e-8322-eac0eb8ead45/scratchpad
f=public/projetos/$p/bruto.mov; d=$(ffprobe -v error -show_entries format=duration -of csv=p=0 $f)
ffmpeg -v error -y -i $f -vf "fps=22/$d,scale=110:-1,tile=11x2" -frames:v 1 $S/t-$p.jpg
ffmpeg -v error -y -ss $(python -c "print(max(0,$d-66))") -i $f -vf "fps=1/3,scale=110:-1,tile=11x2" -frames:v 1 $S/f-$p.jpg
