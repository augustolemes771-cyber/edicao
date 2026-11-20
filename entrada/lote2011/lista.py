# Monta lista.tsv (projeto, id, caminho no Drive) dos vídeos pendentes: fora de EDITADOS e de augusto, sem projeto pronto.
import re
M = {'Vanessa Aranha': 'v', 'LARISSA': 'la-', 'Lorena': 'lo-', 'Aline': 'al-', 'LIVIA': 'li-', 'Maria Clara': 'mc-', 'MARIANA': 'ma-', 'Letícia': 'le-'}
out = []
for l in open('arvore.tsv', encoding='utf8'):
    tp, i, c, _ = l.rstrip('\n').split('\t')
    if tp != 'arq' or c.split('/')[0] not in M or '/EDITADOS/' in c or 'imagens' in c: continue
    if not (re.search(r'\.(mp4|mov)$', c, re.I) or re.search(r'AD 0?\d|melatonina|Mounjarin', c.split('/')[-1])): continue
    if c.startswith('Maria Clara/CONTA 01/AD 01'): continue          # 08/11 e 09/11: editados em 12/11 (mc-0811/mc-0911)
    if c == 'LARISSA/comprasdalari/REC_7182315F-CE88-4EE0-89E0-66FEFFF0FD14ED4A6A19-E1E6-4A47-817D-24FB1291F973.mp4': continue  # cópia do 12/11 AD 03 já editado
    out.append((c, i))
def nome(c):
    cr = c.split('/')[0]; r = c[len(cr) + 1:]
    if cr == 'Aline':
        ad, d, m = re.search(r'AD 0?(\d).*?(\d\d?)/(\d\d)/', r).groups(); return f'al-{int(d):02d}{m}-ad0{ad}'
    if cr == 'Lorena':
        d, m, n = re.search(r'(\d\d)\.(\d\d) (\d)\.mp4$', r).groups(); return f'lo-{d}{m}-{n}'
    if cr == 'LIVIA':
        d, m, n = re.search(r'amãedoshop/(\d\d)/(\d\d) (\d\d)/', r).groups(); return f'li-{d}{m}-{n}'
    if cr == 'Letícia':
        d, m, n = re.search(r'(\d\d)/(\d\d) ad (\d\d)', r).groups(); return f'le-{d}{m}-ad{n}'
    if cr == 'Maria Clara': return 'mc-1511-ad0' + re.search(r'AD 0?(\d)[^/]*$', r).group(1)
    if cr == 'MARIANA': return 'ma-1511-ad01'
    d, m, n = re.search(r'(\d\d)/(\d\d) AD 0?(\d)', r).groups()
    return f'{M[cr]}{d}{m}-ad0{n}'
L = sorted((nome(c), i, c) for c, i in out)
open('lista.tsv', 'w', encoding='utf8').write(''.join('\t'.join(x) + '\n' for x in L))
for x in L: print(*x, sep='  ')
print(len(L))
