# Mostra só a coluna do editor (2ª coluna da tabela) e o cabeçalho de cada seção pedida.
import sys,re
from secoes import secoes,limpa
for arg in sys.argv[1:]:
    nome,data,ad=arg.split(':'); ad=int(ad)
    for s in secoes(nome):
        if s['data']==data and s['ad']==ad:
            tx=limpa(s['texto'])
            cab=tx.split('|')[0]
            cols=[c for c in tx.split('|') if c.strip() and not re.fullmatch(r'\s*:?-+:?\s*',c)]
            print(f'######## {nome} {data} AD{ad}: {s["titulo"]}')
            print(re.sub(r'\n\s*\n+','\n',cab.strip())[:1500])
            if len(cols)>=2:
                ed=cols[-1] if len(cols)>2 else cols[1]
                print('--- EDITOR/CRIADORA:'); print(re.sub(r'\s{3,}','  ',ed.strip())[:4000])
            print()
