# Gancho em tela dividida como a ref ssstik.io_1795281074632 (roteiro Lorena 22.11 AD 05-07, pedido do usuário 24/11):
# esquerda = Lorena em pé falando a queixa (olhando para o lado, espelhada para olhar para a direita);
# direita = Lorena sentada, parada enquanto a da esquerda fala, e respondendo ("Mounjarin Psyllium" + comprimido no copo)
# logo depois. Cada par vira 2 fases: Q (fala a da esquerda; a da direita mostra os quadros dela logo antes da resposta) e
# R (fala a da direita; a da esquerda continua depois da queixa, ouvindo). O resto do bruto segue em tela cheia.
# Gera public/projetos/<p>/bruto.mov (o bruto original fica em bruto-original.mov).
# Uso: python entrada/lote2411/gancho.py <projeto>   (pares e recortes em entrada/lote2411/gancho-<projeto>.json)
import json, os, subprocess, sys
os.chdir(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
p = sys.argv[1]
cfg = json.load(open(f'entrada/lote2411/gancho-{p}.json', encoding='utf8'))
d = f'public/projetos/{p}'
orig = f'{d}/bruto-original.mov'
if not os.path.exists(orig): os.replace(f'{d}/bruto.mov', orig)
pares = cfg['pares']            # [[qa, qb, ra, rb(, oa, ob)], ...] em segundos do bruto; oa-ob = trecho dela de perfil calada para
                                # a esquerda "ouvir" a resposta (completa congelando o último quadro)
xe, xd = cfg['xEsq'], cfg['xDir']  # centro (px no quadro 1080) do recorte de cada lado
resto = cfg['resto']            # segundo do bruto onde volta a tela cheia
flip = ',hflip' if cfg.get('espelhar', True) else ''
S = 'scale=1080:1920,setsar=1'
def lado(x): return f'crop=540:1920:{max(0, min(540, int(x - 270)))}:0'
g, n = [], 0
pv, pa = [], []
ant_rb = cfg.get('dirDesde', 0)  # a direita não usa quadros antes disto (ela ainda indo sentar)
for i, par in enumerate(pares):
    qa, qb, ra, rb = par[:4]
    dq, dr = qb - qa, rb - ra
    prox_qa = pares[i + 1][0] if i + 1 < len(pares) else 1e9
    # direita parada na fase Q: os quadros logo antes da resposta (sem voltar para antes da resposta anterior)
    da = max(ant_rb, ra - dq); fr = dq - (ra - da); dfim = ra
    if len(par) >= 8: da, dfim = par[6], min(par[7], par[6] + dq); fr = dq - (dfim - da)  # direita parada noutro trecho
    ea = qb; eb = min(qb + dr, prox_qa)  # esquerda ouvindo na fase R (sem entrar na próxima queixa)
    if len(par) >= 6: ea, eb = par[4], min(par[5], par[4] + dr)
    for nome, (a, b, x, extra, pad) in {
        f'qe{i}': (qa, qb, xe, flip, 0), f'qd{i}': (da, dfim, xd, '', fr),
        f're{i}': (ea, eb, xe, flip, dr - (eb - ea)), f'rd{i}': (ra, rb, xd, '', 0)}.items():
        pd = f',tpad=start_duration={pad:.3f}:start_mode=clone' if nome.startswith('qd') and pad > 0.01 else \
             (f',tpad=stop_duration={pad:.3f}:stop_mode=clone' if pad > 0.01 else '')
        if nome.startswith('re') and cfg.get('ouvirVaiVem') and pad > 0.01:
            # trecho de perfil curto: vai e volta (sem congelar) até cobrir a resposta
            nq = max(2, round((b - a) * 30))
            g.append(f'[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS,{S},{lado(x)}{extra},fps=30,split[{nome}f][{nome}r0];[{nome}r0]reverse[{nome}r];'
                     f'[{nome}f][{nome}r]concat=n=2:v=1:a=0,loop=loop=20:size={2 * nq}:start=0,trim=duration={dr:.3f},setpts=PTS-STARTPTS[{nome}]')
            continue
        g.append(f'[0:v]trim={a:.3f}:{b:.3f},setpts=PTS-STARTPTS,{S},{lado(x)}{extra}{pd}[{nome}]')
    g.append(f'[qe{i}][qd{i}]hstack[q{i}];[re{i}][rd{i}]hstack[r{i}]')
    g.append(f'[0:a]atrim={qa:.3f}:{qb:.3f},asetpts=PTS-STARTPTS[aq{i}];[0:a]atrim={ra:.3f}:{rb:.3f},asetpts=PTS-STARTPTS[ar{i}]')
    pv += [f'[q{i}]', f'[r{i}]']; pa += [f'[aq{i}]', f'[ar{i}]']
    ant_rb = rb
g.append(f'[0:v]trim=start={resto:.3f},setpts=PTS-STARTPTS,{S}[vz];[0:a]atrim=start={resto:.3f},asetpts=PTS-STARTPTS[az]')
seq = ''.join(v + a for v, a in zip(pv + ['[vz]'], pa + ['[az]']))
g.append(f'{seq}concat=n={len(pv) + 1}:v=1:a=1[vc][a];[vc]fps=30,format=yuv420p[v]')
open(f'out/ass/{p}-gancho.txt', 'w').write(';\n'.join(g))
r = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', orig, '-/filter_complex', f'out/ass/{p}-gancho.txt',
                    '-map', '[v]', '-map', '[a]', '-c:v', 'h264_nvenc', '-preset', 'p5', '-cq', '18', '-g', '15', '-bf', '0',
                    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-f', 'mp4', f'{d}/bruto.tmp'])
if r.returncode == 0: os.replace(f'{d}/bruto.tmp', f'{d}/bruto.mov'); print(p, 'gancho ok')
else: print(p, 'ERRO'); sys.exit(1)
