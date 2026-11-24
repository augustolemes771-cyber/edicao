# Grava a copy do AD casado ("_copy") no plano-ad de cada projeto, para o montar-ads separar regravação de repetição da copy.
# Uso (dentro de entrada/<lote>): python copia.py [projeto ...]   (usa casado.json do comparar.py)
import json, sys, os
sys.path.insert(0, '.')
from secoes import secoes
import re
ROT = {'al': 'aline', 'la': 'lari', 'le': 'leticia', 'li': 'livia', 'lo': 'lorena', 'ma': 'mariana', 'mc': 'mariaclara', 'fe': 'fernanda', 'ka': 'karol', 'v': 'vanessa'}
cas = json.load(open('casado.json'))
for p, n in cas.items():
    if sys.argv[1:] and p not in sys.argv[1:]: continue
    s = secoes(ROT[re.match(r'[a-z]+', p).group()])[n]
    copy = ' '.join(c[0] for c in s['cols'] if c)
    arq = f'../../src/projetos/{p}/plano-ad.json'
    pl = json.load(open(arq, encoding='utf-8')); pl['_copy'] = copy
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, n, len(copy.split()), 'palavras de copy')
