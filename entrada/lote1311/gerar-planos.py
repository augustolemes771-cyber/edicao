# Gera src/projetos/<p>/plano-ad.json do lote de 13/11 (Larissa, Karol, Vanessa, Lorena, Lívia) a partir de âncoras na fala.
# Mesmo padrão do lote aprovado de 12/11 (entrada/mcf/gerar-planos.py): legenda "vermelho", B-roll do produto em tela dividida
# na fala do produto e no CTA quando a criadora não mostra o produto, seta automática do montar-ads, palavras mudas do roteiro.
# Uso: python entrada/lote1311/gerar-planos.py [projeto ...]   (sem argumento: todos os que já têm transcrição)
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
DRV = '.painel/mcf/ref/'  # fotos das pastas PRODUTOS do Drive
CM, REJ, COV, TETRA, NACV = DRV + 'composto-meno.jpg', DRV + 'rejuvex-ultra-drive.jpg', DRV + 'covitta-magnesio.jpg', DRV + 'tetramagnesio-quantum.webp', DRV + 'nac-nacaoverde.png'
COL, MOUN, REV = DRV + 'colageno-bodyaction.png', DRV + 'mounjarin-psyllium.webp', DRV + 'revita-complexo-b.webp'
CREAT = None  # Creatina Soufit: não tem foto no Drive -> aviso "PRODUTO AQUI"
NACAF = None  # NAC Always Fit: não tem foto no Drive -> aviso "PRODUTO AQUI"
MUDO_NAC, MUDO_POCH = ['retencao', 'redencao', 'pochete'], ['pochete']
P = {}
def repete(p, frase):
    """Tomada repetida: corta da 1ª ocorrência da frase até a última (fica a última)."""
    return [round(ini(p, frase, qual=0) - 0.04, 2), round(ini(p, frase, qual=-1) - 0.05, 2)]
def simples(p, rot, img, faixas, estilo='vermelho', **extra):
    """faixas: (frase de início, frase de fim, q) -> foto do produto de início a fim. q=0: 1ª ocorrência do início; -1: última."""
    pr = []
    for a, b, q in faixas:
        s_ = ini(p, a, qual=q)
        pr.append((s_, ach(p, b, qual=0, depois=s_)[1]))
    P[p] = {'_roteiro': rot, 'split': [], 'fotos': [], 'produto': prod(img, *pr), 'headline': None, 'legenda': 'meio', 'estiloLegenda': estilo, **extra}
MOSTRA = '(ela mostra o produto: sem B-roll)'
# ---------------- Larissa (3 - Shopdalari) ----------------
def L(p, rot): return f'Larissa - Roteiros (3 - Shopdalari): {rot}'
if os.path.exists('src/projetos/la-0911-ad03/transcricao.json'):
    simples('la-0911-ad03', L('la-0911-ad03', '09/11 AD 03 - Composto Meno ' + MOSTRA), None, [], cortar=[repete('la-0911-ad03', 'com essa vida corrida')])
    # Pasta "11/11 AD 02" traz o Rejuvex (AD 03 do roteiro); "11/11 AD 03" traz a Creatina (AD 02): casado pela fala.
    simples('la-1111-ad02', L('', '11/11 AD 03 - Rejuvex (vídeo da pasta 11/11 AD 02) ' + MOSTRA), None, [])
    simples('la-1111-ad03', L('', '11/11 AD 02 - Creatina Soufit (vídeo da pasta 11/11 AD 03; sem foto no Drive: PRODUTO AQUI); pochete muda'), CREAT,
            [('é a creatina', 'mesmo drink', -1), ('é só apertar', 'família inteira', -1)], mutar=MUDO_POCH)
# ---------------- Karol ----------------
K = 'Karol - Roteiros: '
simples('ka-1211-ad01', K + '12/11 AD 01 - Magnésio 3 em 1 Covitta', COV,
        [('esse que eu tomo', 'da covitta', -1), ('é só apertar', 'preço cai', -1)])
simples('ka-1211-ad02', K + '12/11 AD 02 - Rejuvex', REJ,
        [('com o rejuvex ultra', 'tomar muito', -1), ('então corre', 'oferta continua', -1)])
simples('ka-1211-ad03', K + '12/11 AD 03 - NAC Always Fit ' + MOSTRA + '; retenção e pochete mudas', None, [], mutar=MUDO_NAC,
        cortar=[repete('ka-1211-ad03', 'a produzir a própria'), [round(ini('ka-1211-ad03', 'então minha querida') - 0.04, 2), round(ini('ka-1211-ad03', 'minha querida ou') - 0.05, 2)]])
simples('ka-1311-ad01', K + '13/11 AD 01 - Rejuvex', REJ,
        [('com o rejuvex ultra', 'tomar muito', -1), ('nesse link aqui', 'oferta continua', -1)])
simples('ka-1311-ad02', K + '13/11 AD 02 - Tetra Magnésio', TETRA,
        [('esse que eu tomo', 'quantum nutrition', -1), ('é só apertar', 'preço cai', -1)], cortar=[repete('ka-1311-ad02', 'e eles funcionam muito melhor')])
simples('ka-1311-ad03', K + '13/11 AD 03 - NAC Nação Verde (foto do site da marca, autorizada em 12/11); retenção e pochete mudas', NACV,
        [('esse que eu tomo', 'nação verde', -1), ('é só apertar', 'família inteira', -1)], mutar=MUDO_NAC)
simples('ka-1311-ad04', K + '13/11 AD 04 - Creatina Soufit (sem foto no Drive: PRODUTO AQUI); pochete muda; fim inventado pelo Whisper cortado', CREAT,
        [('é a creatina', 'mesmo drink', -1), ('é só apertar', 'família inteira', -1)], mutar=MUDO_POCH,
        cortar=[[round(ini('ka-1311-ad04', 'legenda por') - 0.05, 2), 9999]])
# ---------------- Vanessa ----------------
V = 'Vanessa - Roteiros: '
simples('v0911-ad03', V + '09/11 AD 03 - Composto Meno ' + MOSTRA, None, [])
simples('v0911-ad04', V + '09/11 AD 04 - Composto Meno ' + MOSTRA, None, [])
simples('v1011-ad01', V + '10/11 AD 01 - Mounjarin Psyllium ' + MOSTRA, None, [])
simples('v1011-ad03', V + '10/11 AD 03 - Colágeno Body Action (foto do link do produto no roteiro)', COL,
        [('esse colágeno em cápsula', 'body action', 0), ('então amiga se você', 'essa oferta', -1)], semRegravacao=True)
simples('v1011-ad04', V + '10/11 AD 04 - Complexo B Revita Beauty ' + MOSTRA, None, [])
simples('v1011-ad05', V + '10/11 AD 05 - Creatina Soufit (sem foto no Drive: PRODUTO AQUI); pochete muda', CREAT,
        [('é a creatina', 'mesmo drink', -1), ('é só você apertar', 'família inteira', -1)], mutar=MUDO_POCH)
# Rejuvex com o vídeo do especialista (ref ssstik.io_1793992915014, com o áudio dele) e legenda "roxo" (modelo mc-0911-ad01/fe-1011-ad2).
ESP = '.painel/vanessa/ref/ref-rejuvex-especialista.mp4'
def especialista(p, rot):
    a = fim(p, 'explica', qual=0) + 0.05; b = a + 11.15
    P[p] = {'_roteiro': rot, 'manter': [[round(a, 2), round(b, 2)]],
            'split': [{'de': round(a, 2), 'ate': round(b, 2), 'video': ESP, 'inicio': 4.0, 'crop': '576:512:0:0', 'audio': True}], 'fotos': [],
            'produto': prod(REJ, (ini(p, 'lembrando que'), fim(p, 'não é medicamento')), (ini(p, 'carrinho laranja') - 1.2, fim(p, 'que você', qual=-1) + 0.6)),
            'headline': None, 'legenda': 'meio', 'estiloLegenda': 'roxo'}
especialista('v1011-ad02', V + '10/11 AD 02 - Rejuvex (vídeo do especialista depois de "explica")')
# ---------------- Lorena e Lívia: acrescentados quando a transcrição terminar ----------------
EXTRA = 'entrada/lote1311/planos-extra.py'
if os.path.exists(EXTRA): exec(open(EXTRA, encoding='utf-8').read())
so = [a for a in sys.argv[1:] if not a.startswith('--')]
for p, pl in P.items():
    if so and p not in so: continue
    arq = f'src/projetos/{p}/plano-ad.json'
    if os.path.exists(arq):  # mantém o rostoY medido
        ant = json.load(open(arq, encoding='utf-8'))
        if 'rostoY' in ant: pl['rostoY'] = ant['rostoY']
    json.dump(pl, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'split', [(s['de'], s['ate']) for s in pl['split']], 'produto', [(s['de'], s['ate']) for s in pl['produto']], 'cortar', pl.get('cortar'), 'mutar', pl.get('mutar'))
