# Tabelas (copy x editor) do roteiro em HTML: alinha parágrafo a parágrafo as duas colunas. Uso: python tab.py <doc> <n-últimas-tabelas>
import re, sys, html
t = open(f'rot/{sys.argv[1]}.html', encoding='utf8').read()
t = re.sub(r'<img[^>]*>', '', t)
tabs = list(re.finditer(r'<table.*?</table>', t, re.S))
ult = int(sys.argv[2]) if len(sys.argv) > 2 else 4
def txt(x): return html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
for m in tabs[-ult:]:
    ant = t[max(0, m.start() - 3000):m.start()]
    tit = [txt(x) for x in re.findall(r'<p[^>]*>.*?</p>', ant, re.S) if 'AD' in txt(x)]
    print('########', tit[-1][:80] if tit else '?')
    for row in re.findall(r'<tr.*?</tr>', m.group(), re.S):
        cells = re.findall(r'<td.*?</td>', row, re.S)
        cols = [[txt(p) for p in re.findall(r'<p[^>]*>.*?</p>', c, re.S)] for c in cells]
        if len(cols) < 2: continue
        A, B = cols[0], cols[1]
        for i in range(max(len(A), len(B))):
            a = A[i] if i < len(A) else ''; b = B[i] if i < len(B) else ''
            if a or b: print(f'{i:2d} C: {a[:150]:<150} | E: {b[:260]}')
