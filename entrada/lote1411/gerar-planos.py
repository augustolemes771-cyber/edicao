# Planos (src/projetos/<p>/plano-ad.json) do lote de 14/11: Lívia (3 - Livia, 09/11 AD03 e 10/11 AD01-04) e Mariana (3 - Shop.Mari,
# 10/11 AD03-04 e 12/11 AD01-03). Mesmo padrão aprovado em 12-13/11: legenda "vermelho" (ref ssstik.io_1789378895428), B-roll do
# produto em tela dividida na fala do produto e no CTA quando a criadora não mostra o produto, seta automática, palavras mudas do roteiro.
# mudosBruto: retenção/pochete medidas na energia do bruto (o Whisper errava a posição).
# Uso: python entrada/lote1411/gerar-planos.py [projeto ...]
import json, re, unicodedata, os, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
def norm(s):
    s = unicodedata.normalize('NFD', s.lower()); s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]', '', s)
TR = {}
def W(p):
    if p not in TR: TR[p] = [w for w in json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf-8')) if norm(w['text'])]
    return TR[p]
def ach(p, frase, qual=-1, depois=0):
    w = W(p); k = [norm(x) for x in frase.split()]; ws = [norm(x['text']) for x in w]
    oc = [i for i in range(len(w) - len(k) + 1) if ws[i:i + len(k)] == k and w[i]['startMs'] / 1000 >= depois]
    if not oc: raise SystemExit(f'{p}: não achei "{frase}"')
    i = oc[qual]
    return w[i]['startMs'] / 1000, w[i + len(k) - 1]['endMs'] / 1000
ini = lambda p, f, **o: ach(p, f, **o)[0]
fim = lambda p, f, **o: ach(p, f, **o)[1]
def prod(img, *faixas, modo='topo'):
    return [{'de': round(a, 2), 'ate': round(b, 2), **({'img': img} if img else {}), 'modo': modo} for a, b in faixas]
DRV = '.painel/mcf/ref/'
CM, COV, REV = DRV + 'composto-meno.jpg', DRV + 'covitta-magnesio.jpg', DRV + 'revita-complexo-b.webp'
REJ = DRV + 'rejuvex-ultra.png'          # sem foto no Drive: foto da loja Life in Suplementos (fabricante do Rejuvex Ultra)
CREAT = DRV + 'creatina-soufit.png'      # sem foto no Drive: foto da loja oficial Soufit
NACV = DRV + 'nac-nacaoverde.png'        # sem foto no Drive: foto do site da Nação Verde (autorizado em 12/11)
MUDO_NAC, MUDO_POCH = ['retencao', 'redencao', 'pochete'], ['pochete']
P = {}
def repete(p, frase):
    return [round(ini(p, frase, qual=0) - 0.04, 2), round(ini(p, frase, qual=-1) - 0.05, 2)]
def simples(p, rot, img, faixas, estilo='vermelho', **extra):
    pr = []
    for a, b, q in faixas:
        s_ = ini(p, a, qual=q)
        pr.append((s_, ach(p, b, qual=0, depois=s_)[1]))
    P[p] = {'_roteiro': rot, 'split': [], 'fotos': [], 'produto': prod(img, *pr), 'headline': None, 'legenda': 'meio', 'estiloLegenda': estilo, **extra}
MOSTRA = '(ela mostra o produto: sem B-roll)'
LI = 'Lívia - Roteiros (3 - Livia): '
simples('li-0911-03', LI + '09/11 AD 03 - Complexo B Revita Beauty', REV,
        [('esse produto aqui', 'cápsula só', 0), ('já deixei', 'pegar a sua', -1)])
simples('li-1011-01', LI + '10/11 AD 01 - Creatina Soufit', CREAT,
        [('eu trouxe uma creatina', 'creatina comum', 0), ('se você quer esse produto', 'tem estoque', -1)],
        cortar=[[round(ini('li-1011-01', 'creatina hoje é um dos principais') - 0.04, 2), round(ini('li-1011-01', 'creatina hoje é um dos suplementos') - 0.05, 2)]])
simples('li-1011-02', LI + '10/11 AD 02 - Composto Meno', CM,
        [('e o nome disso', 'vitamina e', -1), ('se o link ainda', 'clicar aqui', -1)],
        cortar=[[round(ini('li-1011-02', 'você não é preguiçosa', qual=0) - 0.04, 2), round(ini('li-1011-02', 'você não é preguiçosa', qual=-1) - 0.05, 2)]])
simples('li-1011-03', LI + '10/11 AD 03 - Composto Meno', CM,
        [('e é por isso que eu tomo', 'vitamina e', 0), ('é só apertar', 'família inteira', -1)])
simples('li-1011-04', LI + '10/11 AD 04 - Rejuvex (sem headline, praticamente sem edição)', REJ,
        [('com o rejuvex ultra', 'tomar muito', -1), ('então se você quer', 'oferta continua', -1)])
MA = 'Mariana - Roteiros (3 - Shop.Mari): '
simples('ma-1011-ad03', MA + '10/11 AD 03 - NAC Nação Verde; retenção e pochete mudas', NACV,
        [('esse que eu tomo', 'nação verde', -1), ('é só apertar', 'família inteira', -1)], mutar=MUDO_NAC,
        cortar=[repete('ma-1011-ad03', 'se você for atrás de glutationa pronta')], mudosBruto=[[49.60, 50.18], [53.14, 53.86]])
simples('ma-1011-ad04', MA + '10/11 AD 04 - Creatina Soufit; pochete muda', CREAT,
        [('é a creatina', 'mesmo drink', -1), ('é só apertar', 'família inteira', -1)], mutar=MUDO_POCH, mudosBruto=[[15.70, 16.30]])
simples('ma-1211-ad01', MA + '12/11 AD 01 - Magnésio 3 em 1 Covitta', COV,
        [('esse que eu tomo', 'da covitta', -1), ('é só apertar', 'preço cai', -1)])
simples('ma-1211-ad02', MA + '12/11 AD 02 - Rejuvex (sem headline, praticamente sem edição)', REJ,
        [('com o rejuvex ultra', 'tomar muito', -1), ('se você quer melhorar', 'oferta continua', -1)])
simples('ma-1211-ad03', MA + '12/11 AD 03 - NAC Always Fit ' + MOSTRA + '; retenção e pochete mudas; "Obrigado" final (fora do roteiro) cortado',
        None, [], mutar=MUDO_NAC, cortar=[[round(ini('ma-1211-ad03', 'obrigado') - 0.05, 2), 9999]], mudosBruto=[[52.18, 52.56], [55.30, 55.84]])
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):
        ant = json.load(open(arq, encoding='utf-8'))
        for k in ('rostoY',):
            if k in ant: pl[k] = ant[k]
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar'), 'mutar', pl.get('mutar'))
