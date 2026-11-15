import re,sys
n,a,b=sys.argv[1],int(sys.argv[2]),int(sys.argv[3])
t=open(f'entrada/lote1411/{n}.txt',encoding='utf-8').read()[a:b]
t=t.replace('&#10;','\n').replace(chr(92),'')
t=re.sub(r'!\[[^\]]*\]\([^)]*\)','[IMG]',t)
t=re.sub(r'data:image\S*','',t)
t=re.sub(r'\n\s*\n+','\n',t)
print(t)
