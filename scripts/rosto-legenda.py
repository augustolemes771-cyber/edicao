# Mede o queixo (parte de baixo do rosto) 4x por segundo no vídeo bruto e grava src/projetos/<p>/rosto.json, para o
# montar-ads pôr a legenda logo abaixo do rosto quando a câmera está perto (pedido do usuário, 12/11: a legenda tampava a
# cara nas gravações de perto). Valores em 1080x1920; null = sem rosto naquele quadro.
# Uso: python scripts/rosto-legenda.py <projeto> [<projeto> ...]
import json, os, subprocess, sys
import cv2
import numpy as np

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(raiz)
MODELO = os.path.join(os.path.expanduser('~'), '.cache', 'edicao', 'face_detection_yunet_2023mar.onnx')
if not os.path.exists(MODELO):
    import urllib.request
    urllib.request.urlretrieve('https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx', MODELO)
L, A, PASSO = 270, 480, 0.25
det = cv2.FaceDetectorYN_create(MODELO, '', (L, A), 0.6)

for proj in sys.argv[1:]:
    fonte = next(f for f in (f'public/projetos/{proj}/bruto.mov', f'public/projetos/{proj}/video.mp4') if os.path.exists(f))
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', fonte, '-vf', f'fps={1 / PASSO:g},scale={L}:{A}', '-f', 'rawvideo',
                          '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    queixo, n = [], L * A * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n: break
        _, f = det.detect(np.frombuffer(b, dtype='uint8').reshape(A, L, 3))
        if f is not None and len(f):
            x, y, w, h = max(f, key=lambda r: r[2] * r[3])[:4]
            queixo.append(round(float(y + h) * 1920 / A))
        else:
            queixo.append(None)
    p.wait()
    json.dump({'passo': PASSO, 'queixo': queixo}, open(f'src/projetos/{proj}/rosto.json', 'w'))
    v = [q for q in queixo if q]
    print(f'{proj}: {len(queixo)} quadros, rosto em {len(v)}; queixo mediano {sorted(v)[len(v) // 2] if v else "-"}')
