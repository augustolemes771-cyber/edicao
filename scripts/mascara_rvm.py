"""Máscara fina da pessoa (alfa do RobustVideoMatting: fios de cabelo, sem buracos nem pedaços do cenário) quadro a quadro.
Mesmo formato de saída do scripts/mascara.py (public/projetos/<p>/mascara.mp4, cinza, mesma taxa e duração do bruto),
mas em 1080x1920 e com o modelo recorrente (estável de um quadro para o outro). Usado no gancho com a pessoa recortada
(CORREÇÃO DO USUÁRIO 24/11: "melhore o recorte que ainda está tendo falhas no cenário").
Instalação (uma vez): pip install onnxruntime no venv-recorte e
  curl -L -o ~/.cache/edicao/rvm.onnx https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx
Uso: ~/.cache/edicao/venv-recorte/Scripts/python scripts/mascara_rvm.py <projeto> [--razao 0.4]
"""
import os
import subprocess
import sys

import cv2
import numpy as np
import onnxruntime as ort

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
args = sys.argv[1:]
proj = args[0]
razao = float(args[args.index('--razao') + 1]) if '--razao' in args else 0.4
pasta = os.path.join(raiz, 'public', 'projetos', proj)
cap = cv2.VideoCapture(os.path.join(pasta, 'bruto.mov'))
fps = cap.get(cv2.CAP_PROP_FPS) or 30
W, H = 1080, 1920
sessao = ort.InferenceSession(os.path.expanduser('~/.cache/edicao/rvm.onnx'), providers=['CPUExecutionProvider'])
saida = os.path.join(pasta, 'mascara.mp4')
ff = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'gray', '-s', f'{W}x{H}', '-r', str(fps), '-i', '-',
                       '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '12', '-pix_fmt', 'yuv420p', saida], stdin=subprocess.PIPE)
rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
dr = np.array([razao], np.float32)
n = 0
while True:
    ok, q = cap.read()
    if not ok: break
    if q.shape[1] != W or q.shape[0] != H: q = cv2.resize(q, (W, H), interpolation=cv2.INTER_AREA)
    src = (cv2.cvtColor(q, cv2.COLOR_BGR2RGB).astype(np.float32) / 255).transpose(2, 0, 1)[None]
    fgr, pha, *rec = sessao.run(None, {'src': src, 'r1i': rec[0], 'r2i': rec[1], 'r3i': rec[2], 'r4i': rec[3], 'downsample_ratio': dr})
    a = pha[0, 0]
    # limpa o "véu" fraco do cenário e fecha a pessoa: abaixo de 0,08 vira 0, acima de 0,92 vira 1 (borda do cabelo continua suave)
    a = np.clip((a - 0.08) / 0.84, 0, 1)
    ff.stdin.write((a * 255 + 0.5).astype(np.uint8).tobytes())
    n += 1
    if n % 300 == 0: print(f'{proj}: {n} quadros', flush=True)
ff.stdin.close(); ff.wait()
print(f'{proj}: máscara RVM de {n} quadros ({n / fps:.1f} s) -> {saida}')
