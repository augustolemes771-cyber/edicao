import sys, re; sys.path.insert(0, '.')
from secoes import secoes
nome = sys.argv[1]
S = secoes(nome)
for n in map(int, sys.argv[2:]):
    s = S[n]; print(f'######## {nome} [{n}] {s["titulo"]}')
    for l in s['soltas']: print('  *', l[:300])
    for c in s['cols']:
        A = c[0].split('\n'); B = (c[1] if len(c) > 1 else '').split('\n')
        for i in range(max(len(A), len(B))):
            a = A[i].strip() if i < len(A) else ''; b = B[i].strip() if i < len(B) else ''
            if a or b: print(f'  {i:2d} C: {a[:200]:<200} || E: {b[:330]}')
