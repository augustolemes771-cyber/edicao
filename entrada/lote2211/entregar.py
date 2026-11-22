# Entrega do lote (regra de 19/11): augusto/<lote>/<Criadora>/<Criadora> <nome original>/ com o final + o ORIGINAL da criadora;
# a pasta de origem (vazia) vai para <Criadora>/EDITADOS. Tudo pelo atalho de CONTAS(FELIPE EDITAR) no Drive do PC.
# Uso (na raiz do projeto): python entrada/lote2211/entregar.py [--seco]
import os, shutil, sys
RAIZ = 'G:/.shortcut-targets-by-id/1wd5aD4PLLcLaBC4yBvvauHS2cM1YVbW0/CONTAS(FELIPE EDITAR)'
L = 'entrada/lote2211'
lote = open(f'{L}/pasta-drive.txt', encoding='utf8').read().strip()
seco = '--seco' in sys.argv
CRI = {'li': ('Lívia', 'LIVIA')}
for linha in open(f'{L}/lista.tsv', encoding='utf8'):
    p, fid, cam = linha.rstrip('\r\n').split('\t')
    nome_cri, pasta_cri = CRI[p.split('-')[0]]
    partes = cam.split('/')
    # No PC "/" e ":" dos nomes do Drive viram espaço: "20/11 AD 01" -> "20 11 AD 01", "20:11 01.MP4" -> "20 11 01.MP4".
    dir_orig = os.path.join(RAIZ, partes[0], partes[1], ' '.join(partes[2:4]))
    arq_orig = os.path.join(dir_orig, partes[4].replace(':', ' '))
    n = os.path.splitext(partes[4])[0].replace(':', '-')
    final = f'out/{p}-final.mp4'
    dest = os.path.join(RAIZ, 'augusto', lote, nome_cri, f'{nome_cri} {n}')
    print(p, '->', dest)
    if not os.path.exists(final): print('   FALTA o final'); continue
    if not os.path.exists(arq_orig): print('   FALTA o original', arq_orig); continue
    if seco: continue
    os.makedirs(dest, exist_ok=True)
    shutil.copy2(final, os.path.join(dest, f'{nome_cri} {n}.mp4'))
    shutil.move(arq_orig, os.path.join(dest, os.path.basename(arq_orig)))
    ed = os.path.join(RAIZ, pasta_cri, 'EDITADOS'); os.makedirs(ed, exist_ok=True)
    alvo = os.path.join(ed, os.path.basename(dir_orig))
    if os.path.exists(alvo): alvo += ' (2)'
    shutil.move(dir_orig, alvo)
    print('   ok')
