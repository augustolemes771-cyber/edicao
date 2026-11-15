# Compara a fala do bruto (sem os trechos cortados de propósito) com a fala transcrita do vídeo final: lista palavras que sumiram.
import json, re, sys, unicodedata, difflib
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)
for p in sys.argv[1:]:
    pl = json.load(open(f'src/projetos/{p}/plano-ad.json', encoding='utf-8'))
    cort = pl.get('cortar', [])
    A = [w for w in json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf-8')) if norm(w['text'])]
    A = [w for w in A if not any(a <= (w['startMs'] + w['endMs']) / 2000 <= b for a, b in cort)]
    B = [w for w in json.load(open(f'src/projetos/chk-{p}/transcricao.json', encoding='utf-8')) if norm(w['text'])]
    a = [norm(w['text']) for w in A]; b = [norm(w['text']) for w in B]
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    falta = []
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op in ('delete', 'replace') and i2 - i1 >= 1:
            falta.append((A[i1]['startMs'] / 1000, ' '.join(w['text'].strip() for w in A[i1:i2]), ' '.join(w['text'].strip() for w in B[j1:j2])))
    print(f'==== {p}: {sm.ratio():.3f} de semelhança, {len(falta)} diferenças')
    for t, x, y in falta: print(f'  {t:6.1f}  bruto: {x!r:50}  final: {y!r}')
