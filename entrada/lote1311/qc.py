# Folha de conferência: 5 quadros por AD (início, B-roll/split 1, meio, B-roll 2, fim-2s) tirados do out/<p>-final.mp4.
import json, os, subprocess, sys, tempfile
out = sys.argv[1]; ps = sys.argv[2:]; d = tempfile.mkdtemp(); n = 0
for p in ps:
    s = json.load(open(f'out/ass/{p}-trechos.json')); pl = json.load(open(f'src/projetos/{p}/plano-ad.json', encoding='utf-8'))
    def ed(t):
        acc = 0
        for a, b in s:
            if t < a: return acc
            if t <= b: return acc + t - a
            acc += b - a
        return acc
    tot = sum(b - a for a, b in s)
    its = pl.get('split', []) + pl.get('produto', [])
    ts = [1.5] + [(ed(i['de']) + ed(i['ate'])) / 2 for i in its[:1]] + [tot * 0.5] + [(ed(i['de']) + ed(i['ate'])) / 2 for i in its[-1:] if len(its) > 1] + [tot - 2]
    ts = (ts + [tot * 0.3, tot * 0.7])[:5]
    for t in ts:
        n += 1
        subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{t:.2f}', '-i', f'out/{p}-final.mp4', '-frames:v', '1', '-vf',
                        'scale=216:384',
                        '-y', f'{d}/{n:03d}.jpg'])
subprocess.run(['ffmpeg', '-v', 'error', '-i', f'{d}/%03d.jpg', '-vf', f'tile=10x{(n + 9) // 10}', '-frames:v', '1', '-y', out])
print(n, 'quadros ->', out)
