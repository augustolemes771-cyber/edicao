# Para cada AD: texto que ficou no vídeo final (palavras dentro dos trechos), duração vídeo x áudio, trechos de produto e mudos.
import json, subprocess, sys
for p in sys.argv[1:]:
    s = json.load(open(f'out/ass/{p}-trechos.json'))
    W = [w for w in json.load(open(f'src/projetos/{p}/transcricao.json', encoding='utf-8')) if w['text'].strip()]
    dentro = lambda t: any(a - 0.02 <= t <= b + 0.02 for a, b in s)
    fica = [w['text'].strip() for w in W if dentro((w['startMs'] + w['endMs']) / 2000)]
    sai = [w['text'].strip() for w in W if not dentro((w['startMs'] + w['endMs']) / 2000)]
    pr = lambda st: subprocess.run(['ffprobe', '-v', 'error', '-select_streams', st, '-show_entries', 'stream=duration', '-of', 'csv=p=0', f'out/{p}-final.mp4'], capture_output=True, text=True).stdout.strip()
    print(f'==== {p}: vídeo {pr("v:0")} s, áudio {pr("a:0")} s')
    print('FICA:', ' '.join(fica))
    print('SAI :', ' | '.join(sai) or '-')
