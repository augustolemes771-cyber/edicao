# Imprime a fala de um projeto em linhas com o tempo de início (quebra em pontuação ou pausa > 0,6 s).
import json,sys
for p in sys.argv[1:]:
    W=[w for w in json.load(open(f'../../src/projetos/{p}/transcricao.json',encoding='utf-8')) if w['text'].strip()]
    print(f'==== {p} ({W[-1]["endMs"]/1000:.1f}s, {len(W)} palavras)')
    linha=[];t0=None;ant=None
    for w in W:
        a=w['startMs']/1000
        if linha and (a-ant>0.6 or len(linha)>=14):
            print(f'{t0:6.1f} '+' '.join(linha)); linha=[]
        if not linha: t0=a
        linha.append(w['text'].strip()); ant=w['endMs']/1000
        if w['text'].strip()[-1:] in '.?!':
            print(f'{t0:6.1f} '+' '.join(linha)); linha=[]
    if linha: print(f'{t0:6.1f} '+' '.join(linha))
