# Tira uma tomada errada que o whisper do bruto engoliu (CORREÇÃO DO USUÁRIO 23/11: "fala a mesma frase 2 vezes").
# Acha a frase na retranscrição do FINAL (ElevenLabs, ao pé da letra), leva para o tempo do bruto, troca as palavras do whisper
# daquele ponto pelas do ElevenLabs e põe o trecho errado no "cortar" do plano (e em rev-cortes.json, que o gerar-planos lê).
# Uso: python rev-cortar.py <p> "<frase a tirar>" [--seco]
import json, sys, re, subprocess, unicodedata
def norm(s):
    s = unicodedata.normalize('NFD', s.lower())
    return re.sub(r'[^a-z0-9%$]', '', ''.join(c for c in s if unicodedata.category(c) != 'Mn'))
p, tirar = sys.argv[1:3]; seco = '--seco' in sys.argv
plano_arq = f'src/projetos/{p}/plano-ad.json'
plano = json.load(open(plano_arq, encoding='utf8'))
vel = plano.get('velocidade', 1.1)
d = json.load(open(f'src/projetos/rev-{p}/transcricao.json', encoding='utf8'))
E = [w for w in d['words'] if w['type'] == 'word']
k = [norm(w['text']) for w in E]; alvo = [norm(x) for x in tirar.split() if norm(x)]
ach = [i for i in range(len(k)) if k[i:i+len(alvo)] == alvo]
if not ach: sys.exit(f'{p}: não achei "{tirar}"')  # várias: a 1ª é a tomada errada
i = ach[0]; j = i + len(alvo)
seg = json.load(open(f'out/ass/{p}-trechos.json'))
def bruto(t):
    t *= vel; acc = 0
    for s, e in seg:
        if t <= acc + (e - s) + 1e-6: return s + t - acc
        acc += e - s
    return seg[-1][1]
# janela de troca: 2 palavras antes até 3 depois
a0, a1 = max(0, i - 2), min(len(E), j + 4)
while a1 < len(E) and not re.search(r'[.?!,]$', E[a1 - 1]['text']): a1 += 1
T = json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf8'))
# Alinha pelo texto: a troca vai da palavra do whisper igual à 1ª da janela até a igual à última (a mais perto no tempo).
def perto(par, ms, d):  # par de palavras seguidas; d=0: a 1ª é a que conta, d=1: a 2ª
    c = [n + d for n in range(len(T) - 1) if (norm(T[n]['text']), norm(T[n + 1]['text'])) == par and abs(T[n + d]['startMs'] - ms) < 4000]
    return min(c, key=lambda n: abs(T[n]['startMs'] - ms)) if c else None
while True:
    novas = [{'text': ' ' + E[x]['text'], 'startMs': round(bruto(E[x]['start']) * 1000), 'endMs': round(bruto(E[x]['end']) * 1000)} for x in range(a0, a1)]
    w0 = perto((k[a0], k[a0 + 1]), novas[0]['startMs'], 0); w1 = perto((k[a1 - 2], k[a1 - 1]), novas[-1]['startMs'], 1)
    if w0 is not None and w1 is not None and w1 >= w0: break
    if w0 is None: a0 -= 1
    if w1 is None or (w0 is not None and w1 < w0): a1 += 1
    if a0 < 0 or a1 > len(E): sys.exit(f'{p}: não alinhou')
sai = [w['text'] for w in T[w0:w1 + 1]]
fora = T[:w0] + T[w1 + 1:]
lo = T[w0 - 1]['endMs'] if w0 else 0; hi = T[w1 + 1]['startMs'] if w1 + 1 < len(T) else 10**9
for w in novas: w['startMs'] = min(max(w['startMs'], lo), hi); w['endMs'] = min(max(w['endMs'], w['startMs']), hi)
NT = T[:w0] + novas + T[w1 + 1:]
c = [round(bruto(E[i]['start']) - 0.03, 2), round(bruto(E[j]['start']) - 0.04, 2)]
print(f'{p}: tira "{" ".join(E[x]["text"] for x in range(i, j))}" bruto {c}')
print('   whisper era:', ''.join(sai)); print('   fica      :', ''.join(w['text'] for w in novas))
if seco: sys.exit()
json.dump(NT, open(f'src/projetos/{p}/transcricao.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
plano.setdefault('cortar', []).append(c); plano['cortar'].sort()
json.dump(plano, open(plano_arq, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
try: R = json.load(open('entrada/lote2411/rev-cortes.json', encoding='utf8'))
except FileNotFoundError: R = {}
R.setdefault(p, []).append(c)
json.dump(R, open('entrada/lote2411/rev-cortes.json', 'w', encoding='utf8'), ensure_ascii=False, indent=1)
