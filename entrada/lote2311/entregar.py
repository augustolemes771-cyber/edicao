# Entrega do lote 23/11 (regra de 19/11): augusto/<lote>/<Criadora>/<nome do final>/ com o final + o ORIGINAL da criadora;
# NÃO cria nem usa <Criadora>/EDITADOS (regra de 24/11): a pasta de origem fica onde está. Tudo pelo atalho de CONTAS(FELIPE EDITAR) no Drive do PC.
# Uso (na raiz do projeto): python entrada/lote2311/entregar.py [--seco] [projeto ...]
import os, shutil, sys
RAIZ = 'G:/.shortcut-targets-by-id/1wd5aD4PLLcLaBC4yBvvauHS2cM1YVbW0/CONTAS(FELIPE EDITAR)'
L = 'entrada/lote2311'
lote = open(f'{L}/pasta-drive.txt', encoding='utf8').read().strip()
seco = '--seco' in sys.argv
so = [a for a in sys.argv[1:] if not a.startswith('--')]
LA = RAIZ + '/LARISSA/comprasdalari'
LO = RAIZ + '/Lorena/22.11'
# projeto: (criadora, nome do final, [originais a mover junto], reservado)
E = {
 'la-1811-ad01r': ('Larissa', 'Larissa 18-11 AD 01 Melatonina (repetido)', [LA + '/18 11 (repetidos, outra roupa)/18 11 AD 01 Melatonina'], None),
 'la-1911-ad01': ('Larissa', 'Larissa 19-11 AD 01 Melatonina', [LA + '/19 11/19 11 AD 01 Melatonina'], None),
 # "18/11 AD 02 Creatina" da pasta de repetidos é cópia idêntica (cmp) do 19/11 AD 02 Melatonina: vai junto.
 'la-1911-ad02': ('Larissa', 'Larissa 19-11 AD 02 Melatonina', [LA + '/19 11/19 11 AD 02 Melatonina', LA + '/18 11 (repetidos, outra roupa)/18 11 AD 02 Creatina'], None),
 'la-1911-ad03': ('Larissa', 'Larissa 19-11 AD 03 Melatonina', [LA + '/19 11/19 11 AD 03 Melatonina'], None),
 'la-2011-ad01': ('Larissa', 'Larissa 20-11 AD 01 Mounjarin Psyllium', [LA + '/20 11/20 11 AD 01 Mounjarim Psylium'], None),
 'la-2011-ad02': ('Larissa', 'Larissa 20-11 AD 02 Mounjar Natural', [LA + '/20 11/20 11 AD 02 Mounjarim Psyllium'], None),
 'la-2011-ad03': ('Larissa', 'Larissa 20-11 AD 03 Composto Meno', [LA + '/20 11/20 11 AD 03 Composto Meno'], None),
 'la-2011-ad04': ('Larissa', 'Larissa 20-11 AD 04 Fit Hair', [LA + '/20 11/20 11 AD 04 Fit Hair'], None),
 'la-2111-ad01': ('Larissa', 'Larissa 21-11 AD 01 Creatina', [LA + '/21 11/21 11 AD 01 Creatina.mov'], None),
 'la-2111-ad02': ('Larissa', 'Larissa 21-11 AD 02 Rejuvex', [LA + '/21 11/21 11 AD 02 Rejuvex.mov'], None),
 'la-2111-ad03': ('Larissa', 'Larissa 21-11 AD 03 Mounjarin', [LA + '/21 11/21 11 AD 03  - Mounjarin.mov'], None),
 # "22.11 1 (1).mp4" é cópia idêntica (mesmo tamanho e hora) do "22.11 1.mp4": vai junto.
 'lo-2211-1': ('Lorena', 'Lorena 22.11 1', [LO + '/22.11 1.mp4', LO + '/22.11 1 (1).mp4'], None),
 'lo-2211-2': ('Lorena', 'Lorena 22.11 2', [LO + '/22.11 2.mp4'], None),
 'lo-2211-3': ('Lorena', 'Lorena 22.11 3', [LO + '/22.11 3.mp4'], None),
 'lo-2211-4': ('Lorena', 'Lorena 22.11 4', [LO + '/22.11 4.mp4'], None),
 'lo-2211-5': ('Lorena', 'Lorena 22.11 5', [LO + '/22.11 5.mp4'], None),
 'lo-2211-6': ('Lorena', 'Lorena 22.11 6', [LO + '/22.11 6.mp4'], None),
}
# Chegaram durante o lote (varredura das 12h30).
MC = RAIZ + '/Maria Clara/CONTA 01/20 11'
LE = RAIZ + '/Letícia'
for n, prod in [(4, 'Mounjar Natural'), (5, 'Complexo B Revita'), (6, 'Super Fibras'), (7, 'Creatina')]:
    E[f'la-2111-ad0{n}'] = ('Larissa', f'Larissa 21-11 AD 0{n} {prod}', [LA + f'/21 11/21 11 AD 0{n}'], None)
for n, arq in [(1, 'AD 01'), (2, 'AD 02 (1)'), (3, 'AD 3'), (4, 'AD 4'), (5, 'AD 5')]:
    E[f'mc-2011-ad0{n}'] = ('Maria Clara', f'Maria Clara 20-11 {arq.replace(" (1)", "")}', [MC + '/' + arq], None)
for p, arq in [('le-1711-ad01', '17 11 ad 01 video-20261123-0942.mp4'), ('le-1711-ad02', '17 11 ad 02 video-20261123-1002.mp4'),
               ('le-1811-ad01', '18 11 ad 01 video-20261123-1012.mp4'), ('le-1811-ad02', '18 11 ad 02 video-20261123-1019.mp4')]:
    E[p] = ('Letícia', 'Letícia ' + arq[:11].replace(' 11', '-11', 1).replace('17 ', '17').replace('18 ', '18'), [LE + '/' + arq], None)
for p, (cri, nome, origs, _) in E.items():
    if so and p not in so: continue
    final = f'out/{p}-final.mp4'
    dest = os.path.join(RAIZ, 'augusto', lote, cri, nome)
    print(p, '->', dest)
    if not os.path.exists(final): print('   FALTA o final'); continue
    falta = [o for o in origs if not os.path.exists(o)]
    if falta: print('   FALTA o original', falta); continue
    if seco: continue
    os.makedirs(dest, exist_ok=True)
    shutil.copy2(final, os.path.join(dest, nome + '.mp4'))
    for o in origs: shutil.move(o, os.path.join(dest, os.path.basename(o)))
    print('   ok')
