# Gera src/projetos/<p>/plano-ad.json dos ADs Maria Clara / Fernanda / Larissa (12/11) a partir de âncoras na fala.
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
    """(início, fim) da frase na fala; qual=-1 última ocorrência (a última tomada fica), 0 a primeira."""
    w = W(p); k = [norm(x) for x in frase.split()]; ws = [norm(x['text']) for x in w]
    oc = [i for i in range(len(w) - len(k) + 1) if ws[i:i + len(k)] == k and w[i]['startMs'] / 1000 >= depois]
    if not oc: raise SystemExit(f'{p}: não achei "{frase}"')
    i = oc[qual]
    return w[i]['startMs'] / 1000, w[i + len(k) - 1]['endMs'] / 1000
ini = lambda p, f, **o: ach(p, f, **o)[0]
fim = lambda p, f, **o: ach(p, f, **o)[1]
R = '.painel/vanessa/ref/ref-magnesio.mp4'
MC = '.painel/mcf/ref/'
VID = {'v1': (0, 2.0), 'v2': (2.0, 4.4)}
FOTO = {'f3': ('@7.6', '420:280:78:666', [180, 1290, 720, 480]), 'f6': ('@13', '308:202:134:672', [240, 1250, 600, 394]),
        'f7': ('@15.5', '324:212:126:658', [240, 1250, 600, 393]), 'f8': ('@24.5', '268:174:170:672', [240, 1250, 600, 390])}
ORDEM = {1: ['v1', 'v2', 'f3', 'f6', 'f7', 'f8'], 2: ['v2', 'v1', 'f3', 'f6', 'f7', 'f8'],
         3: ['f3', 'v1', 'v2', 'f6', 'f7', 'f8'], 4: ['f7', 'f8', 'v1', 'v2', 'f3', 'f6']}
def gancho(p, ad, cortes):
    """cortes: 7 tempos (início, 5 divisões, fim) dos 6 trechos do gancho; mídia na ordem do AD (modelo aprovado v0711)."""
    sp, ft = [], []
    for item, a, b in zip(ORDEM[ad], cortes, cortes[1:]):
        if item in VID:
            s, l = VID[item]; sp.append({'de': round(a, 2), 'ate': round(b, 2), 'video': R, 'inicio': s, 'len': l, 'crop': '576:384:0:0'})
        else:
            t, c, bx = FOTO[item]; ft.append({'de': round(a, 2), 'ate': round(b, 2), 'img': R + t, 'crop': c, 'modo': 'caixa', 'box': bx})
    return sp, ft
def meio(a, b): return (a + b) / 2
def prod(img, *faixas, modo='topo'):
    return [{'de': round(a, 2), 'ate': round(b, 2), **({'img': img} if img else {}), 'modo': modo} for a, b in faixas]
P = {}
COV = '.painel/mcf/ref/covitta-magnesio.jpg'
# ---------- Magnésio 3 em 1 (Covitta): ref ssstik.io_1793733227341, legenda padrão (como o modelo aprovado da Vanessa) ----------
def magnesio(p, ad, fr, prod_ini, prod_fim, cta_ini, cta_fim, rot):
    # fr: 5 frases do gancho na ordem falada (âncora de início de cada uma) + âncora do "preciso te falar".
    t = [0.0] + [ini(p, f, qual=0) for f in fr[1:5]] + [ini(p, fr[5], qual=0)]
    t[0] = max(0, ini(p, fr[0], qual=0) - 0.1)
    # 6 trechos: a maior das 5 frases é dividida ao meio (modelo: a última, "acordando cansada").
    d = [t[i + 1] - t[i] for i in range(5)]; j = 4 if ad != 4 else 0
    cortes = t[:j + 1] + [meio(t[j], t[j + 1])] + t[j + 1:]
    sp, ft = gancho(p, ad, cortes)
    P[p] = {'_roteiro': rot, 'split': sp, 'fotos': ft,
            'produto': prod(COV, (ini(p, prod_ini), fim(p, prod_fim)), (ini(p, cta_ini), fim(p, cta_fim))), 'headline': None, 'legenda': 'meio'}
magnesio('mc-0811-ad02', 2, ['você fica assim', 'formigamento', 'seu quadril', 'além disso', 'ou você tá acordando', 'eu preciso te falar'],
         'esse aqui ó', 'frasco só', 'então se aqui', 'pegar o seu', 'Maria Clara - Roteiros: AD 02 - Magnésio 3 em 1')
magnesio('mc-0811-ad03', 3, ['seu quadril', 'formigamento', 'e depois fica', 'e além disso', 'ou tá acordando', 'então presta atenção'],
         'tomar esse daqui', 'frasco só', 'então se tiver aparecendo', 'pegar o seu', 'Maria Clara - Roteiros: AD 03 - Magnésio 3 em 1')
magnesio('mc-0811-ad04', 4, ['você tá acordando', 'formigamento', 'e fica assim', 'seu quadril', 'além disso', 'então presta atenção'],
         'tomar esse daqui', 'frasco só', 'então se tiver aparecendo', 'clicar agora e aproveitar', 'Maria Clara - Roteiros: AD 04 - Magnésio 3 em 1')
for p, ad, fr in [('fe-0711-ad1', 1, ['formigamento', 'fica assim', 'seu quadril', 'além disso', 'ou tá acordando', 'eu preciso te falar']),
                  ('fe-0711-ad2', 2, ['fica assim', 'formigamento', 'seu quadril', 'além disso', 'ou se você', 'eu preciso te falar']),
                  ('fe-0711-ad3', 3, ['o seu quadril', 'formigamento', 'fica assim', 'além disso', 'ou se você', 'eu preciso te falar']),
                  ('fe-0711-ad4', 4, ['tá acordando', 'formigamento', 'fica assim', 'seu quadril', 'além disso', 'eu preciso te falar'])]:
    magnesio(p, ad, fr, 'tomar esse daqui', 'frasco só', 'botão laranja', 'o seu', f'Fernanda - Roteiros: AD 0{ad} - Magnésio 3 em 1')
# ---------- Demais ADs: legenda da ref. ssstik.io_1789378895428 ("vermelho"), B-roll do produto em tela dividida, seta ----------
def simples(p, rot, img, faixas, estilo='vermelho', **extra):
    P[p] = {'_roteiro': rot, 'split': [], 'fotos': [], 'produto': prod(img, *[(s_, ach(p, b, qual=0, depois=s_)[1]) for a, b, q in faixas for s_ in [ini(p, a, **({'qual': 0} if q == 0 else {}))]]),
            'headline': None, 'legenda': 'meio', 'estiloLegenda': estilo, **extra}
DRV = MC  # fotos das pastas PRODUTOS do Drive (ou do link do produto no roteiro)
simples('mc-1011-ad02', 'Maria Clara - Roteiros: AD 02 - Composto Meno', DRV + 'composto-meno.jpg',
        [('e o nome disso', 'e vitamina e', -1), ('então peça o seu', 'seu agora', -1)],
        cortar=[[ini('mc-1011-ad02', 'exatamente grava aí') - 0.05, fim('mc-1011-ad02', 'exatamente grava aí') + 0.05],
                [ini('mc-1011-ad02', 'isso mesmo', qual=-1) - 0.05, fim('mc-1011-ad02', 'isso mesmo', qual=-1) + 0.05]])
simples('mc-1011-ad03', 'Maria Clara - Roteiros: AD 03 - Composto Meno', DRV + 'composto-meno.jpg',
        [('e é por isso que eu tomo', 'composto meno', -1), ('é só você apertar', 'família inteira', -1)])
simples('mc-1011-ad04', 'Maria Clara - Roteiros: AD 04 - Tetra Magnésio', DRV + 'tetramagnesio-quantum.webp',
        [('esse que eu tomo', 'quantum nutrition', -1), ('é só você apertar', 'leva um kit', -1)])
simples('mc-0911-ad02', 'Maria Clara - Roteiros: AD 02 - Rejuvex', DRV + 'rejuvex-ultra-drive.jpg',
        [('e detalhe o rejuvex', 'é esse aqui', 0), ('então amiga se você', 'pedir o seu agora', -1)])
simples('mc-0911-ad03', 'Maria Clara - Roteiros: AD 03 - Complexo B Always Fit', DRV + 'complexo-b-alwaysfit.jpg',
        [('e essa aqui que eu tomo', 'always fit', -1), ('é só você apertar', 'garantir a sua', -1)])
simples('mc-0911-ad04', 'Maria Clara - Roteiros: AD 04 - Complexo B Revita Beauty', DRV + 'revita-complexo-b.webp',
        [('esse produto aqui', 'completo amiga', -1), ('eu já deixei o link', 'laranja', -1)])
simples('fe-1011-ad1', 'Fernanda - Roteiros: AD 01 - Mounjarin Psyllium', DRV + 'mounjarin-psyllium.webp',
        [('o que finalmente me ajudou', 'amolece as fezes', -1), ('bom se você der', 'suma de novo', -1)])
simples('fe-0911-ad3', 'Fernanda - Roteiros: AD 03 - NAC Nação Verde (foto do site da marca, autorizada: não tem no Drive); retenção e pochete mudas', DRV + 'nac-nacaoverde.png',
        [('esse que eu tomo', 'do verde', -1), ('é só clicar aqui', 'garante o seu', -1)], mutar=['retencao', 'redencao', 'pochete'])
simples('fe-1011-ad3', 'Fernanda - Roteiros: AD 03 - Colágeno Body Action (foto do link do produto no roteiro)', DRV + 'colageno-bodyaction.png',
        [('esse daqui é o colágeno', 'body action', 0), ('então amiga se você', 'essa oferta', -1)])
simples('fe-1011-ad4', 'Fernanda - Roteiros: AD 04 - Complexo B Revita Beauty', DRV + 'revita-complexo-b.webp',
        [('esse produto', 'já completo', -1), ('eu já deixei o link', 'pegar a sua', -1)])
simples('la-0811-ad03', 'Larissa - Roteiros (3 - Shopdalari): AD 03 - Complexo B Always Fit (ela mostra o produto: sem B-roll)', None, [])
simples('la-0911-ad02', 'Larissa - Roteiros (3 - Shopdalari): AD 02 - Composto Meno', DRV + 'composto-meno.jpg',
        [('e o nome disso', 'vitamina e', -1), ('se o link ainda', 'clicar aqui', -1)])
simples('la-1111-ad01', 'Larissa - Roteiros (3 - Shopdalari): AD 01 - NAC Nação Verde (foto do site da marca, autorizada: não tem no Drive); retenção e pochete mudas', DRV + 'nac-nacaoverde.png',
        [('esse aqui ó', 'nação verde', -1), ('é só apertar', 'família inteira', -1)], mutar=['retencao', 'redencao', 'pochete'])
# ---------- Rejuvex AD 01: vídeo do especialista (ref ssstik.io_1793992915014, com o áudio dele) e legenda "roxo" da mesma ref ----------
ESP = '.painel/vanessa/ref/ref-rejuvex-especialista.mp4'
REJ = DRV + 'rejuvex-ultra-drive.jpg'
for p, rot in [('mc-0911-ad01', 'Maria Clara - Roteiros: AD 01 - Rejuvex (11 s abertos depois de "explica": ela emendou sem as caras e bocas)'),
               ('fe-1011-ad2', 'Fernanda - Roteiros: AD 02 - Rejuvex')]:
    a = fim(p, 'explica', qual=0) + 0.05; b = a + 11.15
    P[p] = {'_roteiro': rot, 'manter': [[round(a, 2), round(b, 2)]],
            'split': [{'de': round(a, 2), 'ate': round(b, 2), 'video': ESP, 'inicio': 4.0, 'crop': '576:512:0:0', 'audio': True}], 'fotos': [],
            'produto': prod(REJ, (ini(p, 'lembrando que'), fim(p, 'não é medicamento')), (ini(p, 'carrinho laranja') - 1.2, fim(p, 'que você', qual=-1) + 0.6)),
            'headline': None, 'legenda': 'meio', 'estiloLegenda': 'roxo'}
# ---------- Fernanda AD 04 Complexo B Revita (ref ssstik.io_1793733227341): mídia onde a coluna do editor manda ----------
p = 'fe-0511-ad4'
t_fim = ini(p, 'ou então', qual=0); t_pf = ini(p, 'eu preciso te falar', qual=0)
P[p] = {'_roteiro': 'Fernanda - Roteiros: AD 04 - Complexo B Revita (ref ssstik.io_1793733227341)',
        'split': [{'de': round(ini(p, 'formigamento', qual=0), 2), 'ate': round(t_fim, 2), 'video': R, 'inicio': 0, 'len': 2.0, 'crop': '576:384:0:0'},
                  {'de': round(t_pf, 2), 'ate': round(fim(p, 'contado', qual=0), 2), 'video': R, 'inicio': 2.0, 'len': 4.4, 'crop': '576:384:0:0'}],
        'fotos': [{'de': 0.0, 'ate': round(ini(p, 'formigamento', qual=0), 2), 'img': R + '@13', 'crop': '308:202:134:672', 'modo': 'topo'},
                  {'de': round(ini(p, 'a maioria das pessoas'), 2), 'ate': round(fim(p, 'fadiga'), 2), 'img': DRV + 'klickpin-labios.jpg', 'modo': 'topo'},
                  {'de': round(ini(p, 'ele é da revita'), 2), 'ate': round(fim(p, 'sem glúten'), 2), 'img': R + '@15.5', 'crop': '324:212:126:658', 'modo': 'topo'}],
        'produto': prod(DRV + 'revita-complexo-b.webp', (ini(p, 'tomar esse daqui'), fim(p, 'na composição')), (ini(p, 'se o carrinho'), fim(p, 'garante o seu'))),
        'headline': None, 'legenda': 'meio'}
json.dump(P, sys.stdout, ensure_ascii=False, indent=0) if '--ver' in sys.argv else None
for p, pl in P.items():
    json.dump(pl, open(f'src/projetos/{p}/plano-ad.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(p, 'split', [(s['de'], s['ate']) for s in pl['split']], 'fotos', [(s['de'], s['ate']) for s in pl['fotos']], 'produto', [(s['de'], s['ate']) for s in pl['produto']])
