# Casa cada vídeo com o AD do roteiro da criadora pela fala (sobreposição de trigramas entre a transcrição e a copy).
import json, re, sys, unicodedata, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from secoes import secoes
os.chdir(os.path.dirname(os.path.abspath(__file__)))
ROT = {'al': 'aline', 'la': 'lari', 'le': 'leticia', 'li': 'livia', 'lo': 'lorena', 'ma': 'mariana', 'mc': 'mariaclara', 'fe': 'fernanda', 'al': 'aline', 'v': 'vanessa'}
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9 ]', ' ', s).split()
tri = lambda ws: {tuple(ws[i:i + 3]) for i in range(len(ws) - 2)}
for l in open('lista.tsv', encoding='utf8'):
    p = l.split('\t')[0]
    if sys.argv[1:] and p not in sys.argv[1:]: continue
    tj = f'../../src/projetos/{p}/transcricao.json'
    if not os.path.exists(tj): print(p, 'sem transcrição'); continue
    fala = tri(norm(' '.join(w['text'] for w in json.load(open(tj, encoding='utf8')))))
    cr = ROT[re.match(r'[a-z]+', p).group()]
    S = secoes(cr)
    sc = []
    for s in S:
        cp = ' '.join(c[0] for c in s['cols'] if c)
        t = tri(norm(cp))
        if t: sc.append((len(fala & t) / max(1, min(len(t), len(fala))), s['n'], s['titulo']))
    sc.sort(reverse=True)
    print(p, ' | '.join(f'[{n}] {t[:34]} {x:.2f}' for x, n, t in sc[:3]))
