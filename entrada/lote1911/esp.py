# Só as instruções que fogem do padrão (sem as genéricas), com a linha da copy ao lado e o começo da copy de cada AD.
import re, sys, html
GEN = ('PARA CRIADORES', 'Grave o vídeo onde', 'Só se atente', 'formato das legendas', 'formato da Headline e legendas', 'formato da headline e legendas',
       'Se tiver o produto, mostra', 'Se a criadora não tiver o produto', 'Seta apontando')
nome, ult = sys.argv[1], int(sys.argv[2])
t = re.sub(r'<img[^>]*>', '', open(f'rot/{nome}.html', encoding='utf8').read())
tabs = list(re.finditer(r'<table.*?</table>', t, re.S))
txt = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
for k, m in enumerate(tabs[-ult:]):
    ant = [txt(x) for x in re.findall(r'<p[^>]*>.*?</p>', t[max(0, m.start() - 4000):m.start()], re.S)]
    ant = [a for a in ant if a]
    tit = [a for a in ant if re.match(r'AD ?\d', a)]
    print(f'######## {nome} tab{len(tabs) - ult + k}: {tit[-1][:70] if tit else "?"}')
    for a in ant[ant.index(tit[-1]) + 1 if tit else 0:]:
        print('   *', a[:250])
    for row in re.findall(r'<tr.*?</tr>', m.group(), re.S):
        cols = [[txt(p) for p in re.findall(r'<p[^>]*>.*?</p>', c, re.S)] for c in re.findall(r'<td.*?</td>', row, re.S)]
        if len(cols) < 2: continue
        A, B = cols[0], cols[1]
        cp = [a for a in A if a and a != 'Copy:']
        print('   COPY:', ' '.join(cp)[:160])
        for i, b in enumerate(B):
            if b and not any(g in b for g in GEN):
                a = next((A[j] for j in range(i, -1, -1) if j < len(A) and A[j]), '')
                print(f'   [{i}] E: {b[:300]}\n        ~C: {a[:140]}')
