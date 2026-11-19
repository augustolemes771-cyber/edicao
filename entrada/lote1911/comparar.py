# Para cada vídeo: AD casado, trechos da fala fora da copy (>= 3 palavras, com tempo), menção ao produto e começo do CTA.
import json, re, sys, os, difflib, unicodedata
sys.path.insert(0, '.')
from secoes import secoes
ROT = {'al': 'aline', 'la': 'lari', 'le': 'leticia', 'li': 'livia', 'lo': 'lorena', 'ma': 'mariana', 'mc': 'mariaclara', 'fe': 'fernanda', 'al': 'aline', 'v': 'vanessa'}
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)
tri = lambda ws: {tuple(ws[i:i + 3]) for i in range(len(ws) - 2)}
out = {}
for l in open('lista.tsv', encoding='utf8'):
    p = l.split('\t')[0]
    if sys.argv[1:] and p not in sys.argv[1:]: continue
    W = [w for w in json.load(open(f'../../src/projetos/{p}/transcricao.json', encoding='utf8')) if norm(w['text'])]
    k = [norm(w['text']) for w in W]
    S = secoes(ROT[re.match(r'[a-z]+', p).group()])
    best = max(S, key=lambda s: len(tri(k) & tri([norm(x) for x in ' '.join(c[0] for c in s['cols'] if c).split()])) / max(1, len(tri([norm(x) for x in ' '.join(c[0] for c in s['cols'] if c).split()]))))
    cp = [norm(x) for x in ' '.join(c[0] for c in best['cols'] if c).split()]; cp = [x for x in cp if x and x != 'copy']
    sm = difflib.SequenceMatcher(None, k, cp, autojunk=False)
    extra = []
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag in ('insert', 'equal'): continue
        if i2 - i1 >= 3: extra.append((W[i1]['startMs'] / 1000, W[i2 - 1]['endMs'] / 1000, ' '.join(w['text'].strip() for w in W[i1:i2])))
    print(f'==== {p} [{best["n"]}] {best["titulo"][:50]}  ({W[-1]["endMs"]/1000:.1f}s)')
    for a, b, t in extra: print(f'   fora {a:6.2f}-{b:6.2f}: {t[:220]}')
    out[p] = best['n']
json.dump(out, open('casado.json', 'w'))
