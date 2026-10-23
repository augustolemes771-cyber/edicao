"""Recorte fino da pessoa (fios de cabelo) com RobustVideoMatting em ONNX.

Melhor que o MediaPipe nas bordas do cabelo. O modelo é recorrente: roda alguns segundos antes do
quadro pedido para estabilizar o recorte.
Instalação (uma vez):
    python3.11 -m venv ~/.cache/edicao/venv-rvm
    ~/.cache/edicao/venv-rvm/bin/pip install onnxruntime opencv-python-headless "numpy<2"
    curl -L -o ~/.cache/edicao/rvm.onnx \
      https://github.com/PeterL1n/RobustVideoMatting/releases/download/v1.0.0/rvm_mobilenetv3_fp32.onnx
Vídeo inteiro (WebM com alfa, para o recorte do projeto):
    ~/.cache/edicao/venv-rvm/bin/python scripts/recortar_rvm.py --video <video> <saida.webm>
Uso (um quadro em PNG com alfa):
    ~/.cache/edicao/venv-rvm/bin/python scripts/recortar_rvm.py <video> <segundo> <saida.png>
"""
import os
import sys

import cv2
import numpy as np
import onnxruntime as ort

MODELO = os.path.expanduser(os.environ.get("RVM_MODELO", "~/.cache/edicao/rvm.onnx"))
AQUECIMENTO = 2.0  # segundos rodados antes do quadro


def main():
    if len(sys.argv) < 4:
        sys.exit("Uso: recortar_rvm.py <video> <segundo> <saida.png>")
    video, alvo, saida = sys.argv[1], float(sys.argv[2]), sys.argv[3]
    sessao = ort.InferenceSession(MODELO, providers=["CPUExecutionProvider"])
    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    cap.set(cv2.CAP_PROP_POS_FRAMES, max(0, int((alvo - AQUECIMENTO) * fps)))
    ultimo = int(round(alvo * fps))
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    razao = np.array([0.5], np.float32)
    fgr = alfa = None
    while cap.get(cv2.CAP_PROP_POS_FRAMES) <= ultimo:
        ok, quadro = cap.read()
        if not ok:
            break
        src = cv2.cvtColor(quadro, cv2.COLOR_BGR2RGB).astype(np.float32).transpose(2, 0, 1)[None] / 255
        fgr, alfa, *rec = sessao.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": razao})
    # Cor do primeiro plano estimada pelo modelo: tira o halo da parede clara nas bordas semitransparentes.
    cor = cv2.cvtColor((fgr[0].transpose(1, 2, 0) * 255).clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
    rgba = np.dstack([cor, (alfa[0, 0] * 255).clip(0, 255).astype(np.uint8)])
    cv2.imwrite(saida, rgba)
    print(saida)




def video_inteiro(video, saida):
    """Recorta o vídeo inteiro e grava um WebM VP9 com alfa (mesmo tempo da fonte), para o Remotion."""
    sessao = ort.InferenceSession(MODELO, providers=["CPUExecutionProvider"])
    cap = cv2.VideoCapture(video)
    fps = cap.get(cv2.CAP_PROP_FPS)
    w, h = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)), int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    import subprocess

    ff = subprocess.Popen(
        ["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{w}x{h}", "-r", str(fps), "-i", "-",
         "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p", "-b:v", "4M", "-auto-alt-ref", "0", "-row-mt", "1", saida],
        stdin=subprocess.PIPE,
    )
    rec = [np.zeros([1, 1, 1, 1], np.float32)] * 4
    razao = np.array([0.5], np.float32)
    n = 0
    while True:
        ok, quadro = cap.read()
        if not ok:
            break
        src = cv2.cvtColor(quadro, cv2.COLOR_BGR2RGB).astype(np.float32).transpose(2, 0, 1)[None] / 255
        fgr, alfa, *rec = sessao.run(None, {"src": src, "r1i": rec[0], "r2i": rec[1], "r3i": rec[2], "r4i": rec[3], "downsample_ratio": razao})
        cor = cv2.cvtColor((fgr[0].transpose(1, 2, 0) * 255).clip(0, 255).astype(np.uint8), cv2.COLOR_RGB2BGR)
        a = (alfa[0, 0] * 255).clip(0, 255).astype(np.uint8)
        ff.stdin.write(np.dstack([cor, a]).tobytes())
        n += 1
        if n % 300 == 0:
            print(f"{n} quadros", flush=True)
    ff.stdin.close()
    ff.wait()
    print(f"pronto: {saida} ({n} quadros)")


if __name__ == "__main__":
    # Vídeo inteiro: recortar_rvm.py --video <video> <saida.webm>
    if len(sys.argv) == 4 and sys.argv[1] == "--video":
        video_inteiro(sys.argv[2], sys.argv[3])
    else:
        main()
