# Mapeia trecho do FINAL (pela retranscrição) para o tempo do bruto e mostra as palavras do whisper do bruto ali.
# Uso: python rev-mapa.py <p> "<frase a tirar>" "<palavra seguinte que fica>"
import json, sys, re, subprocess
p, tirar, depois = sys.argv[1:4]
d = json.load(open(f'src/projetos/rev-{p}/transcricao.json', encoding='utf8'))
W = [w for w in d['words'] if w['type'] == 'word']
txt = [w['text'] for w in W]
n = len(tirar.split())
for i in range(len(W) - n + 1):
    if ' '.join(txt[i:i+n]) == tirar: break
else: sys.exit('não achei: ' + tirar)
vel = json.load(open(f'src/projetos/{p}/plano-ad.json',encoding='utf8')).get('velocidade',1.1)
a, b = W[i]['start']*vel, W[i+n]['start']*vel
seg = json.load(open(f'out/ass/{p}-trechos.json'))
fd = float(subprocess.run(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',f'out/{p}-final.mp4'],capture_output=True,text=True).stdout)
def bruto(t):
    acc = 0
    for s, e in seg:
        if t <= acc + (e - s): return s + t - acc
        acc += e - s
    return seg[-1][1]
print(f'{p}: final {a:.2f}-{b:.2f} -> bruto {bruto(a):.2f}-{bruto(b):.2f} (soma trechos {sum(e-s for s,e in seg):.2f} x final*vel {fd*vel:.2f})')
T = json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf8'))
for w in T:
    if bruto(a) - 3 < w['startMs']/1000 < bruto(b) + 2: print(f"   {w['startMs']/1000:7.2f}-{w['endMs']/1000:7.2f} {w['text']}")
