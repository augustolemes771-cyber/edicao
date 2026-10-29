"""Monta o vídeo base de um projeto a partir de src/projetos/<projeto>/montagem.json (só ffmpeg, sem Remotion).
Uso: python scripts/montar.py <projeto> [--res 540]
Cada segmento vira um clipe 9:16 com a cor do tipo (antes: fria, dessaturada, com grão; escuro: antes mais escuro;
depois: quente e viva). Fotos recebem zoom lento. A música entra inteira; na voz (voz: true) ela abaixa para
musica.abaixar_na_voz e a fala do próprio clipe sobe em voz_volume. Saída: public/projetos/<projeto>/video.mp4
"""
import json
import os
import subprocess
import sys

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
projeto = sys.argv[1]
res = int(sys.argv[sys.argv.index("--res") + 1]) if "--res" in sys.argv else 1080
cfg = json.load(open(os.path.join(raiz, "src", "projetos", projeto, "montagem.json"), encoding="utf8"))
pub = os.path.join(raiz, "public", "projetos", projeto)
tmp = os.path.join(raiz, "out", f"_montar_{projeto}")
os.makedirs(tmp, exist_ok=True)
W, H, FPS = cfg.get("largura", 1080), cfg.get("altura", 1920), cfg.get("fps", 30)
if res != W:
    H, W = int(H * res / W), res

COR = {
    "antes": "eq=saturation=0.35:contrast=1.08:brightness=-0.03,colorbalance=rs=-0.05:bs=0.08,noise=alls=16:allf=t,vignette=PI/5",
    "escuro": "eq=saturation=0.25:contrast=1.1:brightness=-0.2,colorbalance=rs=-0.05:bs=0.08,noise=alls=16:allf=t,vignette=PI/4",
    "depois": "eq=saturation=1.22:contrast=1.07,colorbalance=rs=0.04:bs=-0.04",
}


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        print(r.stderr[-1500:])
        raise SystemExit(f"ffmpeg falhou: {' '.join(cmd[:6])}...")


clipes = []
voz = None
t = 0.0
for i, s in enumerate(cfg["segmentos"]):
    dur = s["dur"]
    out = os.path.join(tmp, f"s{i:02d}.mp4")
    grade = COR[s.get("cor", "depois")]
    # quadros pelo tempo acumulado: cada corte cai na batida certa, sem acumular erro de arredondamento
    q = round((t + dur) * FPS) - round(t * FPS)
    if "foto" in s:
        z0, z1 = s.get("zoom", [1.0, 1.0])
        # cobre 9:16, amplia 2x para o zoompan não tremer e anima o zoom do começo ao fim do clipe
        vf = (f"scale=-2:{H * 2},crop={W * 2}:{H * 2},"
              f"zoompan=z='{z0}+({z1}-{z0})*on/{q}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d={q}:s={W}x{H}:fps={FPS},{grade},format=yuv420p")
        entrada = ["-loop", "1", "-i", os.path.join(pub, s["foto"])]
        extra = []
    else:
        vel = s.get("vel", 1)
        # vel 0,5 = câmera lenta: lê dur*vel s da origem e estica pelo mesmo fator
        vf = (f"setpts=PTS/{vel},fps={FPS},scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},{grade},format=yuv420p")
        entrada = ["-ss", str(s.get("de", 0)), "-t", f"{dur * vel:.4f}", "-i", os.path.join(pub, s["arquivo"])]
        extra = []
        if s.get("voz"):
            voz = (os.path.join(pub, s["arquivo"]), s.get("de", 0), dur, t)
    run(["ffmpeg", "-y", "-v", "error", *entrada, "-vf", vf, "-frames:v", str(q), "-r", str(FPS), "-an",
         "-c:v", "libx264", "-preset", "fast", "-crf", "15", *extra, out])
    clipes.append(out)
    t += dur
    print(f"clipe {i + 1}/{len(cfg['segmentos'])} ok ({dur:.2f}s)", flush=True)

lista = os.path.join(tmp, "lista.txt")
open(lista, "w", encoding="utf8").write("".join(f"file '{c.replace(os.sep, '/')}'\n" for c in clipes))
sem_audio = os.path.join(tmp, "sem_audio.mp4")
run(["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", lista, "-c", "copy", sem_audio])

m = cfg["musica"]
total = t
fade = m.get("saida", 1.4)
filtros, entradas = [], ["-i", sem_audio, "-i", os.path.join(pub, m["arquivo"])]
mus = f"[1:a]atrim=0:{total:.4f},asetpts=PTS-STARTPTS,volume={m.get('volume', 1)}"
if voz:
    arq, de, dur, ini = voz
    d = m.get("abaixar_na_voz", 0.2)
    mus += f",volume='if(between(t,{ini - 0.05:.3f},{ini + dur + 0.1:.3f}),{d},1)':eval=frame"
    entradas += ["-i", arq]
    filtros.append(f"[2:a]atrim={de}:{de + dur:.4f},asetpts=PTS-STARTPTS,volume={cfg.get('voz_volume', 1.5)},adelay={int(ini * 1000)}|{int(ini * 1000)}[v]")
mus += f",afade=t=out:st={total - fade:.3f}:d={fade}[m]"
filtros.insert(0, mus)
mix = "[m][v]amix=inputs=2:normalize=0:duration=first[a]" if voz else "[m]anull[a]"
filtros.append(mix)
saida = os.path.join(pub, cfg.get("saida", "video.mp4")) if res == cfg.get("largura", 1080) else os.path.join(raiz, "out", f"{projeto}-base-{res}.mp4")
run(["ffmpeg", "-y", "-v", "error", *entradas, "-filter_complex", ";".join(filtros), "-map", "0:v", "-map", "[a]",
     "-c:v", "copy", "-c:a", "aac", "-b:a", "256k", "-t", f"{total:.4f}", saida])
print("pronto:", saida, f"({total:.2f}s)")
