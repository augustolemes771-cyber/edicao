# Seções de AD de um roteiro .md (export do Google Docs): título, linhas soltas (headline, ref, EDITOR) e as colunas da tabela.
import re, sys, hashlib
def limpa(x): return re.sub(r'[ \t]+', ' ', x.replace('&#10;', '\n').replace(chr(92), '').replace('**', '')).strip()
def secoes(nome):
    t = open(f'rot/{nome}.md', encoding='utf8').read()
    hs = [(m.start(), m.group()) for m in re.finditer(r'(?m)^#+ .*$|^\*\*AD ?\d+[^\n]*', t)]
    out = []; data = None
    for i, (s, h) in enumerate(hs):
        if h.startswith('#'): data = limpa(h.lstrip('#')); continue
        fim = hs[i + 1][0] if i + 1 < len(hs) else len(t)
        bloco = t[s:fim]
        soltas, cols = [], []
        for l in bloco.split('\n')[1:]:
            if l.startswith('|'):
                c = [limpa(x) for x in l.strip().strip('|').split('|')]
                if all(re.fullmatch(r':?-*:?', x) for x in c): continue
                cols.append(c)
            elif l.strip(): soltas.append(limpa(l))
        out.append(dict(n=len(out), data=data, titulo=limpa(h), soltas=soltas, cols=cols, pos=s))
    return out
if __name__ == '__main__':
    nome = sys.argv[1]; ult = int(sys.argv[2]) if len(sys.argv) > 2 else 16
    S = secoes(nome)
    for s in S[-ult:]:
        print(f"######## [{s['n']}] {s['titulo']}   (seção: {s['data']})")
        for l in s['soltas']: print('  ', l[:400])
        for c in s['cols']:
            if len(c) >= 2:
                print('  COPY:', re.sub(r'\s+', ' ', c[0])[:1500])
                print('  EDITOR:', re.sub(r'\s+', ' ', ' || '.join(c[1:]))[:2500])
            else: print('  ', c[0][:600])
