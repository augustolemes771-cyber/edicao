# Gancho v2 (CORREÇÃO DO USUÁRIO 24/11: a tela dividida "não ficou natural, ficou um corte no meio do vídeo"):
# um fundo só = a cena dela sentada em tela cheia; a da pergunta (em pé) entra RECORTADA no canto esquerdo fazendo a queixa,
# fica CONGELADA (último quadro da pergunta) enquanto a sentada responde e volta a se mexer na pergunta seguinte.
# Usa os mesmos pares de entrada/lote2411/gancho-<p>.json (qa, qb, ra, rb, ..., parada opcional nos itens 7-8) e a máscara
# public/projetos/mk-<p>/mascara.mp4 (scripts/mascara.py rodado num recorte dos primeiros segundos do bruto original).
# Uso: python entrada/lote2411/gancho2.py <projeto>     (gera public/projetos/<p>/bruto.mov; original em bruto-original.mov)
import json, os, subprocess, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
p = sys.argv[1]
cfg = json.load(open(f'entrada/lote2411/gancho-{p}.json', encoding='utf8'))
d = f'public/projetos/{p}'
orig = f'{d}/bruto-original.mov'
masc = f'public/projetos/mk-{p}/mascara.mp4'
esc = cfg.get('escalaRecorte', 0.8)          # tamanho da pessoa recortada
xr = cfg.get('xRecorte', 0)                  # x do canto esquerdo do recorte (px) depois da escala (negativo = um pouco fora da tela)
yr = cfg.get('yRecorte', 'H-h')              # y do topo do recorte (padrão: encostado embaixo)
pares, resto = cfg['pares'], cfg['resto']
S = 'scale=1080:1920,setsar=1'
g, pv, pa = [], [], []
ant_rb = cfg.get('dirDesde', 0)
for i, par in enumerate(pares):
    qa, qb, ra, rb = par[:4]
    dq, dr = qb - qa, rb - ra
    da = max(ant_rb, ra - dq); dfim = ra
    if len(par) >= 8: da, dfim = par[6], min(par[7], par[6] + dq)
    fr = dq - (dfim - da)
    pad = f',tpad=start_duration={fr:.3f}:start_mode=clone' if fr > 0.01 else ''
    # fundo: sentada parada durante a pergunta + sentada respondendo
    g.append(f'[0:v]trim={da:.3f}:{dfim:.3f},setpts=PTS-STARTPTS,{S},fps=30{pad}[fq{i}]')
    g.append(f'[0:v]trim={ra:.3f}:{rb:.3f},setpts=PTS-STARTPTS,{S},fps=30[fr{i}]')
    g.append(f'[fq{i}][fr{i}]concat=n=2:v=1:a=0[fd{i}]')
    # pessoa da pergunta: anda na pergunta e congela no último quadro durante a resposta (vídeo e máscara iguais)
    g.append(f'[0:v]trim={qa:.3f}:{qb:.3f},setpts=PTS-STARTPTS,{S},fps=30,tpad=stop_duration={dr:.3f}:stop_mode=clone,format=rgba[pv{i}]')
    g.append(f'[1:v]trim={qa:.3f}:{qb:.3f},setpts=PTS-STARTPTS,scale=1080:1920,fps=30,tpad=stop_duration={dr:.3f}:stop_mode=clone,format=gray,'
             f'boxblur=1:1[pm{i}]')
    g.append(f'[pv{i}][pm{i}]alphamerge,scale=iw*{esc}:ih*{esc}[pr{i}]')
    g.append(f'[fd{i}][pr{i}]overlay=x={xr}:y={yr}:shortest=1,format=yuv420p[v{i}]')
    g.append(f'[0:a]atrim={qa:.3f}:{qb:.3f},asetpts=PTS-STARTPTS[aq{i}];[0:a]atrim={ra:.3f}:{rb:.3f},asetpts=PTS-STARTPTS[ar{i}];'
             f'[aq{i}][ar{i}]concat=n=2:v=0:a=1[a{i}]')
    pv.append(f'[v{i}]'); pa.append(f'[a{i}]')
    ant_rb = rb
g.append(f'[0:v]trim=start={resto:.3f},setpts=PTS-STARTPTS,{S},fps=30,format=yuv420p[vz];[0:a]atrim=start={resto:.3f},asetpts=PTS-STARTPTS[az]')
seq = ''.join(v + a for v, a in zip(pv + ['[vz]'], pa + ['[az]']))
g.append(f'{seq}concat=n={len(pv) + 1}:v=1:a=1[v][a]')
os.makedirs('out/ass', exist_ok=True)
open(f'out/ass/{p}-gancho2.txt', 'w').write(';\n'.join(g))
r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', orig, '-i', masc, '-/filter_complex', f'out/ass/{p}-gancho2.txt',
                    '-map', '[v]', '-map', '[a]', '-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '18', '-g', '15', '-bf', '0',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-f', 'mp4', f'{d}/bruto.tmp'])
if r.returncode == 0: os.replace(f'{d}/bruto.tmp', f'{d}/bruto.mov'); print(p, 'gancho2 ok')
else: print(p, 'ERRO'); sys.exit(1)
