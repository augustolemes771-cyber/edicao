"""Máscara da pessoa (branco = criadora, preto = fundo) quadro a quadro do bruto, para o "fundo" do montar-ads
(criadora recortada na frente de um vídeo de fundo, pedido do roteiro "nossa criadora na frente e esse vídeo de fundo").
Sai em public/projetos/<p>/mascara.mp4, com a mesma taxa e duração do bruto (o montar-ads aplica nela os mesmos cortes).
Usa o MediaPipe Selfie Segmentation (grátis, modelo embutido).

Uso: ~/.cache/edicao/venv-recorte/Scripts/python scripts/mascara.py <projeto> [--de s --ate s]
  --de/--ate: só calcula nesse trecho do bruto (fora dele a máscara fica preta), para ir mais rápido.
"""
import os
import subprocess
import sys

import cv2
import numpy as np
from mediapipe.python.solutions import selfie_segmentation

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
proj = args[0]
opc = lambda n, p: float(args[args.index(n) + 1]) if n in args else p
de, ate = opc('--de', 0), opc('--ate', 1e9)
pasta = os.path.join(raiz, 'public', 'projetos', proj)
fonte = os.path.join(pasta, 'bruto.mov')
cap = cv2.VideoCapture(fonte)
fps = cap.get(cv2.CAP_PROP_FPS) or 30
W, H = 540, 960
saida = os.path.join(pasta, 'mascara.mp4')
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '16', '-pix_fmt', 'yuv420p', saida], stdin=subprocess.PIPE)
preto = np.zeros((H, W), np.uint8)
ant = None
n = 0
with selfie_segmentation.SelfieSegmentation(model_selection=0) as seg:
    while True:
        ok, q = cap.read()
        if not ok:
            break
        t = n / fps
        n += 1
        if not (de - 0.5 <= t <= ate + 0.5):
            ff.stdin.write(preto.tobytes())
            continue
        q = cv2.resize(q, (W, H))
        m = seg.process(cv2.cvtColor(q, cv2.COLOR_BGR2RGB)).segmentation_mask
        if ant is not None:
            m = 0.6 * m + 0.4 * ant  # suaviza a borda entre quadros (menos tremida)
        ant = m
        a = np.clip((m - 0.35) / 0.3, 0, 1)  # borda macia
        a = cv2.GaussianBlur((a * 255).astype(np.uint8), (5, 5), 0)
        ff.stdin.write(a.tobytes())
ff.stdin.close()
ff.wait()
print(f'{proj}: máscara de {n} quadros ({n / fps:.1f} s) -> {saida}')
