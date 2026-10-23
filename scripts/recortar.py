"""Recorta a pessoa do vídeo, quadro a quadro, e salva public/projetos/<projeto>/pessoa.webm (VP9 com alfa).

Serve para os efeitos de texto atrás da pessoa e troca de fundo (cenas com modo: 'atras').
Usa o MediaPipe Selfie Segmentation, que é grátis e vem com o modelo dentro do pacote (não baixa nada).

Uso (o MediaPipe 0.10.14 pede Python 3.9 a 3.12):
    python3.11 -m venv ~/.cache/edicao/venv-recorte
    ~/.cache/edicao/venv-recorte/bin/pip install mediapipe==0.10.14 opencv-python-headless==4.10.0.84 "numpy<2"
    ~/.cache/edicao/venv-recorte/bin/python scripts/recortar.py <projeto>
"""

import os
import subprocess
import sys

import cv2
import numpy as np
from mediapipe.python.solutions import selfie_segmentation


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit("Uso: python scripts/recortar.py <projeto> [arquivo de vídeo]")
    projeto = sys.argv[1]
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    pasta = os.path.join(raiz, "public", "projetos", projeto)
    entrada = sys.argv[2] if len(sys.argv) > 2 else os.path.join(pasta, "video.mp4")
    saida = os.path.join(pasta, "pessoa.webm")

    cap = cv2.VideoCapture(entrada)
    if not cap.isOpened():
        sys.exit(f"Não consegui abrir {entrada}")
    fps = cap.get(cv2.CAP_PROP_FPS)
    largura = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    altura = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    total = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

    ffmpeg = subprocess.Popen(
        [
            "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgba", "-s", f"{largura}x{altura}", "-r", f"{fps}", "-i", "-",
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-auto-alt-ref", "0",
            "-b:v", "4M", "-deadline", "good", "-cpu-used", "4", "-row-mt", "1", saida,
        ],
        stdin=subprocess.PIPE,
    )

    anterior = None
    with selfie_segmentation.SelfieSegmentation(model_selection=0) as modelo:
        n = 0
        while True:
            ok, quadro = cap.read()
            if not ok:
                break
            rgb = cv2.cvtColor(quadro, cv2.COLOR_BGR2RGB)
            m = modelo.process(rgb).segmentation_mask.astype(np.float32)
            # Suaviza no tempo (menos tremido na borda) e endurece a borda sem serrilhar.
            if anterior is not None:
                m = 0.65 * m + 0.35 * anterior
            anterior = m
            alfa = np.clip((m - 0.3) / 0.4, 0, 1)
            alfa = cv2.GaussianBlur(alfa, (5, 5), 0)
            rgba = np.dstack([rgb, (alfa * 255).astype(np.uint8)])
            ffmpeg.stdin.write(rgba.tobytes())
            n += 1
            if n % 300 == 0:
                print(f"{n}/{total} quadros")
    ffmpeg.stdin.close()
    ffmpeg.wait()
    print(f"Recorte salvo em {os.path.relpath(saida, raiz)} ({n} quadros). No edit.ts: recorte: 'pessoa.webm'")


if __name__ == "__main__":
    main()
