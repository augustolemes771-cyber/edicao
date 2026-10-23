"""Separa as peças (rainha vermelha e peões prateados) do fundo de fumaça escura num vídeo gerado por IA.

Gera, por quadro, o fundo (f_XXXX.jpg) e a frente com alfa (q_XXXX.webp), para o texto entrar entre os dois.
Uso: python scripts/separar_pecas.py <video> <saida_dir> [--velocidade 1.4] [--quadros 46] [--fps 30]
"""
import argparse
import os
import subprocess

import cv2
import numpy as np


def mascara(im):
    hsv = cv2.cvtColor(im, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    luz = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    vermelho = (s > 120) & ((h < 12) | (h > 160)) & (v > 40)
    prata = (luz > 72) & (s < 80)
    m = (vermelho | prata).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    # Preenche os buracos escuros por dentro das peças (sombras e reflexos pretos).
    cont, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    cheia = np.zeros_like(m)
    alt = m.shape[0]
    for c in cont:
        if cv2.contourArea(c) < 400:
            continue
        _, y, _, hc = cv2.boundingRect(c)
        # Peão solto no ar (todo acima do tabuleiro): o lado na sombra some no limiar, então fecha pelo contorno
        # convexo. As peças presas ao tabuleiro ficam com o contorno real (o convexo engoliria o fundo).
        if y + hc < alt * 0.45:
            c = cv2.convexHull(c)
        cv2.drawContours(cheia, [c], -1, 255, -1)
    return cv2.GaussianBlur(cheia, (5, 5), 0)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("video")
    p.add_argument("saida")
    p.add_argument("--velocidade", type=float, default=1.4)
    p.add_argument("--quadros", type=int, default=46)
    p.add_argument("--fps", type=int, default=30)
    a = p.parse_args()
    os.makedirs(a.saida, exist_ok=True)
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", a.video, "-vf", f"setpts=PTS/{a.velocidade},fps={a.fps}",
         "-frames:v", str(a.quadros), "-q:v", "2", os.path.join(a.saida, "f_%04d.jpg")],
        check=True,
    )
    n = 0
    for nome in sorted(os.listdir(a.saida)):
        if not nome.startswith("f_"):
            continue
        im = cv2.imread(os.path.join(a.saida, nome))
        cv2.imwrite(os.path.join(a.saida, "q_" + nome[2:-4] + ".webp"), np.dstack([im, mascara(im)]), [cv2.IMWRITE_WEBP_QUALITY, 92])
        n += 1
    print(f"{n} quadros em {a.saida}")


if __name__ == "__main__":
    main()
