# Instruções (soltas + coluna do editor/criadora) de uma seção do roteiro: python inst.py <criadora> <n> [...]
import sys, re; sys.path.insert(0, '.'); from secoes import secoes
GEN = ('PARA CRIADORES', 'Grave o vídeo onde', 'Só se atente', 'formato das legendas', 'Se tiver o produto', 'Se a criadora não tiver', 'Seta apontando', 'Coloca um B-rol')
a = sys.argv[1:]
for nome, n in zip(a[::2], a[1::2]):
    s = secoes(nome)[int(n)]
    print(f"######## {nome} [{n}] {s['titulo']} ({s['data']})")
    for l in s['soltas']: print('   *', l[:250])
    for c in s['cols']:
        if len(c) < 2: continue
        e = re.sub(r'\s+', ' ', ' || '.join(x for x in c[1:] if x)).strip()
        if e and not any(g.lower() in e.lower() for g in GEN): print('   E:', e[:300], '\n      ~C:', re.sub(r'\s+', ' ', c[0])[:120])
