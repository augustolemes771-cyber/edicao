# Planos (src/projetos/<p>/plano-ad.json) do lote de 22/11 (Lívia 20/11 e 21/11) (pasta CONTAS(FELIPE EDITAR)): Aline 11/11, Fernanda 17-18/11,
# Karol 16-19/11 e Lorena 20.11/21.11. Mesmo padrão aprovado dos lotes 12-17/11 (legenda "vermelho", B-roll do produto em tela dividida
# quando a criadora não mostra o produto, seta automática, sem headline, regravações cortadas pelo montar-ads (com a copy do plano), 1,1x no montar-ads).
# Uso: python entrada/lote2411/gerar-planos.py [projeto ...]
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
REVCORTES = json.load(open('entrada/lote2411/rev-cortes.json', encoding='utf-8')) if os.path.exists('entrada/lote2411/rev-cortes.json') else {}
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
# ---------------- Lorena 22.11 5-7 refeitos (pedido do usuário 24/11): gancho em tela dividida como a ref ssstik.io_1795281074632
# (em pé de perfil fazendo a queixa à esquerda, sentada respondendo com o comprimido/pingo no copo à direita), montado por
# entrada/lote2411/gancho.py no bruto.mov (original em bruto-original.mov). manter = gancho inteiro (sem cortar as pausas dele).
LO = 'Lorena - roteiros: '
G = lambda p: json.load(open(f'entrada/lote2411/gancho-{p}.json', encoding='utf8'))
def dur_gancho(p): return round(sum((q[1] - q[0]) + (q[3] - q[2]) for q in G(p)['pares']), 2)
p = 'lo-2211-5b'
ad(p, LO + 'AD 05 - Mounjarin Psyllium' + SEM + '; gancho em tela dividida (4 queixas em pé x 4 "Mounjarin Psyllium" sentada com o comprimido); 2ª tomada do corpo (a 1ª e o "vou fazer essa parte de novo" fora); anáfora da copy (sem detecção de regravação)',
   MNJ, [(dur_gancho(p), 35.75)], manter=[[0, dur_gancho(p)]], semRegravacao=True)
if p in P: P[p]['produto'][0].update(de=round(ini(p, 'tudo isso daqui') - 0.05, 2), ate=round(ini(p, 'tudo isso daqui') + 9, 2))  # 1º B-roll em "nesse suplemento aqui", não no gancho
def b1(p, kw):  # 1º B-roll: frase da 1ª menção ao produto DEPOIS do gancho
    w = [x for x in W(p) if x['startMs'] / 1000 > dur_gancho(p) + 0.5 and re.search(kw, norm(x['text']))][0]
    F = next(f for f in frases(p) if f[0] <= w['startMs'] / 1000 <= f[1] + 0.01)
    a = max(F[0], w['startMs'] / 1000 - 3); return dict(de=round(a - 0.05, 2), ate=round(min(max(F[1], a + 3), w['startMs'] / 1000 + 9) + 0.1, 2))
for p, n, img, kw in (('lo-2211-6b', 'AD 06 - Complexo B Revita', REV, 'revita'), ('lo-2211-7b', 'AD 07 - Composto Meno', MENO, '^meno$')):
    ad(p, LO + n + SEM + '; gancho em tela dividida (4 queixas em pé x 4 respostas sentada com o comprimido/pingo no copo); anáfora da copy (sem detecção de regravação)',
       img, [], manter=[[0, dur_gancho(p)]], semRegravacao=True)
    if p in P: P[p]['produto'][0].update(b1(p, kw))
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar', ''), 'fundo' if pl.get('fundo') else '')
