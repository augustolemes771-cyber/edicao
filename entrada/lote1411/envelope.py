# Envelope de energia (dB, janelas de 40 ms) de um arquivo entre a e b.  Uso: envelope.py arq a b
import subprocess, sys, numpy as np
f, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a), '-t', str(b - a), '-i', f, '-ac', '1', '-ar', '16000', '-f', 's16le', '-'], capture_output=True).stdout
x = np.frombuffer(raw, np.int16).astype(float) / 32768
n = 640
for i in range(0, len(x) - n, n):
    db = 20 * np.log10(np.sqrt(np.mean(x[i:i + n] ** 2)) + 1e-9)
    print(f'{a + i / 16000:7.2f} {db:6.1f} ' + '#' * max(0, int((db + 60) / 2)))
