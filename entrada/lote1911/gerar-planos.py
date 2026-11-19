# Planos (src/projetos/<p>/plano-ad.json) do lote de 19/11 (pasta CONTAS(FELIPE EDITAR)): Fernanda 16/11, Lorena 19.11/20.11 e
# Maria Clara 17/11, 18/11 e 19/11. Mesmo padrão aprovado dos lotes 12-17/11 (legenda "vermelho", B-roll do produto em tela dividida
# quando a criadora não mostra o produto, seta automática, sem headline, regravações cortadas à mão, 1,1x no montar-ads).
# Uso: python entrada/lote1911/gerar-planos.py [projeto ...]
import json, re, unicodedata, os, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)
TR = {}
def W(p):
    if p not in TR: TR[p] = [w for w in json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf-8')) if norm(w['text'])]
    return TR[p]
def ach(p, frase, qual=0, depois=0):
    w = W(p); k = [norm(x) for x in frase.split()]; ws = [norm(x['text']) for x in w]
    oc = [i for i in range(len(w) - len(k) + 1) if ws[i:i + len(k)] == k and w[i]['startMs'] / 1000 >= depois]
    if not oc: raise SystemExit(f'{p}: não achei "{frase}"')
    i = oc[qual]
    return w[i]['startMs'] / 1000, w[i + len(k) - 1]['endMs'] / 1000
ini = lambda p, f, **o: ach(p, f, **o)[0]
def frases(p):
    """Frases (início, fim, índices) pela pontuação ou pausa > 0,6 s."""
    w = W(p); out = []; cur = []
    for i, x in enumerate(w):
        if cur and x['startMs'] - w[i - 1]['endMs'] > 600: out.append(cur); cur = []
        cur.append(i)
        if re.search(r'[.?!]$', x['text'].strip()): out.append(cur); cur = []
    if cur: out.append(cur)
    return [(w[f[0]]['startMs'] / 1000, w[f[-1]]['endMs'] / 1000, f) for f in out]
def dentro(t, cortes): return any(a <= t <= b for a, b in cortes)
def auto(p, kw, cortes):
    """B-roll 1: frase da primeira menção ao produto (+ a seguinte, até 12 s). B-roll 2: do CTA (link/carrinho/clica) ao fim."""
    w = W(p); F = [f for f in frases(p) if not dentro((f[0] + f[1]) / 2, cortes)]
    fim_fala = max(f[1] for f in F)
    pi = next((k for k, f in enumerate(F) if any(re.search(kw, norm(w[i]['text'])) for i in f[2])), None)
    if pi is None: raise SystemExit(f'{p}: sem menção ao produto ({kw})')
    wi = next(i for i in F[pi][2] if re.search(kw, norm(w[i]['text'])))
    tw = w[wi]['startMs'] / 1000
    a = max(F[pi][0], tw - 3); b = F[pi][1]
    if b - a < 3 and pi + 1 < len(F): b = F[pi + 1][1]
    b = min(b, tw + 9)
    CT = r'^(link|carrinho|clica|clique|clicar|apertar|aperta|apertando|aperte)$'
    ult_ct = max(x['startMs'] / 1000 for x in w if re.search(CT, norm(x['text'])) and not dentro(x['startMs'] / 1000, cortes))
    ci = next(i for i, x in enumerate(w) if x['startMs'] / 1000 > max(fim_fala * 0.55, ult_ct - 20) and re.search(CT, norm(x['text'])) and not dentro(x['startMs'] / 1000, cortes))
    fr = next(f for f in frases(p) if ci in f[2])
    c0 = max(fr[0], w[ci]['startMs'] / 1000 - 4)  # frase sem pontuação do Whisper: no máximo 4 s antes da palavra do CTA
    for ca, cb in cortes:  # a frase do CTA começa dentro de um corte: começa depois dele
        if ca <= c0 <= cb: c0 = cb + 0.05
    cta = (c0,)
    out = [(round(a - 0.05, 2), round(b + 0.1, 2))]
    if cta[0] > b + 1: out.append((round(cta[0] - 0.05, 2), round(fim_fala + 0.3, 2)))
    else: out = [(round(a - 0.05, 2), round(fim_fala + 0.3, 2))]
    return out
R = '.painel/mcf/ref/'
REJ, ALW, SOU, MENO, REV = R + 'rejuvex-ultra-drive.jpg', R + 'complexo-b-alwaysfit.jpg', R + 'creatina-soufit.png', R + 'composto-meno.jpg', R + 'revita-complexo-b.webp'
MEL, MNJ, MJN, NAC, COV = R + 'melatonina.webp', R + 'mounjarin-psyllium.webp', R + 'mounjar-natural.png', R + 'nac-nacaoverde.png', R + 'covitta-magnesio.jpg'
COL, SOLD, FIT = R + 'colageno-bodyaction.png', R + 'creatina-soldiers.jpg', R + 'fit-hair.jpg'
KW = {REJ: 'rejuvex', ALW: 'always', SOU: 'soufit', MENO: '^meno$', REV: 'revita', MEL: '^neo|^melatonina$', MNJ: 'mounjarin|etron',
      MJN: '^mounjar', NAC: '^nac$|nacao', COV: 'covitta', COL: 'body|action', SOLD: 'soldiers', FIT: 'hair'}
REF = '.painel/lote1711/ref/'
FH = REF + 'fundo-fithair-1794837485678.mp4'
P = {}
def ad(p, rot, img, cortar=(), estilo='vermelho', **extra):
    cortar = [list(c) for c in cortar]
    prod = [{'de': a, 'ate': b, 'img': img, 'modo': 'topo'} for a, b in auto(p, KW[img], cortar)] if img else []
    P[p] = {'_roteiro': rot, 'split': extra.pop('split', []), 'fotos': extra.pop('fotos', []), 'produto': prod, 'headline': None,
            'legenda': 'meio', 'estiloLegenda': estilo, 'semRegravacao': True, **({'cortar': cortar} if cortar else {}), **extra}
MOSTRA = ' (ela mostra o produto: sem B-roll)'
fimde = lambda p, frase: [round(ini(p, frase, qual=-1) - 0.05, 2), 9999]
# ---------------- Fernanda ("Fernanda - Roteiros", 16/11)
F = 'Fernanda - Roteiros: '
ad('fe-1611-ad01', F + '16/11 AD 01 - Mounjar Natural', MJN)
ad('fe-1611-ad02', F + '16/11 AD 02 - Mounjarin Psyllium', MNJ)
ad('fe-1611-ad03', F + '16/11 AD 03 - Magnésio 3 em 1 Covitta; headline não aplicada (padrão aprovado)', COV)
ad('fe-1611-ad04', F + '16/11 AD 04 - Creatina (título do roteiro diz Soldiers; a fala diz Soufit: foto da Soufit)', SOU)
# ---------------- Lorena ("Lorena - roteiros")
O = 'Lorena - roteiros: '
ad('lo-1911-1', O + '19.11 1 = AD 01 - Melatonina Neo Química; 1 regravação cortada (o REC_ da pasta é cópia idêntica deste arquivo)', MEL, [(58.19, 61.13)])
ad('lo-1911-3', O + '19.11 3 = AD 03 - Melatonina Neo Química', MEL)
ad('lo-2011-3', O + '20.11 3 = AD 03 - Composto Meno; 1 regravação cortada', MENO, [(135.73, 142.89)])
ad('lo-2011-4', O + '20.11 4 = AD 04 - Fit Hair' + MOSTRA, None)
ad('lo-2011-5', O + '20.11 5 = AD 05 - NAC Always Fit' + MOSTRA, None)
ad('lo-2011-6', O + '20.11 6 = AD 06 - Mounjarin Psyllium; abertura regravada e "E olha só" repetido cortados', MNJ, [(0, 10.85), (86.71, 87.61)])
# ---------------- Maria Clara ("Maria Clara - Roteiros")
M = 'Maria Clara - Roteiros: '
ad('mc-1711-ad01', M + '17/11 AD 01 - Fit Hair; headline não aplicada (padrão aprovado)', FIT)
ad('mc-1711-ad02', M + '17/11 AD 02 - Fit Hair; criadora recortada no canto na frente do vídeo de fundo ssstik 1794837485678 de "Porque muita mulher" (roda até acabar, música por baixo)', FIT,
   fundo=[{'de': round(ini('mc-1711-ad02', 'porque muita mulher') - 0.05, 2), 'ate': round(ini('mc-1711-ad02', 'depende exatamente do que falta') + 2.2, 2), 'video': FH, 'inicio': 0, 'dur': 29.18, 'audio': 'mistura', 'volume': 0.3}])
ad('mc-1711-ad03', M + '17/11 AD 03 - Fit Hair', FIT)
ad('mc-1811-ad01', M + '18/11 AD 01 - Melatonina Neo Química', MEL)
ad('mc-1811-ad02', M + '18/11 AD 02 - Creatina Soufit (foto da loja oficial); ela não gravou a abertura apontando: 25,35 s com a imagem dela congelada no canto enquanto roda o vídeo de fundo ssstik 1794857012751 inteiro com o áudio dele (bruto-sem-abertura.mov guardado)', SOU,
   manter=[[0.0, 25.4]], fundo=[{'de': 0.0, 'ate': 25.35, 'dur': 25.24, 'video': REF + 'fundo-creatina-1794857012751.mp4', 'inicio': 0, 'audio': 'troca'}])
ad('mc-1811-ad03', M + '18/11 AD 03 - Creatina Soufit (foto da loja oficial)', SOU)
ad('mc-1911-ad01', M + '19/11 AD 01 - Melatonina Neo Química', MEL)
ad('mc-1911-ad02', M + '19/11 AD 02 - Melatonina Neo Química', MEL)
ad('mc-1911-ad03', M + '19/11 AD 03 - Melatonina Neo Química', MEL)
# ---------------- Aline ("Aline - Roteiro", 11/11; chegaram durante o lote de 19/11)
TET = R + 'tetramagnesio-quantum.webp'; KW[TET] = 'tetramagnesio|quantum'
A = 'Aline - Roteiro: '
ad('al-1111-ad01', A + 'AD 01 - Tetra Magnésio Quantum 11/11; 5 regravações cortadas (fica a última tomada)', TET,
   [(12.07, 14.6), (26.95, 29.92), (44.91, 46.85), (48.61, 62.0), (106.31, 112.2)])
ad('al-1111-ad03', A + 'AD 03 - Rejuvex 11/11 ("sem headline e praticamente sem edição"); 6 regravações cortadas (fica a última tomada)', REJ,
   [(6.65, 20.4), (38.05, 48.4), (71.19, 81.8), (100.41, 115.2), (136.09, 141.85), (147.95, 166.9)])
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar', ''), 'fundo' if pl.get('fundo') else '')
