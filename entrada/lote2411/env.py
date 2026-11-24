# Envelope de energia (dB, janelas de 50 ms) e trechos de fala acima de (pico do trecho - X dB).
import subprocess, sys, numpy as np
p, a, b, X = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]) if len(sys.argv) > 4 else 22
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', f'public/projetos/{p}/bruto.mov', '-ac', '1', '-ar', '16000',
                      '-af', 'highpass=f=120', '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(float)
n = 800; m = len(x) // n
db = 20 * np.log10(np.sqrt((x[:m * n].reshape(m, n) ** 2).mean(1)) + 1)
lim = np.percentile(db, 98) - X
on = db > lim
seg = []; i = 0
while i < m:
    if on[i]:
        j = i
        while j < m and (on[j:j + 6].any()): j += 1  # junta buracos < 0,3 s
        seg.append((a + i * .05, a + j * .05)); i = j
    else: i += 1
print(f'lim {lim:.1f} dB:', ' '.join(f'[{s:.2f}-{e:.2f}]' for s, e in seg if e - s > 0.15))
