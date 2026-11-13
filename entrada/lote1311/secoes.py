import re,sys,json
def secoes(nome):
    t=open(f'{nome}.txt',encoding='utf-8').read()
    hs=[(m.start(),m.group()) for m in re.finditer(r'(?m)^#+ .*$|\*\*AD ?\d+\s*-?\*\*[^\n]*',t)]
    out=[];data=None
    for i,(s,h) in enumerate(hs):
        if h.startswith('#'):
            data=re.search(r'\d\d/\d\d',h); data=data.group() if data else h; continue
        fim=hs[i+1][0] if i+1<len(hs) else len(t)
        ad=int(re.search(r'AD ?(\d+)',h).group(1))
        out.append(dict(data=data,ad=ad,titulo=h.replace('*','').replace(chr(92),'').strip(),texto=t[s:fim]))
    return out
def limpa(x):
    x=x.replace('&#10;','\n').replace(chr(92),'')
    return re.sub(r'\*\*','',x)
if __name__=='__main__':
    nome,data,ad=sys.argv[1],sys.argv[2],int(sys.argv[3])
    for s in secoes(nome):
        if s['data']==data and s['ad']==ad:
            tx=limpa(s['texto'])
            print(tx)
