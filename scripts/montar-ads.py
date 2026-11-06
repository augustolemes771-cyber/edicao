# Montagem rápida de anúncio (talking head vertical) direto no ffmpeg, sem Remotion: corta pausas e regravações pela transcrição
# palavra a palavra, queima legenda em tarja (3 palavras por tela), seta pulsando para o botão laranja a partir do CTA até o fim,
# muta palavras pedidas e normaliza o áudio, numa passada só com NVENC.
# Uso: python scripts/montar-ads.py <projeto> [--mutar pochete,outra] [--saida out/x.mp4]
import json, os, re, subprocess, sys, unicodedata

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(raiz)
args = sys.argv[1:]
proj = args[0]
opc = lambda n, p=None: args[args.index(n) + 1] if n in args else p
mutar = [m for m in (opc('--mutar', '') or '').split(',') if m]
saida = opc('--saida', f'out/{proj}-final.mp4')
fonte = f'public/projetos/{proj}/bruto.mov'
if not os.path.exists(fonte):
    fonte = f'public/projetos/{proj}/video.mp4'

def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9%$]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))

T = json.load(open(f'src/projetos/{proj}/transcricao.json', encoding='utf-8'))
W = [{'t': w['text'].strip(), 'a': w['startMs'] / 1000, 'b': w['endMs'] / 1000} for w in T if w['text'].strip()]
# Tokens do whisper que vêm colados (pontuação solta): junta na palavra anterior.
P = []
for w in W:
    if P and not norm(w['t']):
        P[-1]['t'] += w['t']; P[-1]['b'] = w['b']
    else:
        P.append(dict(w))
W = P
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', fonte], capture_output=True, text=True).stdout)

# Regravação: a mesma sequência de 5 palavras volta logo adiante -> fica só a última tomada.
N = 9
k = [norm(w['t']) for w in W]
apagar = set()
i = 0
while i < len(W) - N:
    alvo = k[i:i + N]
    achou = None
    for j in range(i + 3, min(len(W) - N, i + 30)):
        if k[j:j + N] == alvo:
            achou = j
    if achou:
        apagar.update(range(i, achou)); i = achou
    else:
        i += 1
# Frase interrompida (palavra cortada pela metade seguida de recomeço) já cai pela regra acima na maioria dos casos.
V = [w for n, w in enumerate(W) if n not in apagar]

# Trechos mantidos: junta palavras com pausa <= 0,25 s; folga de 0,06 s antes e 0,10 s depois.
seg = []
for w in V:
    a, b = max(0, w['a'] - 0.06), min(dur, w['b'] + 0.10)
    if seg and a - seg[-1][1] <= 0.25:
        seg[-1][1] = max(seg[-1][1], b)
    else:
        seg.append([a, b])
# Tempo editado de cada palavra.
def editado(t):
    acc = 0
    for a, b in seg:
        if t < a: return acc
        if t <= b: return acc + (t - a)
        acc += b - a
    return acc
# Pausas medidas no áudio (o Whisper estica a palavra por cima do silêncio): tira de cada trecho o silêncio > 0,3 s,
# deixando 0,08 s de respiro de cada lado.
sd = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-vn', '-i', fonte, '-af', 'silencedetect=noise=-34dB:d=0.3', '-f', 'null', '-'], capture_output=True, text=True).stderr
ini = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', sd)]
fim = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', sd)]
sil = [(a + 0.08, b - 0.08) for a, b in zip(ini, fim) if b - a > 0.3]
# Áudio com ruído de fundo: as pausas por energia (scripts/pausas-energia.mjs) valem mais.
sp = f'src/projetos/{proj}/silencios.json'
if os.path.exists(sp):
    sil += [(a, b) for a, b in json.load(open(sp))]
    sil.sort()
novo = []
for a, b in seg:
    cur = a
    for sa, sb in sil:
        if sb <= cur or sa >= b: continue
        if sa > cur + 0.05: novo.append([cur, sa])
        cur = max(cur, sb)
    if b - cur > 0.05: novo.append([cur, b])
seg = novo
total = sum(b - a for a, b in seg)

# Legenda: 3 palavras por tela, quebra em pontuação; a palavra falada fica amarela.
def ts(x):
    x = max(0, x); h = int(x // 3600); m = int(x % 3600 // 60); s = x % 60
    return f'{h}:{m:02d}:{s:05.2f}'
grupos, g = [], []
for w in V:
    g.append(w)
    if len(g) == 3 or re.search(r'[.,!?;:]$', w['t']):
        grupos.append(g); g = []
if g: grupos.append(g)
ev = []
for gi, g in enumerate(grupos):
    fim_g = editado(grupos[gi + 1][0]['a']) if gi + 1 < len(grupos) else editado(g[-1]['b']) + 0.3
    for wi, w in enumerate(g):
        a = editado(w['a'])
        b = editado(g[wi + 1]['a']) if wi + 1 < len(g) else fim_g
        if b - a < 0.02: continue
        txt = ' '.join((r'{\c&H00E6FF&}' if x is w else r'{\c&HFFFFFF&}') + re.sub(r'[{}]', '', x['t']).upper().rstrip('.,;:') for x in g)
        ev.append(f'Dialogue: 0,{ts(a)},{ts(b)},Leg,,0,0,0,,{txt}')
# CTA: primeira menção a carrinho/botão laranja na metade final -> seta pulsando no canto do botão até o fim.
cta = None
for n, w in enumerate(V):
    prox = norm(V[n + 1]['t']) if n + 1 < len(V) else ''
    if editado(w['a']) > total * 0.5 and (norm(w['t']) in ('carrinho', 'link') or (norm(w['t']) == 'botao' and prox == 'laranja')):
        cta = editado(w['a']); break
if cta is None: cta = max(0, total - 12)
seta = r'{\p1}m 60 0 l 120 0 l 120 120 l 180 120 l 90 220 l 0 120 l 60 120{\p0}'
t = cta
up = True
while t < total:
    y = 1430 if up else 1470
    ev.append(f'Dialogue: 1,{ts(t)},{ts(min(total, t + 0.4))},Seta,,0,0,0,,{{\\pos(150,{y})}}{seta}')
    t += 0.4; up = not up
# Plano do roteiro (src/projetos/<p>/plano-ad.json): tela dividida, fotos, produto, caixinha de pergunta. Tempos no vídeo bruto.
arq_plano = f'src/projetos/{proj}/plano-ad.json'
plano = json.load(open(arq_plano, encoding='utf-8')) if os.path.exists(arq_plano) else {}
hl = plano.get('headline')
if hl and hl.get('texto'):
    a, b = editado(hl.get('de', 0)), editado(hl.get('ate', 5))
    # Caixinha de pergunta (sticker do TikTok/Instagram): faixa de cima colorida e caixa branca com a pergunta em preto.
    yh = hl.get('y', 330)
    ev.append(f'Dialogue: 2,{ts(a)},{ts(b)},CaixaTopo,,0,0,0,,{{\\pos(540,{yh})}}Faça uma pergunta')
    ev.append(f'Dialogue: 2,{ts(a)},{ts(b)},Caixa,,0,0,0,,{{\\pos(540,{yh + 110})}}{hl["texto"]}')
ass = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Leg,Arial Black,{72 if plano.get('estiloLegenda') != 'contorno' else 66},&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,{3 if plano.get('estiloLegenda') != 'contorno' else 1},{14 if plano.get('estiloLegenda') != 'contorno' else 7},0,5,60,60,0,1
Style: Seta,Arial,10,&H00168CFF,&H00168CFF,&H00FFFFFF,&H00000000,0,0,0,0,100,100,0,0,1,5,0,7,0,0,0,1
Style: Caixa,Arial,58,&H00111111,&H00111111,&H00FFFFFF,&H00000000,-1,0,0,0,100,100,0,0,3,34,0,5,90,90,0,1
Style: CaixaTopo,Arial,40,&H00FFFFFF,&H00FFFFFF,&H00573DF0,&H00000000,-1,0,0,0,100,100,0,0,3,26,0,5,90,90,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
""" + '\n'.join(ev) + '\n'
os.makedirs('out/ass', exist_ok=True)
arq_ass = f'out/ass/{proj}.ass'
open(arq_ass, 'w', encoding='utf-8').write(ass)

# Mudo: as palavras pedidas (ex.: pochete), no tempo editado.
mudos = [(editado(w['a']) - 0.03, editado(w['b']) + 0.03) for w in V if any(norm(w['t']).startswith(norm(m)) for m in mutar)]
sel = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in seg)
vol = ''.join(f",volume=enable='between(t,{a:.3f},{b:.3f})':volume=0" for a, b in mudos)
# Camadas do plano. Cada item vira uma entrada do ffmpeg (foto: quadro extraído da referência; vídeo: trecho da referência)
# sobreposta só no seu intervalo (tempo editado). "topo": metade de cima, com a criadora recortada na metade de baixo.
entradas, camadas, topo = [], [], []
os.makedirs('out/ass/img', exist_ok=True)
# Caixa da foto dentro do quadro da referência (576x1024), medida nos quadros: a foto é uma sobreposição pequena.
# (arquivo, segundo) mais próximo ganha; sem entrada = quadro todo.
CAIXAS = {
    'fotos-1793746004942': {7: (314, 250, 128, 38), 10: (278, 362, 250, 48), 20.75: (284, 222, 146, 81), 21.75: (319, 165, 257, 81)},
    'ref-0411-0511': {24.5: (327, 185, 154, 666), 27: (328, 200, 115, 666)},
    'fotos-comprasdamariii': {1: (434, 192, 19, 316), 4: (308, 154, 96, 262), 11.5: (293, 288, 104, 312)},
    'dicasdoshop1': {12.5: (352, 176, 64, 640)},
}
# Vídeo de referência que já é tela dividida: só a metade de cima dele vai para o nosso topo.
TOPO_REF = {'ref-0411-0511': (576, 384, 0, 0)}
def caixa(v, s):
    c = CAIXAS.get(os.path.splitext(os.path.basename(v))[0])
    if not c: return None
    return c[min(c, key=lambda k: abs(k - float(s)))]
def quadro(spec, crop=None):
    png = f'out/ass/img/{proj}-{len(camadas)}.png'
    if '@' in spec:
        v, s = spec.rsplit('@', 1)
        cx = caixa(v, s)
        vf = f'crop={crop},' if crop else (f'crop={cx[0]}:{cx[1]}:{cx[2]}:{cx[3]},' if cx else '')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', s, '-i', v, '-frames:v', '1', '-vf', vf + 'scale=1080:960:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:white', png])
    else:
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', spec, '-frames:v', '1', '-vf', 'scale=1080:960:force_original_aspect_ratio=decrease,pad=1080:960:(ow-iw)/2:(oh-ih)/2:white', png])
    return png
prod_png = 'out/ass/img/produto-aqui.png'
if plano.get('produto') and not os.path.exists(prod_png):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'lavfi', '-i', 'color=white:s=1080x960', '-vf',
                    "drawtext=fontfile=C\\\\:/Windows/Fonts/ariblk.ttf:text='PRODUTO AQUI':fontsize=110:fontcolor=black:x=(w-tw)/2:y=(h-th)/2",
                    '-frames:v', '1', prod_png])
itens = []
for s_ in plano.get('split', []):
    itens.append(('video', s_['video'], s_['de'], s_['ate'], 'topo', s_.get('inicio', 0), s_.get('loop', False), s_.get('crop'), s_.get('len')))
for f_ in plano.get('fotos', []):
    itens.append(('img', f_['img'], f_['de'], f_['ate'], f_.get('modo', 'topo'), 0, False, f_.get('crop'), None))
for p_ in plano.get('produto', []):
    itens.append(('img', prod_png, p_['de'], p_['ate'], 'topo', 0, False, None, None))
# Ordem: split por baixo, fotos e produto por cima.
for tipo, arq, de, ate, modo, ini, loop, crop, ln in itens:
    a, b = editado(max(0, de)), editado(min(dur, ate))
    if b - a < 0.1: continue
    n = len(camadas) + 1
    W_, H_ = (1080, 960) if modo == 'topo' else (1080, 1920)
    if tipo == 'img':
        entradas += ['-loop', '1', '-t', f'{b - a + 0.1:.2f}', '-i', quadro(arq, crop)]
    else:
        entradas += (['-stream_loop', '-1'] if loop else []) + ['-ss', str(ini), '-t', f'{(ln if ln else b - a) + 0.1:.2f}', '-i', arq]
    tr = TOPO_REF.get(os.path.splitext(os.path.basename(arq))[0]) if tipo == 'video' else None
    cr = f'crop={crop},' if (crop and tipo == 'video') else (f'crop={tr[0]}:{tr[1]}:{tr[2]}:{tr[3]},' if tr else '')
    # Trecho curto da referência (len) repetido até cobrir o intervalo.
    if tipo == 'video' and ln: cr = f'fps=30,loop=loop=-1:size={int(ln * 30)}:start=0,' + cr
    camadas.append((n, a, b, W_, H_, cr))
    if modo == 'topo': topo.append((a, b))
graf = [f"[0:v]select='{sel}',setpts=N/FRAME_RATE/TB,scale=1080:1920,format=yuv420p[base0]"]
ult = 'base0'
if topo:
    en = '+'.join(f'between(t,{a:.3f},{b:.3f})' for a, b in topo)
    # Criadora na metade de baixo: recorte 1080x960 centrado no rosto (terço de cima do quadro).
    graf.append(f"[{ult}]split[bA][bB];[bB]crop=1080:960:0:260[bC];[bA][bC]overlay=0:960:enable='{en}'[base1]")
    ult = 'base1'
for k, (n, a, b, W_, H_, cr) in enumerate(camadas):
    y = 0
    graf.append(f"[{n}:v]{cr}scale={W_}:{H_}:force_original_aspect_ratio=increase,crop={W_}:{H_},setsar=1,format=yuv420p,fps=30,setpts=PTS-STARTPTS+{a:.3f}/TB[c{k}]")
    graf.append(f"[{ult}][c{k}]overlay=0:{y}:eof_action=pass:enable='between(t,{a:.3f},{b:.3f})'[o{k}]")
    ult = f'o{k}'
graf.append(f"[{ult}]ass='out/ass/{proj}.ass'[v]")
graf.append(f"[0:a]aselect='{sel}',asetpts=N/SR/TB{vol},loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[a]")
open(f'out/ass/{proj}-filtro.txt', 'w').write(';'.join(graf))
os.makedirs(os.path.dirname(saida), exist_ok=True)
r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', fonte, *entradas, '-/filter_complex', f'out/ass/{proj}-filtro.txt',
                    '-map', '[v]', '-map', '[a]', '-r', '30', '-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '20', '-b:v', '0',
                    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', saida])
print(f'{proj}: {"ok" if r.returncode == 0 else "ERRO"} {total:.1f}s (de {dur:.1f}s), {len(seg)} trechos, {len(apagar)} palavras de regravação cortadas, '
      f'CTA/seta em {cta:.1f}s, {len(mudos)} mudo(s) -> {saida}')
sys.exit(r.returncode)
