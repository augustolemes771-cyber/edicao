# Planos (src/projetos/<p>/plano-ad.json) do lote de 20/11 (pasta CONTAS(FELIPE EDITAR)): Aline 11/11, Fernanda 17-18/11,
# Karol 16-19/11 e Lorena 20.11/21.11. Mesmo padrão aprovado dos lotes 12-17/11 (legenda "vermelho", B-roll do produto em tela dividida
# quando a criadora não mostra o produto, seta automática, sem headline, regravações cortadas pelo montar-ads (com a copy do plano), 1,1x no montar-ads).
# Uso: python entrada/lote2011/gerar-planos.py [projeto ...]
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
def ad(p, rot, img, cortar=(), estilo='vermelho', kw=None, **extra):
    cortar = [list(c) for c in cortar]
    prod = [{'de': a, 'ate': b, 'img': img, 'modo': 'topo'} for a, b in auto(p, kw or KW[img], cortar)] if img else []
    P[p] = {'_roteiro': rot, 'split': extra.pop('split', []), 'fotos': extra.pop('fotos', []), 'produto': prod, 'headline': None,
            'legenda': 'meio', 'estiloLegenda': estilo, **({'cortar': cortar} if cortar else {}), **extra}
MOSTRA = ' (ela mostra o produto: sem B-roll)'
fimde = lambda p, frase: [round(ini(p, frase, qual=-1) - 0.05, 2), 9999]
TET = R + 'tetramagnesio-quantum.webp'; KW[TET] = 'tetramagnesio|quantum'
MUDO_NAC = ['retencao', 'redencao', 'pochete']
# ---------------- Aline ("Aline - Roteiro")
A = 'Aline - Roteiro: '
ad('al-1111-ad02', A + 'AD 02 - NAC Nação Verde 11/11; retenção e pochete mudas', NAC, mutar=MUDO_NAC)
# ---------------- Fernanda ("Fernanda - Roteiros", 17/11 e 18/11)
F = 'Fernanda - Roteiros: '
ad('fe-1711-ad01', F + '17/11 AD 01 - Fit Hair' + MOSTRA, None)
ad('fe-1711-ad02', F + '17/11 AD 02 - Fit Hair; criadora recortada no canto na frente do vídeo de fundo ssstik 1794837485678 desde o começo (roda até acabar, música por baixo)', FIT,
   fundo=[{'de': 0.0, 'ate': 29.2, 'video': FH, 'inicio': 0, 'dur': 29.18, 'audio': 'mistura', 'volume': 0.3}])
ad('fe-1711-ad03', F + '17/11 AD 03 - Fit Hair' + MOSTRA, None)
ad('fe-1811-ad01', F + '18/11 AD 01 - Melatonina Neo Química', MEL)
ad('fe-1811-ad02', F + '18/11 AD 02 - Creatina Soufit (foto da loja oficial); abertura apontando/caras e bocas (13 s) enchida com trecho repetido dela até 25,35 s (bruto-sem-enchimento.mov guardado) enquanto roda o vídeo de fundo ssstik 1794857012751 inteiro com o áudio dele', SOU,
   manter=[[0.0, 25.4]], fundo=[{'de': 0.0, 'ate': 25.35, 'dur': 25.24, 'video': REF + 'fundo-creatina-1794857012751.mp4', 'inicio': 0, 'audio': 'troca'}], kw='^mono')  # não fala "Soufit": B-roll em "Ela vem com creatina mono-hidratada"
ad('fe-1811-ad03', F + '18/11 AD 03 - Creatina Soufit (foto da loja oficial)', SOU)
# ---------------- Karol ("Karol - Roteiros", pastas "FEITO" também se editam)
K = 'Karol - Roteiros: '
ad('ka-1611-ad01', K + '16/11 AD 01 - Mounjar Natural', MJN)
ad('ka-1611-ad02', K + '16/11 AD 02 - Mounjarin Psyllium', MNJ)
ad('ka-1611-ad03', K + '16/11 AD 03 - Magnésio 3 em 1 Covitta; headline não aplicada (padrão aprovado)', COV)
ad('ka-1611-ad04', K + '16/11 AD 04 - Creatina (título do roteiro diz Soldiers; a fala diz Sofit/Soufit: foto da Soufit)', SOU)
ad('ka-1711-ad01', K + '17/11 AD 01 - Fit Hair' + MOSTRA, None)
ad('ka-1711-ad02', K + '17/11 AD 02 - Fit Hair' + MOSTRA + '; criadora recortada no canto na frente do vídeo de fundo ssstik 1794837485678 desde o começo (roda até acabar, música por baixo)', None,
   fundo=[{'de': 0.0, 'ate': 29.2, 'video': FH, 'inicio': 0, 'dur': 29.18, 'audio': 'mistura', 'volume': 0.3}])
ad('ka-1711-ad03', K + '17/11 AD 03 - Fit Hair' + MOSTRA, None)
ad('ka-1811-ad01', K + '18/11 AD 01 - Melatonina Neo Química', MEL)
ad('ka-1811-ad02', K + '18/11 AD 02 - Creatina Soufit (foto da loja oficial); abertura apontando/caras e bocas de 34 s encurtada para 25,4 s (tirados os 8,55 s iniciais; bruto-original.mov guardado) enquanto roda o vídeo de fundo ssstik 1794857012751 inteiro com o áudio dele', SOU,
   manter=[[0.0, 25.4]], fundo=[{'de': 0.0, 'ate': 25.35, 'dur': 25.24, 'video': REF + 'fundo-creatina-1794857012751.mp4', 'inicio': 0, 'audio': 'troca'}])
ad('ka-1811-ad03', K + '18/11 AD 03 - Creatina Soufit (foto da loja oficial)', SOU)
ad('ka-1911-ad01', K + '19/11 AD 01 - Melatonina Neo Química', MEL)
ad('ka-1911-ad02', K + '19/11 AD 02 - Melatonina Neo Química', MEL)
ad('ka-1911-ad03', K + '19/11 AD 03 - Melatonina Neo Química', MEL)
# ---------------- Lorena ("Lorena - roteiros", 20.11 e 21.11)
O = 'Lorena - roteiros: '
ad('lo-2011-1', O + '20.11 1 = AD 01 - Mounjarin Psyllium' + MOSTRA, None)
ad('lo-2011-2', O + '20.11 2 = AD 02 - Mounjar Natural' + MOSTRA + '; regravação com "Não, vou fazer de novo, pera aí" cortada', None, [(133.75, 143.08)])
ad('lo-2011-7', O + '20.11 7 = AD 07 - Mounjar Natural', MJN)
ad('lo-2111-1', O + '21.11 1 = AD 01 - Creatina Soldiers', SOLD)
ad('lo-2111-2', O + '21.11 2 = AD 02 - Rejuvex', REJ)
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar', ''), 'fundo' if pl.get('fundo') else '')
