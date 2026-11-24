# Varre a pasta do Drive das criadoras pela visão pública (embeddedfolderview) e grava arvore.tsv: tipo, id, caminho, data.
import re, sys, html, urllib.request, concurrent.futures as cf
RAIZ = sys.argv[1] if len(sys.argv) > 1 else '1wd5aD4PLLcLaBC4yBvvauHS2cM1YVbW0'
def lista(fid):
    for _ in range(4):
        try:
            t = urllib.request.urlopen(f'https://drive.google.com/embeddedfolderview?id={fid}', timeout=30).read().decode('utf8')
            break
        except Exception as e: err = e
    else: raise err
    out = []
    for m in re.finditer(r'<div class="flip-entry" id="entry-([^"]+)".*?<a href="([^"]+)".*?flip-entry-title">([^<]*)</div>.*?flip-entry-last-modified"><div>([^<]*)<', t, re.S):
        i, href, nome, data = m.groups()
        out.append(('pasta' if '/folders/' in href else 'arq', i, html.unescape(nome).strip(), data))
    return out
linhas = []
fila = [(RAIZ, '')]
with cf.ThreadPoolExecutor(8) as ex:
    while fila:
        res = list(ex.map(lambda x: (x, lista(x[0])), fila)); fila = []
        for (fid, cam), ents in res:
            for tp, i, nome, data in ents:
                c = f'{cam}/{nome}' if cam else nome
                linhas.append((tp, i, c, data))
                if tp == 'pasta': fila.append((i, c))
linhas.sort(key=lambda l: l[2])
open('arvore.tsv', 'w', encoding='utf8').write(''.join('\t'.join(l) + '\n' for l in linhas))
print(len(linhas), 'itens;', sum(l[0] == 'pasta' for l in linhas), 'pastas')
