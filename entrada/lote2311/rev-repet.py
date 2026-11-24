# Procura fala repetida no FINAL retranscrito (src/projetos/rev-<p>) comparando com a copy do plano.
import json, re, sys, unicodedata, os
def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9%$]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))
ps = sys.argv[1:] or [l.strip() for l in open('entrada/lote2311/rev-lista.txt')]
for p in ps:
    f = f'src/projetos/rev-{p}/transcricao.json'
    if not os.path.exists(f): continue
    d = json.load(open(f, encoding='utf8'))
    W = [{'text': w['text'], 'startMs': w['start']*1000} for w in (d['words'] if isinstance(d, dict) else d) if w.get('type', 'word') == 'word' and norm(w['text'])] if isinstance(d, dict) else [w for w in d if norm(w['text'])]
    k = [norm(w['text']) for w in W]
    plano = json.load(open(f'src/projetos/{p}/plano-ad.json', encoding='utf8'))
    copy = [norm(x) for x in plano.get('_copy', '').split() if norm(x)]
    def conta(seq, l): return sum(l[i:i+len(seq)] == seq for i in range(len(l)-len(seq)+1))
    achados = []
    for n in (2, 3):
        for i in range(len(k)-n+1):
            seq = k[i:i+n]
            for j in range(i+1, min(len(k)-n+1, i+25)):
                if k[j:j+n] == seq and conta(seq, k) > conta(seq, copy):
                    if n == 2 and len(''.join(seq)) < 7: continue
                    achados.append((W[i]['startMs']/1000, W[j]['startMs']/1000, ' '.join(w['text'].strip() for w in W[max(0,i-6):j+n+6])))
    vistos = set(); out = []
    for a, b, t in achados:
        if (round(a), round(b)) in vistos: continue
        vistos.add((round(a), round(b))); out.append(f'   {a:5.1f} / {b:5.1f}  "{t}"')
    print(f'== {p} ({len(out)} suspeitas)')
    for o in out: print(o)
    if '-v' in os.environ.get('REV', ''):
        print('   FINAL:', ' '.join(w['text'].strip() for w in W))
        print('   COPY :', plano.get('_copy', '')[:600])
