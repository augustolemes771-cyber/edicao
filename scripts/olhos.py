# Tira a vermelhidão da parte branca dos olhos (esclera) de quem aparece no vídeo, quadro a quadro.
# O MediaPipe Face Mesh acha os olhos e a íris; só os pixels avermelhados de dentro do olho, fora da íris, perdem o
# vermelho (pele, boca e o resto da imagem não mudam). Áudio copiado do original.
#
#   python scripts/olhos.py <entrada.mp4> <saida.mp4> [--forca 0.65]
#   python scripts/olhos.py <entrada.mp4> --teste 12.5,40,70   # grava out/olhos-teste-<t>.jpg (antes | depois) para aprovar
#
# Precisa do Python com mediapipe 0.10.14 e opencv (Python 3.11 deste PC).
import argparse
import json
import os
import subprocess
import sys

import cv2
import mediapipe as mp
import numpy as np

# Contorno de cada olho no Face Mesh (pálpebras) e centro/borda da íris (refine_landmarks).
OLHO_E = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]
OLHO_D = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398]
IRIS = [(468, [469, 470, 471, 472]), (473, [474, 475, 476, 477])]


def info(caminho):
    s = json.loads(subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                            'stream=width,height,r_frame_rate:format=duration', '-of', 'json', caminho]))
    st = s['streams'][0]
    n, d = st['r_frame_rate'].split('/')
    return int(st['width']), int(st['height']), float(n) / float(d), float(s['format']['duration'])


def rostos(quadro, detector, malha):
    """Acha os rostos no quadro inteiro (detector de longo alcance) e roda o Face Mesh num recorte ampliado de cada um:
    no 4K aberto o rosto é pequeno demais para o Face Mesh direto. Devolve os pontos de cada rosto em pixels do quadro."""
    h, w = quadro.shape[:2]
    escala = 1280 / max(w, h)
    pequeno = cv2.cvtColor(cv2.resize(quadro, (int(w * escala), int(h * escala)), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB)
    det = detector.process(pequeno)
    saida = []
    for d in (det.detections or []):
        bb = d.location_data.relative_bounding_box
        cx, cy = (bb.xmin + bb.width / 2) * w, (bb.ymin + bb.height / 2) * h
        lado = max(bb.width * w, bb.height * h) * 1.8
        x0, y0 = int(max(0, cx - lado / 2)), int(max(0, cy - lado / 2))
        x1, y1 = int(min(w, cx + lado / 2)), int(min(h, cy + lado / 2))
        if x1 - x0 < 20 or y1 - y0 < 20:
            continue
        recorte = cv2.resize(quadro[y0:y1, x0:x1], (384, 384), interpolation=cv2.INTER_CUBIC)
        res = malha.process(cv2.cvtColor(recorte, cv2.COLOR_BGR2RGB))
        for rosto in (res.multi_face_landmarks or [])[:1]:
            saida.append(np.array([[x0 + p.x * (x1 - x0), y0 + p.y * (y1 - y0)] for p in rosto.landmark], dtype=np.float32))
    return saida


def corrigir(quadro, detector, malha, forca):
    """Corrige o quadro (BGR, no lugar) e devolve quantos olhos tratou."""
    h, w = quadro.shape[:2]
    tratados = 0
    for pts in rostos(quadro, detector, malha):
        for contorno, (centro, borda) in zip([OLHO_E, OLHO_D], IRIS):
            poli = pts[contorno].astype(np.int32)
            x0, y0 = np.maximum(poli.min(axis=0) - 6, 0)
            x1, y1 = np.minimum(poli.max(axis=0) + 6, [w - 1, h - 1])
            if x1 - x0 < 8 or y1 - y0 < 4:
                continue
            mascara = np.zeros((y1 - y0, x1 - x0), np.float32)
            cv2.fillPoly(mascara, [poli - [x0, y0]], 1.0)
            c = pts[centro] - [x0, y0]
            r = float(np.mean(np.linalg.norm(pts[borda] - pts[centro], axis=1))) * 1.08
            cv2.circle(mascara, (int(c[0]), int(c[1])), max(1, int(r)), 0.0, -1)
            mascara = cv2.GaussianBlur(mascara, (0, 0), 1.2)
            reg = quadro[y0:y1, x0:x1].astype(np.float32)
            b, g, rr = reg[..., 0], reg[..., 1], reg[..., 2]
            media = (g + b) / 2
            # Só o que é avermelhado (vermelho acima do verde/azul) e claro o bastante para ser esclera.
            excesso = np.clip(rr - media - 8, 0, None)
            claro = np.clip((reg.mean(axis=2) - 60) / 60, 0, 1)
            reg[..., 2] = rr - excesso * forca * mascara * claro
            quadro[y0:y1, x0:x1] = np.clip(reg, 0, 255).astype(np.uint8)
            tratados += 1
    return tratados


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('entrada')
    ap.add_argument('saida', nargs='?')
    ap.add_argument('--forca', type=float, default=0.65)
    ap.add_argument('--teste', help='tempos em segundos separados por vírgula: só grava imagens antes | depois')
    a = ap.parse_args()
    w, h, fps, dur = info(a.entrada)
    detector = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=0.5)
    malha = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True,
                                            min_detection_confidence=0.4)
    if a.teste:
        os.makedirs('out', exist_ok=True)
        for t in [float(x) for x in a.teste.split(',')]:
            cap = cv2.VideoCapture(a.entrada)
            cap.set(cv2.CAP_PROP_POS_MSEC, t * 1000)
            ok, q = cap.read()
            cap.release()
            if not ok:
                print(f'{t}: não li o quadro')
                continue
            antes = q.copy()
            n = corrigir(q, detector, malha, a.forca)
            # Recorte em volta dos olhos para dar para ver a diferença.
            recortes = []
            for pts in rostos(antes, detector, malha):
                olhos = pts[OLHO_E + OLHO_D]
                x0, y0 = np.maximum(olhos.min(axis=0) - 40, 0).astype(int)
                x1, y1 = np.minimum(olhos.max(axis=0) + 40, [w, h]).astype(int)
                par = np.hstack([antes[y0:y1, x0:x1], q[y0:y1, x0:x1]])
                recortes.append(cv2.resize(par, (900, int(900 * par.shape[0] / par.shape[1]))))
            if recortes:
                cv2.imwrite(f'out/olhos-teste-{t:g}.jpg', np.vstack(recortes), [cv2.IMWRITE_JPEG_QUALITY, 88])
            print(f'{t}: {n} olho(s) tratado(s) -> out/olhos-teste-{t:g}.jpg')
        return
    if not a.saida:
        sys.exit('Informe o arquivo de saída')
    leitor = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', a.entrada, '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-'], stdout=subprocess.PIPE)
    escritor = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'bgr24', '-s', f'{w}x{h}', '-r', f'{fps}',
                                 '-i', '-', '-i', a.entrada, '-map', '0:v', '-map', '1:a?', '-c:v', 'h264_nvenc', '-preset', 'p5',
                                 '-cq', '18', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', a.saida], stdin=subprocess.PIPE)
    tam = w * h * 3
    total = int(dur * fps)
    feitos = 0
    while True:
        dados = leitor.stdout.read(tam)
        if len(dados) < tam:
            break
        q = np.frombuffer(dados, np.uint8).reshape(h, w, 3).copy()
        corrigir(q, detector, malha, a.forca)
        escritor.stdin.write(q.tobytes())
        feitos += 1
        if feitos % 150 == 0:
            print(json.dumps({'fase': 'tirando a vermelhidão dos olhos', 'pct': round(100 * feitos / max(total, 1))}), flush=True)
    escritor.stdin.close()
    leitor.wait()
    if escritor.wait() != 0:
        sys.exit('O ffmpeg falhou ao gravar o vídeo')
    print(f'Pronto: {feitos} quadros em {a.saida}')


if __name__ == '__main__':
    main()
