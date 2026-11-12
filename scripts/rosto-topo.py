# Mede onde fica o rosto da criadora nos trechos de tela dividida e grava "rostoY" no plano-ad.json (centro do rosto, em
# 1080x1920). O montar-ads usa para recortar a metade de baixo centralizada no rosto (pedido do usuário, 12/11: o rosto
# ficava baixo e cortado com o recorte fixo).
# Uso: python scripts/rosto-topo.py <projeto> [<projeto> ...]
import json, os, statistics, subprocess, sys
import cv2

raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(raiz)
# YuNet (opencv_zoo, 232 KB) em ~/.cache/edicao: o OpenCV 5 deste PC não tem mais o Haar.
MODELO = os.path.join(os.path.expanduser('~'), '.cache', 'edicao', 'face_detection_yunet_2023mar.onnx')
if not os.path.exists(MODELO):
    import urllib.request
    urllib.request.urlretrieve('https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx', MODELO)
det = cv2.FaceDetectorYN_create(MODELO, '', (540, 960), 0.7)

def quadro(fonte, t):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', fonte, '-frames:v', '1', '-vf', 'scale=540:960',
                        '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], capture_output=True)
    if len(r.stdout) != 540 * 960 * 3: return None
    import numpy as np
    return np.frombuffer(r.stdout, dtype='uint8').reshape(960, 540, 3)

for proj in sys.argv[1:]:
    arq = f'src/projetos/{proj}/plano-ad.json'
    plano = json.load(open(arq, encoding='utf-8'))
    fonte = next(f for f in (f'public/projetos/{proj}/bruto.mov', f'public/projetos/{proj}/video.mp4') if os.path.exists(f))
    faixas = [(it['de'], it['ate']) for k in ('split', 'fotos', 'produto') for it in plano.get(k, [])
              if k == 'split' or it.get('modo', 'topo') == 'topo']
    if not faixas:
        print(f'{proj}: sem tela dividida'); continue
    ys = []
    for a, b in faixas:
        n = max(2, int((b - a) / 0.7))
        for i in range(n):
            g = quadro(fonte, a + (b - a) * (i + 0.5) / n)
            if g is None: continue
            _, f = det.detect(g)
            if f is not None and len(f):
                x, y, w, h = max(f, key=lambda r: r[2] * r[3])[:4]
                ys.append((y + h / 2) * 2)  # 960 -> 1920
    if not ys:
        print(f'{proj}: nenhum rosto achado, mantém o recorte padrão'); continue
    plano['rostoY'] = round(statistics.median(ys))
    json.dump(plano, open(arq, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{proj}: rostoY {plano["rostoY"]} ({len(ys)} quadros com rosto)')
