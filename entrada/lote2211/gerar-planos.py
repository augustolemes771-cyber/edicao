# Planos (src/projetos/<p>/plano-ad.json) do lote de 22/11 (Lívia 20/11 e 21/11) (pasta CONTAS(FELIPE EDITAR)): Aline 11/11, Fernanda 17-18/11,
# Karol 16-19/11 e Lorena 20.11/21.11. Mesmo padrão aprovado dos lotes 12-17/11 (legenda "vermelho", B-roll do produto em tela dividida
# quando a criadora não mostra o produto, seta automática, sem headline, regravações cortadas pelo montar-ads (com a copy do plano), 1,1x no montar-ads).
# Uso: python entrada/lote2211/gerar-planos.py [projeto ...]
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
# ---------------- Lívia ("3 - Livia": 20/11 AD 01-05 e 21/11 AD 01-07; pastas "20/11 AD 0N" / "21/11 0N")
NACA = R + 'nac-alwaysfit.jpg'; KW[NACA] = '^nac$|always'
SFB = R + 'super-fibras.png'; KW[SFB] = 'fibra|super'
L2 = '.painel/lote2211/ref/'
E = '3 - Livia: '
RON = L2 + 'ronco.wav'  # ronco da ref ssstik.io_1795116183284 (1,55-4,15 s), voz do rapaz tirada com demucs
TOPO7 = L2 + 'topo-creatina-1795126299776.mp4'
ad('li-2011-01', E + '20/11 AD 01 - Mounjarin Psyllium (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado); regravação "e olhar só para o vaso" cortada à mão', MNJ, [(56.93, 58.95)])
ad('li-2011-02', E + '20/11 AD 02 - Mounjar Natural (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado)', MJN)
ad('li-2011-03', E + '20/11 AD 03 - Composto Meno' + MOSTRA + '; anáfora "não é o leque, não é o ventilador" da copy (sem detecção de regravação)', None, semRegravacao=True)
ad('li-2011-04', E + '20/11 AD 04 - Fit Hair (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado)', FIT)
ad('li-2011-05', E + '20/11 AD 05 - NAC Always Fit' + MOSTRA, None)
ad('li-2111-01', E + '21/11 AD 01 - Creatina Soldiers (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado)', SOLD)
ad('li-2111-02', E + '21/11 AD 02 - Rejuvex' + MOSTRA, None)
ad('li-2111-03', E + '21/11 AD 03 - Mounjarin Psyllium (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado); som do ronco da ref na pausa depois de "ronca assim?"', MNJ,
   manter=[[1.5, 5.0]], sons=[{'de': 1.75, 'arquivo': RON, 'dur': 2.6, 'volume': 1.0}])
ad('li-2111-04', E + '21/11 AD 04 - Mounjar Natural (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado); som do ronco da ref na pausa depois de "ronca assim?"', MJN,
   manter=[[1.7, 4.4]], sons=[{'de': 1.95, 'arquivo': RON, 'dur': 2.4, 'volume': 1.0}])
ad('li-2111-05', E + '21/11 05 = AD 05 - Complexo B Revita (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado)', REV)
ad('li-2111-06', E + '21/11 06 = AD 05 - Complexo B Revita (2ª gravação, outro cenário; o AD 06 Super Fibras não veio) (ela não mostra o produto: B-roll em tela dividida); headline não aplicada (padrão aprovado)', REV)
ad('li-2111-07', E + '21/11 AD 07 - Creatina Soldiers: tela dividida com o vídeo da ref ssstik.io_1795126299776 em cima, sem o áudio dele (roteiro); sem B-roll (roteiro não pede)', None,
   split=[{'de': 0, 'ate': 9999, 'video': TOPO7, 'inicio': 0, 'loop': True}])
# ---------------- Vanessa ("Vanessa - Roteiros"; pasta "18/11 AD 02", subiu durante o lote)
ad('v1811-ad02', 'Vanessa - Roteiros: 18/11 AD 02 - Creatina Soufit (foto da loja oficial; ela não mostra o produto); abertura de caras e bocas (21,7 s) enchida com 3,7 s dela apontando (1,0-4,7 colado em 21,6; bruto-sem-enchimento.mov guardado) enquanto roda o vídeo de fundo ssstik 1794857012751 inteiro com o áudio dele', SOU,
   fundo=[{'de': 0.0, 'ate': 25.35, 'dur': 25.24, 'video': '.painel/lote1711/ref/fundo-creatina-1794857012751.mp4', 'inicio': 0, 'audio': 'troca'}], manter=[[0.0, 25.45]])
ad('v1811-ad03', 'Vanessa - Roteiros: 18/11 AD 03 - Creatina Soufit (foto da loja oficial; ela não mostra o produto)', SOU)
ad('v1911-ad01', 'Vanessa - Roteiros: 19/11 AD 01 - Melatonina Neo Química (ela não mostra o produto: B-roll em tela dividida)', MEL)
ad('v1911-ad02', 'Vanessa - Roteiros: 19/11 AD 02 - Melatonina Neo Química (ela não mostra o produto: B-roll em tela dividida)', MEL)
ad('v1911-ad03', 'Vanessa - Roteiros: 19/11 AD 03 - Melatonina Neo Química (ela não mostra o produto: B-roll em tela dividida)', MEL)
ad('v2011-ad01', 'Vanessa - Roteiros: 20/11 AD 01 - Mounjarin Psyllium' + MOSTRA, None)
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar', ''), 'fundo' if pl.get('fundo') else '')
