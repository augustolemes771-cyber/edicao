# Montagem rápida do AD 03 (03/11, Melão de São Caetano) direto no ffmpeg:
# cortes nas pausas, "pochete" mutado, tela dividida no início (vídeo do melão em cima), legenda palavra a palavra
# em caixa preta (igual à ref Sil_Skin_Care), card do produto e seta para o botão laranja até o fim.
import json, subprocess, os, sys

RAIZ = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
P = os.path.join(RAIZ, 'public', 'projetos', 'vanessa-0311-ad03')
OUT = os.path.join(RAIZ, 'out')
w = json.load(open(os.path.join(os.path.dirname(__file__), 'transcricao.json'), encoding='utf-8'))
W = [{'t': x['text'].strip().replace('despincar', 'despencar'), 's': x['startMs'] / 1000, 'e': x['endMs'] / 1000} for x in w if x['text'].strip()]
DUR = 123.57

# Trechos mantidos: corta pausas entre palavras maiores que 0,30 s (deixa 0,12 s de folga de cada lado).
# A fala é corrida (quase sem pausa; o Whisper emenda o fim de uma palavra no início da outra), então as bordas vêm
# do silêncio medido no áudio (silencedetect -20 dB, 0,22 s), com 0,05 s de folga.
SIL = [(32.668, 32.904), (40.008, 40.291), (66.032, 66.314), (97.114, 97.377), (102.438, 102.730)]
segs = []
ini = 0.52
for a, b in SIL:
    segs.append([ini, a + 0.05])
    ini = b - 0.05
segs.append([ini, 123.40])

def mapa(t):
    acc = 0
    for s, e in segs:
        if t < s:
            return acc
        if t <= e:
            return acc + (t - s)
        acc += e - s
    return acc

TOTAL = sum(e - s for s, e in segs)

# Pochete: muta (tempos originais).
mutes = [(x['s'] - 0.03, x['e'] + 0.03) for x in W if 'pochete' in x['t'].lower()]

# ---------- Legenda ASS ----------
def ts(t):
    t = max(0, t)
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f'{h}:{m:02d}:{s:05.2f}'

SPLIT_FIM = 22.0  # duração do vídeo de cima (editado)
ass = ['[Script Info]', 'ScriptType: v4.00+', 'PlayResX: 1080', 'PlayResY: 1920', 'WrapStyle: 2', '',
       '[V4+ Styles]',
       'Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding',
       'Style: Leg,Arial Black,64,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,1,0,0,0,100,100,1,0,3,12,0,5,40,40,0,1',
       'Style: Card,Arial Black,70,&H00FFFFFF,&H00FFFFFF,&H001E6BFF,&H001E6BFF,1,0,0,0,100,100,0,0,3,26,0,5,40,40,0,1',
       'Style: Seta,Arial,10,&H001E6BFF,&H001E6BFF,&H00FFFFFF,&H00000000,0,0,0,0,100,100,0,0,1,6,0,7,0,0,0,1',
       '', '[Events]', 'Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text']

# Grupos de até 3 palavras (quebra em pontuação ou pausa), mostrados palavra por palavra (acumula dentro do grupo).
grupos = []
g = []
for i, x in enumerate(W):
    g.append(x)
    fim_frase = x['t'][-1] in '.,?!…' or len(g) == 3
    prox = W[i + 1] if i + 1 < len(W) else None
    if fim_frase or not prox or prox['s'] - x['e'] > 0.3:
        grupos.append(g); g = []
if g: grupos.append(g)

for gi, g in enumerate(grupos):
    fim_g = mapa(g[-1]['e']) + 0.15
    if gi + 1 < len(grupos):
        fim_g = min(fim_g + 0.3, mapa(grupos[gi + 1][0]['s']))
    for k, x in enumerate(g):
        a = mapa(x['s'])
        b = mapa(g[k + 1]['s']) if k + 1 < len(g) else fim_g
        if b - a < 0.04: continue
        y = 960 if a < SPLIT_FIM else 1260
        txt = ' '.join(('{\\c&H00D7FF&}' + z['t'].upper().strip('.,?!…') + '{\\c&HFFFFFF&}') if j == k else z['t'].upper().strip('.,?!…')
                       for j, z in enumerate(g[:k + 1]))
        txt = txt.replace('POCHETE', '***')
        ass.append(f'Dialogue: 1,{ts(a)},{ts(b)},Leg,,0,0,0,,{{\\pos(540,{y})}}{txt}')

# Card do produto (onde ela fala onde conseguir o original) e na chamada final.
def palavra(txt, depois=0):
    for x in W:
        if x['s'] >= depois and x['t'].lower().startswith(txt):
            return x
c1 = palavra('mostrar', 100)
c2 = palavra('brasil', 100)
ass.append(f'Dialogue: 2,{ts(mapa(c1["s"]))},{ts(mapa(c2["e"]) + 0.3)},Card,,0,0,0,,{{\\pos(540,1010)\\fad(120,120)\\fscx80\\fscy80\\t(0,180,\\fscx100\\fscy100)}}MELÃO DE{{\\N}}SÃO CAETANO{{\\N}}{{\\fs44}}ORIGINAL ✔')
c3 = palavra('coloca', 113)
c4 = palavra('faz', 118)
ass.append(f'Dialogue: 2,{ts(mapa(c3["s"]))},{ts(mapa(c4["e"]) + 0.2)},Card,,0,0,0,,{{\\pos(540,1010)\\fad(120,120)}}MELÃO DE{{\\N}}SÃO CAETANO')

# Seta laranja apontando para o botão (embaixo, à esquerda, onde o TikTok Shop põe o produto) até o fim.
s0 = mapa(palavra('mostrar', 100)['s'])
seta = 'm 0 0 l 120 0 l 120 150 l 200 150 l 60 300 l -80 150 l 0 150'
t = s0
k = 0
while t < TOTAL + 1:
    y = 1380 if k % 2 == 0 else 1420
    ass.append(f'Dialogue: 3,{ts(t)},{ts(t + 0.35)},Seta,,0,0,0,,{{\\pos(200,{y})\\p1}}{seta}{{\\p0}}')
    t += 0.35; k += 1

sub = os.path.join(P, 'legenda.ass')
open(sub, 'w', encoding='utf-8').write('\n'.join(ass) + '\n')

# ---------- ffmpeg ----------
fc = []
for i, (s, e) in enumerate(segs):
    fc.append(f'[0:v]trim={s:.3f}:{e:.3f},setpts=PTS-STARTPTS[v{i}];[0:a]atrim={s:.3f}:{e:.3f},asetpts=PTS-STARTPTS[a{i}]')
fc.append(''.join(f'[v{i}][a{i}]' for i in range(len(segs))) + f'concat=n={len(segs)}:v=1:a=1[vc][ac0]')
vol = ','.join(f"volume=enable='between(t,{mapa(a):.3f},{mapa(b):.3f})':volume=0" for a, b in mutes) or 'anull'
fc.append(f'[ac0]{vol},loudnorm=I=-14:TP=-1.5:LRA=11[aout]')
# Tela dividida: em cima o melão (576x1024 -> 1080x960), embaixo a criadora (rosto), até SPLIT_FIM.
fc.append('[vc]split[vfull][vb]')
fc.append('[vb]crop=1080:960:0:120[bottom]')
fc.append(f'[1:v]fps=30,scale=1080:1920,crop=1080:960:0:330,setpts=PTS-STARTPTS[top]')
fc.append('[top][bottom]vstack[split]')
fc.append(f"[vfull][split]overlay=0:0:enable='lt(t,{SPLIT_FIM})':eof_action=pass[comp]")
subesc = sub.replace('\\', '/').replace(':', '\\:')
fc.append(f"[comp]subtitles='{subesc}'[vout]")
final = os.path.join(OUT, 'vanessa-0311-ad03-final.mp4')
cmd = ['ffmpeg', '-y', '-v', 'error', '-stats', '-i', os.path.join(P, 'video.mp4'), '-i', os.path.join(P, 'melao-topo.mp4'),
       '-filter_complex', ';'.join(fc), '-map', '[vout]', '-map', '[aout]',
       '-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '20', '-b:v', '0', '-pix_fmt', 'yuv420p',
       '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', f'{TOTAL:.3f}', '-movflags', '+faststart', final]
print('trechos', len(segs), 'duracao', round(TOTAL, 2), 'mutes', len(mutes))
if '--so-ass' not in sys.argv:
    subprocess.run(cmd, check=True)
    print(final)
