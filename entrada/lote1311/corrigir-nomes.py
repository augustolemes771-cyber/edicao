# Corrige nomes de produto que o Whisper erra (aparecem na legenda) e junta "Regio Vex" -> "Rejuvex".
# Uso: python entrada/lote1311/corrigir-nomes.py <projeto> ...
import json, re, sys, os
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
TROCA = [(r'\bSolfit\b', 'Soufit'), (r'\bSoulfit\b', 'Soufit'), (r'\bCovita\b', 'Covitta'), (r'\bCoviita\b', 'Covitta'),
         (r'\bQuanto\b(?= Nutrition)', 'Quantum'), (r'\bal[uú]r[oô]nico', 'hialurônico'), (r'\bflancidez', 'flacidez'),
         (r'\bmonoidratada', 'monohidratada'), (r'\bprímola', 'prímula')]
for p in sys.argv[1:]:
    arq = f'src/projetos/{p}/transcricao.json'
    W = json.load(open(arq, encoding='utf-8'))
    n = 0
    # "Quanto Nutrition" vem em duas palavras: olha a seguinte.
    for i, w in enumerate(W):
        t = w['text']
        if re.fullmatch(r'\s*Quanto', t) and i + 1 < len(W) and 'Nutrition' in W[i + 1]['text']:
            w['text'] = t.replace('Quanto', 'Quantum'); n += 1
        for a, b in TROCA:
            nt = re.sub(a, b, w['text'])
            if nt != w['text']: w['text'] = nt; n += 1
        if re.fullmatch(r'\s*menos[.,]?', w['text']) and i and 'composto' in W[i - 1]['text'].lower():
            w['text'] = w['text'].replace('menos', 'meno'); n += 1
    # "Regio Vex" / "Rejo Vex" -> "Rejuvex" numa palavra só.
    out = []
    for w in W:
        if out and re.fullmatch(r'\s*Vex[.,!?]?', w['text']) and re.fullmatch(r'\s*(Regio|Rejo|Reju|Regi)', out[-1]['text']):
            out[-1]['text'] = re.sub(r'(Regio|Rejo|Reju|Regi)', 'Rejuvex', out[-1]['text']) + w['text'].strip()[3:]
            out[-1]['endMs'] = w['endMs']; n += 1; continue
        out.append(w)
    json.dump(out, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, n, 'trocas')
