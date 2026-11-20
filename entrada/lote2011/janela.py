# Palavras com tempo numa janela: python janela.py <p> <de> <ate>
import json, sys
p, a, b = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
W = [w for w in json.load(open(f'../../src/projetos/{p}/transcricao.json', encoding='utf8')) if w['text'].strip()]
print(p, ' '.join(f"{w['startMs']/1000:.2f}|{w['text'].strip()}" for w in W if a <= w['startMs'] / 1000 <= b))
