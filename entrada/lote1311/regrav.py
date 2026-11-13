# Mostra as palavras que a regra de regravação do montar-ads apaga (mesma lógica: 9 palavras iguais adiante, até 30 palavras).
import json, re, sys, unicodedata
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); return re.sub(r'[^a-z0-9%$]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))
for p in sys.argv[1:]:
    T = json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf-8'))
    W = [{'t': w['text'].strip(), 'a': w['startMs'] / 1000} for w in T if w['text'].strip()]
    P = []
    for w in W:
        if P and not norm(w['t']): P[-1]['t'] += w['t']
        else: P.append(dict(w))
    W = P; N = 9; k = [norm(w['t']) for w in W]; ap = []; i = 0
    while i < len(W) - N:
        alvo = k[i:i + N]; ach = None
        for j in range(i + 3, min(len(W) - N, i + 30)):
            if k[j:j + N] == alvo: ach = j
        if ach: ap.append((W[i]['a'], ' '.join(w['t'] for w in W[i:ach]))); i = ach
        else: i += 1
    print(p, ap)
