# Planos da Lorena e da Lívia (executado dentro do gerar-planos.py, depois das transcrições).
def tem(p): return os.path.getsize(f'src/projetos/{p}/transcricao.json') > 10
LO = 'Lorena - roteiros: '
if tem('lo-1211-1'):
    simples('lo-1211-1', LO + '12/11 AD 01 - Magnésio 3 em 1 Covitta', COV,
            [('esse que eu tomo', 'da covitta', -1), ('é só apertar', 'preço cai', -1)], cortar=[repete('lo-1211-1', 'esse que eu tomo')])
if tem('lo-1211-2'):
    simples('lo-1211-2', LO + '12/11 AD 02 - Rejuvex', REJ,
            [('com o rejuvex ultra', 'tomar muito', -1), ('nesse link aqui', 'oferta continua', -1)],
            cortar=[[round(ini('lo-1211-2', 'e o resveratrol ainda', qual=0) - 0.04, 2), round(ini('lo-1211-2', 'o resveratrol ainda', qual=-1) - 0.05, 2)]])
if tem('lo-1211-3'):
    simples('lo-1211-3', LO + '12/11 AD 03 - NAC Always Fit ' + MOSTRA + '; retenção e pochete mudas', None, [], mutar=MUDO_NAC,
            cortar=[repete('lo-1211-3', 'esse que eu tomo na minha'), repete('lo-1211-3', 'eu trago')])
if tem('lo-1311-1'):
    simples('lo-1311-1', LO + '13/11 AD 01 - NAC Always Fit (sem foto no Drive: PRODUTO AQUI)', NACAF,
            [('esse aqui ó', 'tiktok shopping', 0), ('então se o clique', 'antes que acabe', -1)])
if tem('lo-1311-2'):
    simples('lo-1311-2', LO + '13/11 AD 02 - NAC Always Fit ' + MOSTRA, None, [],
            cortar=[[round(ini('lo-1311-2', 'se você percebeu', qual=0) - 0.04, 2), round(ini('lo-1311-2', 'e você percebeu', qual=-1) - 0.05, 2)]])
if tem('lo-1311-3'):
    simples('lo-1311-3', LO + '13/11 AD 03 - NAC Always Fit ' + MOSTRA + ' (barulho da ref ssstik.io_1794572141161 pendente)', None, [],
            cortar=[repete('lo-1311-3', 'olha tem um órgão')])
# Lorena 07/11: Magnésio 3 em 1 com o gancho em tela dividida da ref ssstik.io_1793733227341 (modelo aprovado v0711/fe-0711).
R = '.painel/vanessa/ref/ref-magnesio.mp4'
VID = {'v1': (0, 2.0), 'v2': (2.0, 4.4)}
FOTO = {'f3': ('@7.6', '420:280:78:666', [180, 1290, 720, 480]), 'f6': ('@13', '308:202:134:672', [240, 1250, 600, 394]),
        'f7': ('@15.5', '324:212:126:658', [240, 1250, 600, 393]), 'f8': ('@24.5', '268:174:170:672', [240, 1250, 600, 390])}
ORDEM = {1: ['v1', 'v2', 'f3', 'f6', 'f7', 'f8'], 2: ['v2', 'v1', 'f3', 'f6', 'f7', 'f8'],
         3: ['f3', 'v1', 'v2', 'f6', 'f7', 'f8'], 4: ['f7', 'f8', 'v1', 'v2', 'f3', 'f6']}
def gancho(p, ad, cortes):
    sp, ft = [], []
    for item, a, b in zip(ORDEM[ad], cortes, cortes[1:]):
        if item in VID:
            s, l = VID[item]; sp.append({'de': round(a, 2), 'ate': round(b, 2), 'video': R, 'inicio': s, 'len': l, 'crop': '576:384:0:0'})
        else:
            t, c, bx = FOTO[item]; ft.append({'de': round(a, 2), 'ate': round(b, 2), 'img': R + t, 'crop': c, 'modo': 'caixa', 'box': bx})
    return sp, ft
def magnesio(p, ad, fr, prod_ini, prod_fim, cta_ini, cta_fim, rot, **extra):
    t = [0.0] + [ini(p, f, qual=0) for f in fr[1:5]] + [ini(p, fr[5], qual=0)]
    t[0] = max(0, ini(p, fr[0], qual=0) - 0.1)
    j = 4 if ad != 4 else 0
    cortes = t[:j + 1] + [(t[j] + t[j + 1]) / 2] + t[j + 1:]
    sp, ft = gancho(p, ad, cortes)
    P[p] = {'_roteiro': rot, 'split': sp, 'fotos': ft,
            'produto': prod(COV, (ini(p, prod_ini), fim(p, prod_fim)), (ini(p, cta_ini), fim(p, cta_fim))), 'headline': None, 'legenda': 'meio', **extra}
if tem('lo-0711-1'):
    magnesio('lo-0711-1', 1, ['formigamento', 'fica assim', 'seu quadril', 'além disso', 'ou tá acordando', 'eu preciso te falar'],
             'tomar esse aqui', 'frasco só', 'então se tiver aparecendo', 'pra pegar', LO + '07/11 AD 01 - Magnésio 3 em 1',
             cortar=[repete('lo-0711-1', 'então se tiver aparecendo'), repete('lo-0711-1', 'caso você queira')])
if tem('lo-0711-2'):
    magnesio('lo-0711-2', 4, ['tá acordando', 'formigamento', 'fica assim', 'seu quadril', 'além disso', 'eu preciso te falar'],
             'tomar esse aqui', 'frasco só', 'então se tiver aparecendo', 'pra pegar', LO + '07/11 AD 04 - Magnésio 3 em 1 (vídeo 07.11 2)')
if tem('lo-0711-3'):
    magnesio('lo-0711-3', 3, ['seu quadril', 'formigamento', 'fica assim', 'além disso', 'ou está acordando', 'eu preciso te falar'],
             'tomar esse daqui', 'frasco só', 'então se tiver aparecendo', 'para pegar', LO + '07/11 AD 03 - Magnésio 3 em 1 (vídeo 07.11 3)',
             cortar=[repete('lo-0711-3', 'olha se você quiser experimentar')])
if tem('lo-0911-1'):
    simples('lo-0911-1', LO + '09/11 AD 01 - Creatina Soufit (sem foto no Drive: PRODUTO AQUI)', CREAT,
            [('eu trouxe uma creatina', 'creatina comum', 0), ('se você quer esse produto', 'na sua vida', -1)])
if tem('lo-0911-2'):
    simples('lo-0911-2', LO + '09/11 AD 02 - Composto Meno', CM,
            [('e o nome disso', 'vitamina e', -1), ('se o link ainda', 'clicar aqui', -1)], cortar=[repete('lo-0911-2', 'a linhaça traz')])
if tem('lo-0911-3'):
    simples('lo-0911-3', LO + '09/11 AD 03 - Composto Meno', CM,
            [('e é por isso que eu tomo', 'composto meno', -1), ('é só apertar', 'família inteira', -1)])
# ---------------- Lívia (3 - Livia) ----------------
LI = 'Lívia - Roteiros (3 - Livia): '
if tem('li-0811-02'):
    especialista('li-0811-02', LI + '08/11 AD 02 - Rejuvex (11 s abertos depois de "explica": ela emendou sem as caras e bocas)')
if tem('li-0911-01'):
    simples('li-0911-01', LI + '09/11 AD 01 - Colágeno Body Action (foto do link do produto no roteiro)', COL,
            [('esse aqui é o colágeno', 'body action', 0), ('então amiga se você', 'essa oferta', -1)], semRegravacao=True,
            cortar=[repete('li-0911-01', 'então amiga se você'),
                    [round(fim('li-0911-01', 'biotina', qual=-1) + 0.02, 2), round(ini('li-0911-01', 'e vitamina a', qual=-1) - 0.05, 2)]])
