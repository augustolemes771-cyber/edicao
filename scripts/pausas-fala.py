# Pausas pela energia da voz em faixa larga (200 Hz a 7 kHz, inclui o chiado do "s", para não confundir fim de palavra com
# silêncio), janelas de 25 ms. Limiar = nível da fala (percentil 90) menos 13 dB. Pausa = trecho abaixo do limiar com pelo
# menos 0,25 s. Grava src/projetos/<p>/silencios.json (o montar-ads tira cada pausa com 0,07 s de folga de cada lado).
# Pega as pausas das emendas de gravação que o pausas-energia perdia com ruído de sala (v0711-ad04, 11/11).
# Uso: python scripts/pausas-fala.py <projeto> [--abaixo 13] [--min 0.25]
import array, json, math, os, subprocess, sys

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(raiz)
args = sys.argv[1:]
proj = args[0]
opc = lambda n, p: float(args[args.index(n) + 1]) if n in args else p
abaixo, minimo = opc('--abaixo', 13), opc('--min', 0.25)
fonte = next(f for f in (f'public/projetos/{proj}/bruto.mov', f'public/projetos/{proj}/video.mp4') if os.path.exists(f))
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', fonte, '-vn', '-ac', '1', '-ar', '16000', '-af', 'highpass=f=200,lowpass=f=7000',
                      '-f', 's16le', '-'], capture_output=True).stdout
a = array.array('h', raw)
n = 400  # 25 ms
E = [20 * math.log10(max(1, math.sqrt(sum(x * x for x in a[i * n:(i + 1) * n]) / n)) / 32768) for i in range(len(a) // n)]
fala = sorted(E)[int(len(E) * 0.9)]
lim = fala - abaixo
pausas, i = [], 0
while i < len(E):
    if E[i] < lim:
        j = i
        while j < len(E) and E[j] < lim: j += 1
        if (j - i) * 0.025 >= minimo: pausas.append([round(i * 0.025, 3), round(j * 0.025, 3)])
        i = j
    else:
        i += 1
json.dump(pausas, open(f'src/projetos/{proj}/silencios.json', 'w'))
print(f'{proj}: {len(pausas)} pausas, {sum(b - a for a, b in pausas):.1f} s (fala {fala:.1f} dB, limiar {lim:.1f} dB)')
