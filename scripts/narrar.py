# Gera a narração de um roteiro com voz neural grátis (edge-tts) e a transcrição com o tempo EXATO de cada palavra
# (WordBoundary da própria voz: legenda e efeitos colados na fala, sem depender do Whisper).
# Uso: python scripts/narrar.py <roteiro.txt> <saida.mp3> <transcricao.json> [voz] [velocidade]
import asyncio, json, re, sys
import edge_tts

async def main():
    roteiro, mp3, js = sys.argv[1:4]
    voz = sys.argv[4] if len(sys.argv) > 4 else 'pt-BR-AntonioNeural'
    vel = sys.argv[5] if len(sys.argv) > 5 else '+12%'
    texto = ' '.join(l.strip() for l in open(roteiro, encoding='utf-8') if l.strip())
    com = edge_tts.Communicate(texto, voz, rate=vel, boundary='WordBoundary')
    palavras = []
    with open(mp3, 'wb') as f:
        async for ch in com.stream():
            if ch['type'] == 'audio':
                f.write(ch['data'])
            elif ch['type'] == 'WordBoundary':
                ini = ch['offset'] / 10_000
                palavras.append({'text': ch['text'], 'startMs': round(ini), 'endMs': round(ini + ch['duration'] / 10_000), 'timestampMs': None, 'confidence': 1})
    # A pontuação não vem na palavra: devolve a do roteiro (vírgula, ponto, interrogação) para a legenda e as âncoras.
    tokens = texto.split()
    limpa = lambda x: re.sub(r'[^\w%]', '', x.lower())
    j = 0
    for p in palavras:
        achou = None
        for k in range(j, min(j + 5, len(tokens))):
            if limpa(tokens[k]) == limpa(p['text']):
                achou = k
                break
        if achou is not None:
            p['text'] = ' ' + tokens[achou]
            j = achou + 1
        else:
            p['text'] = ' ' + p['text']
    json.dump(palavras, open(js, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'{len(palavras)} palavras, {palavras[-1]["endMs"]/1000:.1f} s')

asyncio.run(main())
