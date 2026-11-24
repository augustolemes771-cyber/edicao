# Planos (src/projetos/<p>/plano-ad.json) do lote de 22/11 (Lívia 20/11 e 21/11) (pasta CONTAS(FELIPE EDITAR)): Aline 11/11, Fernanda 17-18/11,
# Karol 16-19/11 e Lorena 20.11/21.11. Mesmo padrão aprovado dos lotes 12-17/11 (legenda "vermelho", B-roll do produto em tela dividida
# quando a criadora não mostra o produto, seta automática, sem headline, regravações cortadas pelo montar-ads (com a copy do plano), 1,1x no montar-ads).
# Uso: python entrada/lote2311/gerar-planos.py [projeto ...]
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
REVCORTES = json.load(open('entrada/lote2311/rev-cortes.json', encoding='utf-8')) if os.path.exists('entrada/lote2311/rev-cortes.json') else {}
SO = [a for a in sys.argv[1:] if not a.startswith('--')]
def ad(p, rot, img, cortar=(), estilo='vermelho', kw=None, **extra):
    if SO and p not in SO: return
    cortar = [list(c) for c in cortar] + REVCORTES.get(p, [])  # tomadas erradas achadas na revisão dos finais (rev-cortar.py, 23/11)
    prod = [{'de': a, 'ate': b, 'img': img, 'modo': 'topo'} for a, b in auto(p, kw or KW[img], cortar)] if img else []
    P[p] = {'_roteiro': rot, 'split': extra.pop('split', []), 'fotos': extra.pop('fotos', []), 'produto': prod, 'headline': None,
            'legenda': 'meio', 'estiloLegenda': estilo, **({'cortar': cortar} if cortar else {}), **extra}
MOSTRA = ' (ela mostra o produto: sem B-roll)'
fimde = lambda p, frase: [round(ini(p, frase, qual=-1) - 0.05, 2), 9999]
TET = R + 'tetramagnesio-quantum.webp'; KW[TET] = 'tetramagnesio|quantum'
MUDO_NAC = ['retencao', 'redencao', 'pochete']
L2 = '.painel/lote2211/ref/'
RON = L2 + 'ronco.wav'  # ronco da ref ssstik.io_1795116183284 (1,55-4,15 s), voz do rapaz tirada com demucs
NACA = R + 'nac-alwaysfit.jpg'; KW[NACA] = '^nac$|always'
ALV = R + 'alivo-life.png'; KW[ALV] = 'alivo|life'
FUNDO_SOU = '.painel/lote1711/ref/fundo-creatina-1794857012751.mp4'
SEM = ' (ela não mostra o produto: B-roll em tela dividida)'
# ---------------- Larissa ("3 - Shopdalari")
LA = '3 - Shopdalari: '
ad('la-1811-ad01r', LA + '18/11 AD 01 - Melatonina Neo Química (regravado, outra roupa)' + SEM, MEL)
ad('la-1811-ad02r', LA + 'pasta "18/11 (repetidos, outra roupa)/18/11 AD 02 Creatina", mas a fala é o 19/11 AD 02 - Melatonina Neo Química (vale a fala)' + SEM, MEL)
ad('la-1911-ad01', LA + '19/11 AD 01 - Melatonina Neo Química' + SEM, MEL)
ad('la-1911-ad02', LA + '19/11 AD 02 - Melatonina Neo Química' + SEM, MEL)
ad('la-1911-ad03', LA + '19/11 AD 03 - Melatonina Neo Química' + SEM + '; 1ª tomada do CTA (regravada) cortada à mão; Whisper inventou 3ª tomada no fim (tirada)', MEL, [(74.75, 79.5)])
ad('la-2011-ad01', LA + '20/11 AD 01 - Mounjarin Psyllium' + SEM, MNJ)
ad('la-2011-ad02', LA + '20/11 AD 02 - Mounjar Natural' + MOSTRA, None)
ad('la-2011-ad03', LA + '20/11 AD 03 - Composto Meno' + MOSTRA + '; anáfora "não é leque, não é ventilador" da copy (sem detecção de regravação)', None, semRegravacao=True)
ad('la-2011-ad04', LA + '20/11 AD 04 - Fit Hair' + MOSTRA + '; vinheta do CapCut do fim cortada', None, [(163.7, 9999)])
ad('la-2111-ad01', LA + '21/11 AD 01 - Creatina Soldiers' + SEM, SOLD)
ad('la-2111-ad02', LA + '21/11 AD 02 - Rejuvex' + MOSTRA, None)
ad('la-2111-ad03', LA + '21/11 AD 03 - Mounjarin Psyllium' + SEM + '; som do ronco da ref na pausa depois de "ronca assim?"', MNJ,
   manter=[[3.1, 7.35]], sons=[{'de': 3.5, 'arquivo': RON, 'dur': 2.6, 'volume': 1.0}])
# ---------------- Lorena ("Lorena - roteiros", pasta 22.11; "22.11 1 (1).mp4" é cópia idêntica do "22.11 1.mp4")
LO = 'Lorena - roteiros: '
ad('lo-2211-1', LO + 'AD 01 - Rejuvex' + SEM, REJ)
ad('lo-2211-2', LO + 'AD 02 - Rejuvex' + SEM, REJ)
ad('lo-2211-3', LO + 'AD 03 - Rejuvex' + SEM, REJ)
ad('lo-2211-4', LO + 'AD 04 - Alivo Life' + SEM + ' (foto do link de produto do roteiro)', ALV)
ad('lo-2211-5', LO + 'AD 05 - Mounjarin Psyllium' + SEM + '; ela gravou as 4 queixas seguidas e depois os 4 "Mounjarin Psyllium" com o comprimido no copo: bruto reordenado intercalando queixa e produto como na copy (bruto-ordem-original.mov guardado); anáfora da copy (sem detecção de regravação)', MNJ, manter=[[3.6, 6.2], [10.2, 13.3], [16.9, 19.4], [23.8, 26.9]], semRegravacao=True)
if 'lo-2211-5' in P: P['lo-2211-5']['produto'][0].update(de=72.0, ate=81.0)  # 1º B-roll em "nesse suplemento aqui", não no 1º "Mounjarin Psyllium" com o copo
if 'lo-2211-1' in P: P['lo-2211-1']['produto'].insert(0, dict(P['lo-2211-1']['produto'][0], de=55.5, ate=66.3))  # "é essa cápsula aqui, ó. Ela tem cinco ativos" (o nome só vem no fim)
ad('lo-2211-6', LO + 'AD 06 - Complexo B Revita' + SEM + '; ela gravou as 4 queixas seguidas e depois os 4 "Vitamina B12/B3/B7/B6" com o comprimido no copo: bruto reordenado intercalando como na copy (bruto-ordem-original.mov guardado); 1ª tomada de "Minha imunidade tá lá embaixo" (regravada) fora; anáfora da copy (sem detecção de regravação)', REV, [(9.2, 11.05), (103.45, 105.45), (109.95, 110.88)], manter=[[5.2, 9.0], [15.4, 19.0], [25.0, 28.6], [32.9, 36.7]], semRegravacao=True)
# ---------------- Chegaram durante o lote (varredura das 12h30): Larissa 21/11 AD 04-07, Maria Clara 20/11 AD 01-05
TOPO7 = L2 + 'topo-creatina-1795126299776.mp4'
SFB = R + 'super-fibras.png'; KW[SFB] = '^fibras$'
BARRIGA = '.painel/lote2311/ref/superfibras-barriga.png'  # foto do começo da ref ssstik.io_1795122872185 (0-4 s), sem o texto dela
ad('la-2111-ad04', LA + '21/11 AD 04 - Mounjar Natural' + MOSTRA + '; som do ronco da ref na pausa depois de "ronca assim?" (Whisper espalhou "E suas camisetas marcam?" na pausa: retemporizado pela voz)', None,
   manter=[[2.7, 5.65]], sons=[{'de': 2.95, 'arquivo': RON, 'dur': 2.6, 'volume': 1.0}])
ad('la-2111-ad05', LA + '21/11 AD 05 - Complexo B Revita' + SEM, REV)
ad('la-2111-ad06', LA + '21/11 AD 06 - Super Fibras Soufit' + SEM + '; foto do começo da ref no topo na 1ª frase (roteiro)', SFB)
if 'la-2111-ad06' in P: P['la-2111-ad06']['fotos'] = [{'de': 0, 'ate': round(ini('la-2111-ad06', 'Se você tem esse volume') - 0.05, 2), 'img': BARRIGA, 'modo': 'topo'}]
ad('la-2111-ad07', LA + '21/11 AD 07 - Creatina Soldiers: tela dividida com o vídeo da ref ssstik.io_1795126299776 em cima, sem o áudio dele (roteiro); sem B-roll (roteiro não pede)', None,
   split=[{'de': 0, 'ate': 9999, 'video': TOPO7, 'inicio': 0, 'loop': True}])
MC = 'Maria Clara - Roteiros: '
ad('mc-2011-ad01', MC + '20/11 AD 01 - Mounjarin Psyllium' + SEM, MNJ)
ad('mc-2011-ad02', MC + '20/11 AD 02 - Mounjar Natural' + SEM, MJN)
ad('mc-2011-ad03', MC + '20/11 AD 03 - Composto Meno' + SEM, MENO)
ad('mc-2011-ad04', MC + '20/11 AD 04 - Fit Hair' + SEM, FIT)
ad('mc-2011-ad05', MC + '20/11 AD 05 - NAC Always Fit' + SEM + ' (foto do NAC recortada do pote da Vanessa)', NACA)
LE = 'Roteiros - Letícia: '
ad('le-1711-ad01', LE + '17/11 AD 01 - Mounjarin Psyllium (Etron)' + SEM, MNJ)
ad('le-1711-ad02', LE + '17/11 AD 02 - Mounjar Natural' + SEM + '; tomada errada "não é o leite e na verdade nem só..." cortada à mão (retomada retemporizada pela voz)', MJN, [(4.33, 9.75)])
ad('le-1811-ad01', LE + '18/11 AD 01 - Mounjar Natural' + SEM, MJN)
ad('le-1811-ad02', LE + '18/11 AD 02 - Mounjarin Psyllium' + SEM, MNJ)
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar', ''), 'fundo' if pl.get('fundo') else '')
