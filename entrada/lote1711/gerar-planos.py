# Planos (src/projetos/<p>/plano-ad.json) do lote de 17/11 (pasta CONTAS(FELIPE EDITAR)): Aline, Larissa, Letícia, Lívia, Lorena,
# Mariana, Maria Clara e Vanessa. Mesmo padrão aprovado (12-16/11): legenda "vermelho", B-roll do produto em tela dividida na fala
# do produto e no CTA quando a criadora não mostra o produto, seta automática, sem headline (padrão aprovado), regravações cortadas
# à mão (semRegravacao), velocidade 1,1x no montar-ads. Pedidos novos: tela dividida da Revita (Aline 13/10), criadora recortada na
# frente do vídeo de fundo (Fit Hair AD 02, Creatina AD 02), Rejuvex com especialista (Letícia).
# Uso: python entrada/lote1711/gerar-planos.py [projeto ...]
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
KW = {REJ: 'rejuvex', ALW: 'always', SOU: 'soufit', MENO: '^meno', REV: 'revita', MEL: '^neo|^melatonina$', MNJ: 'mounjarin|etron',
      MJN: '^mounjar', NAC: '^nac$|nacao', COV: 'covitta', COL: 'body|action', SOLD: 'soldiers', FIT: 'hair'}
REF = '.painel/lote1711/ref/'
P = {}
def ad(p, rot, img, cortar=(), estilo='vermelho', **extra):
    cortar = [list(c) for c in cortar]
    prod = [{'de': a, 'ate': b, 'img': img, 'modo': 'topo'} for a, b in auto(p, KW[img], cortar)] if img else []
    P[p] = {'_roteiro': rot, 'split': extra.pop('split', []), 'fotos': extra.pop('fotos', []), 'produto': prod, 'headline': None,
            'legenda': 'meio', 'estiloLegenda': estilo, 'semRegravacao': True, **({'cortar': cortar} if cortar else {}), **extra}
MOSTRA = ' (ela mostra o produto: sem B-roll)'
fimde = lambda p, frase: [round(ini(p, frase, qual=-1) - 0.05, 2), 9999]
# ---------------- Aline ("Aline - Roteiro")
A = 'Aline - Roteiro: '
ad('al-0811-ad01', A + 'AD 01 - Rejuvex 08/11; 3 regravações cortadas', REJ, [(30.32, 35.96), (84.30, 88.84), (104.38, 113.93)])
ad('al-0811-ad02', A + 'AD 02 - Complexo B Always Fit 08/11; 4 regravações cortadas', ALW, [(76.80, 83.87), (103.80, 112.23), (127.36, 131.01), (140.03, 148.53)])
ad('al-0811-ad03', A + 'AD 03 - Creatina Soufit 08/11 (foto da loja oficial Soufit, sem foto no Drive); 2 regravações cortadas', SOU, [(40.20, 50.37), (116.58, 124.33)])
ad('al-0811-ad04', A + 'AD 04 - Composto Meno 08/11; 4 regravações cortadas', MENO, [(4.60, 9.61), (83.88, 86.65), (92.22, 104.47), (113.18, 125.49)])
# Revita 13/10: "Tela dividida igual nesse vídeo aqui e a mesma foto também" (ssstik @compraslari_1785074504217: foto dos pés com a
# headline em cima durante a primeira frase) e "coloca os vídeos quando ela fala de ..." (Sil_Skin_Care: clipes no topo do gancho).
RV, SIL = REF + 'revita-compraslari-1785074504217.mp4', REF + 'sil-skin-care.mp4'
ad('al-1310-ad01', A + 'AD 01 - Complexo B Revita 13/10; tela dividida com a foto dos pés da ref no começo; 2 regravações cortadas', REV,
   [(53.88, 62.57), (123.42, 128.97)], fotos=[{'de': 0, 'ate': round(ini('al-1310-ad01', 'quando os seus pés') - 0.05, 2), 'img': RV + '@1.0', 'crop': '576:480:0:0', 'modo': 'topo'}])
q = ini('al-1310-ad02', 'quando aquele desânimo')
ad('al-1310-ad02', A + 'AD 02 - Complexo B Revita 13/10; tela dividida com os clipes de falta de energia/disposição baixa/desânimo da ref Sil_Skin_Care; 1 regravação cortada', REV,
   [(57.44, 61.45)], split=[{'de': 0, 'ate': round(q - 0.05, 2), 'video': SIL, 'inicio': 4.67, 'crop': '576:400:0:0'},
                           {'de': round(q - 0.05, 2), 'ate': round(ini('al-1310-ad02', 'não é a idade') - 0.05, 2), 'video': SIL, 'inicio': 4.67, 'crop': '576:400:0:0', 'loop': True, 'len': 4.35}])
c3 = ini('al-1310-ad03', 'e com o cabelo caindo')
ad('al-1310-ad03', A + 'AD 03 - Complexo B Revita 13/10; tela dividida com os clipes de imunidade baixa e queda de cabelo da ref Sil_Skin_Care', REV, [],
   split=[{'de': 0, 'ate': round(c3 - 0.05, 2), 'video': SIL, 'inicio': 9.07, 'crop': '576:400:0:0'},
          {'de': round(c3 - 0.05, 2), 'ate': round(ini('al-1310-ad03', 'memória fraca') - 0.05, 2), 'video': SIL, 'inicio': 14.27, 'crop': '576:400:0:0', 'loop': True, 'len': 3.6}])
# ---------------- Larissa ("3 - Shopdalari")
L = 'Larissa - Roteiros (3 - Shopdalari): '
ad('la-1711-ad01', L + '17/11 AD 01 - Fit Hair' + MOSTRA + '; "Beijo!" final cortado; headline do roteiro não aplicada (padrão aprovado)', None, [fimde('la-1711-ad01', 'Beijo')])
FH = REF + 'fundo-fithair-1794837485678.mp4'
ad('la-1711-ad02', L + '17/11 AD 02 - Fit Hair' + MOSTRA + '; criadora recortada na frente do vídeo de fundo ssstik 1794837485678 (formato Maria Madalena) de "Porque muita mulher" até o produto', None,
   fundo=[{'de': round(ini('la-1711-ad02', 'porque muita mulher') - 0.05, 2), 'ate': round(ini('la-1711-ad02', 'e esse aqui é o fit') - 0.05, 2), 'video': FH, 'inicio': 0, 'dur': 29.18, 'audio': 'mistura', 'volume': 0.3}])
ad('la-1711-ad03', L + '17/11 AD 03 - Fit Hair' + MOSTRA, None)
ad('la-1811-ad01', L + '18/11 AD 01 - Melatonina Neo Química (sem o produto na mão: B-roll)', MEL)
ad('la-1811-ad02', L + '18/11 AD 02 - Creatina Soufit (foto da loja oficial); abertura de caras e bocas mantida (0-23 s) + 2,6 s repetidos dela apontando (11,4-14,0) para durar o vídeo de fundo ssstik 1794857012751 inteiro (áudio dele); a fala dela começa depois do fundo (bruto-sem-enchimento.mov guardado)', SOU,
   manter=[[0.3, 25.65]], fundo=[{'de': 0.3, 'ate': 25.6, 'dur': 25.24, 'video': REF + 'fundo-creatina-1794857012751.mp4', 'inicio': 0, 'audio': 'troca'}])
ad('la-1811-ad03', L + '18/11 AD 03 - Creatina Soufit (foto da loja oficial)', SOU)
# ---------------- Letícia ("Roteiros - Letícia"; vídeos 12/11 ad 01-05)
E = 'Letícia - Roteiros: '
ad('le-1211-ad01', E + '12/11 AD 01 - Mounjarin Psyllium ("sem headline e praticamente sem edição"); 1 regravação cortada', MNJ, [(210.28, 212.96)])
ad('le-1211-ad02', E + '12/11 AD 02 - Rejuvex: vídeo do especialista (ssstik 1793992915014) depois de "explica", legenda roxa', REJ, estilo='roxo',
   manter=[[6.3, 17.45]], split=[{'de': 6.3, 'ate': 17.45, 'video': '.painel/vanessa/ref/ref-rejuvex-especialista.mp4', 'inicio': 4.0, 'crop': '576:512:0:0', 'audio': True}])
ad('le-1211-ad03', E + '12/11 AD 03 - Colágeno Hidrolisado Body Action; 1 regravação cortada', COL, [(53.93, 61.48)])
ad('le-1211-ad04', E + '12/11 AD 04 - Complexo B Revita Beauty', REV)
ad('le-1211-ad05', E + '12/11 AD 05 - Creatina Soufit (foto da loja oficial); pochete muda (medida na energia: 16,49-17,03)', SOU, mutar=['pochete'], mudosBruto=[[16.49, 17.03]])
# ---------------- Lívia ("3 - Livia")
I = 'Lívia - Roteiros (3 - Livia): '
ad('li-1311-01', I + '13/11 AD 01 - NAC Nação Verde (foto do site da marca, autorizada em 12/11)', NAC)
ad('li-1311-02', I + '13/11 AD 02 - NAC Nação Verde; 1 regravação cortada', NAC, [(34.22, 37.24)])
ad('li-1311-03', I + '13/11 AD 03 - NAC Nação Verde; "mesmo barulho do começo" (ssstik 1794572141161) pendente: sem o som no PC', NAC)
ad('li-1511-01', I + '15/11 AD 01 - Psyllium (Mounjarin Psyllium, Etron)', MNJ)
ad('li-1511-02', I + '15/11 AD 02 - Mounjar Natural; 1 regravação cortada', MJN, [(85.08, 90.60)])
ad('li-1511-03', I + '15/11 AD 03 - Melatonina Neo Química; headline não aplicada (padrão aprovado)', MEL)
ad('li-1511-04', I + '15/11 AD 04 - Magnésio 3 em 1 Covitta; "Legenda por Sônia Ruberti" do Whisper (silêncio final) cortado', COV, [(59.3, 9999)])
ad('li-1611-02', I + '16/11 AD 02 - Mounjarin Psyllium (a pasta 16/11 01 tem o mesmo arquivo "16:11 02.MP4")', MNJ)
ad('li-1611-03', I + '16/11 AD 03 - Magnésio 3 em 1 Covitta (ela segura um frasco de cola, não o produto: B-roll); headline não aplicada', COV)
ad('li-1611-04', I + '16/11 AD 04 - Creatina (título do roteiro diz Soldiers; a fala diz Soufit: foto da Soufit)', SOU)
# ---------------- Lorena
O = 'Lorena - roteiros: '
ad('lo-1611-2', O + '16.11 2 = AD 02 - Mounjarin Psyllium' + MOSTRA, None)
ad('lo-1711-1', O + '17.11 1 = AD 01 - Fit Hair' + MOSTRA + '; 1 regravação cortada; headline não aplicada', None, [(111.28, 114.50)])
ad('lo-1711-2', O + '17.11 2 = AD 02 - Fit Hair; criadora recortada na frente do vídeo de fundo ssstik 1794837485678 de "Porque muita mulher" até o produto', FIT,
   fundo=[{'de': round(ini('lo-1711-2', 'porque muita mulher') - 0.05, 2), 'ate': round(ini('lo-1711-2', 'depende do que falta') + 2.2, 2), 'video': FH, 'inicio': 0, 'dur': 29.18, 'audio': 'mistura', 'volume': 0.3}])
# ---------------- Mariana, Maria Clara
ad('ma-1511-ad01', 'Mariana - Roteiros (3 - Shop.Mari): 15/11 AD 01 - Psyllium (Mounjarin Psyllium, Etron); 2 regravações do fim cortadas', MNJ, [(227.46, 238.95)])
ad('mc-1511-ad03', 'Maria Clara - Roteiros: 15/11 AD 03 - Melatonina Neo Química; headline não aplicada', MEL)
ad('mc-1511-ad04', 'Maria Clara - Roteiros: 15/11 AD 04 - Magnésio 3 em 1 Covitta; headline não aplicada', COV)
# ---------------- Vanessa
V = 'Vanessa - Roteiros: '
ad('v1511-ad01', V + '15/11 AD 01 - Psyllium (Mounjarin, Etron)' + MOSTRA + '; "E aí?" final cortado', None, [fimde('v1511-ad01', 'e aí')])
ad('v1511-ad02', V + '15/11 AD 02 - Mounjar Natural', MJN)
ad('v1511-ad03', V + '15/11 AD 03 - Melatonina Neo Química; headline não aplicada', MEL)
ad('v1511-ad04', V + '15/11 AD 04 - Magnésio 3 em 1 Covitta' + MOSTRA + '; headline não aplicada', None)
ad('v1611-ad01', V + '16/11 AD 01 - Mounjar Natural', MJN)
ad('v1611-ad02', V + '16/11 AD 02 - Mounjarin Psyllium' + MOSTRA, None)
ad('v1611-ad03', V + '16/11 AD 03 - Magnésio 3 em 1 Covitta' + MOSTRA + '; headline não aplicada', None)
ad('v1611-ad04', V + '16/11 AD 04 - Creatina Soufit (foto da loja oficial)', SOU)
ad('v1711-ad01', V + '17/11 AD 01 - Fit Hair' + MOSTRA + '; headline não aplicada', None)
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar', ''), 'split', len(pl['split']), 'fundo' if pl.get('fundo') else '')
# ---------------- Chegaram durante o lote (17/11 à tarde)
P2 = {}
ad('mc-1611-ad01', 'Maria Clara - Roteiros: 16/11 AD 01 - Mounjar Natural (a pasta tem o arquivo duas vezes, iguais)', MJN)
ad('mc-1611-ad02', 'Maria Clara - Roteiros: 16/11 AD 02 - Mounjarin Psyllium', MNJ)
ad('mc-1611-ad03', 'Maria Clara - Roteiros: 16/11 AD 03 - Magnésio 3 em 1 Covitta; headline não aplicada', COV)
ad('v1711-ad02', V + '17/11 AD 02 - Fit Hair' + MOSTRA + '; criadora recortada na frente do vídeo de fundo ssstik 1794837485678 de "Porque muita mulher" até o produto', None,
   fundo=[{'de': round(ini('v1711-ad02', 'porque muita mulher') - 0.05, 2), 'ate': round(ini('v1711-ad02', 'e é esse fit') - 0.05, 2), 'video': FH, 'inicio': 0, 'dur': 29.18, 'audio': 'mistura', 'volume': 0.3}])
for p in ('mc-1611-ad01', 'mc-1611-ad02', 'mc-1611-ad03', 'v1711-ad02'):
    pl = P[p]; arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq) and 'rostoY' in json.load(open(arq, encoding='utf-8')): pl['rostoY'] = json.load(open(arq, encoding='utf-8'))['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'fundo' if pl.get('fundo') else '')
