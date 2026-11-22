import sys, re; sys.path.insert(0, '.')
from secoes import secoes
nome = sys.argv[1]
S = secoes(nome)
for n in map(int, sys.argv[2:]):
    s = S[n]; print(f'######## {nome} [{n}] {s["titulo"]}')
    for l in s['soltas']: print('  *', l[:300])
    for c in s['cols']:
        cp = re.sub(r'\s+', ' ', c[0]); ed = re.sub(r'\s+', ' ', ' || '.join(c[1:]))
        gen = 'Grave o vídeo onde for melhor'
        print('  C:', cp[:260]); 
        if ed.strip(): print('     E:', ed.replace('PARA CRIADORES E EDITOR Criadora: Grave o vídeo onde for melhor pra você, pode ser no carro, cozinha, área externa, quarto, etc. Só se atente com o cenário de fundo (não pode ser só uma parede branco, por exemplo)', '[gen]')[:700])
