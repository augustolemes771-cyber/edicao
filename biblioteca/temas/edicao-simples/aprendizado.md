# Aprendizado: edicao simples

Regras aprendidas nos vídeos deste tema. O Claude lê isto antes de editar e acrescenta uma linha datada quando o usuário aprova ou corrige algo.

- 2026-11-04 (teste): foco do tema é velocidade (entrega em minutos). Headline da referência fica só 5 s, no layout da referência: texto branco centralizado no topo (~17%) e imagem logo abaixo, à direita do centro. Legenda `caixa` (caixa alta branca, contorno preto, caixa vermelha na palavra falada, 2 por tela).
- 2026-11-04 (teste): cortes pela fala do Scribe (respiro > 0,23 s sai, 0,07 s depois / 0,05 s antes), sem `silencios` quando a sala tem eco (o encaixe desfazia os cortes).
- 2026-11-04 (teste): no PC de 7 GB o render-job caiu com "write EOF"/ENOMEM; render direto funcionou: `npx remotion render <p> out/<p>-1080.mp4 --concurrency=4 --hardware-acceleration=if-possible --video-bitrate=12M --offthreadvideo-cache-size-in-bytes=268435456`.
- 2026-11-04 (ad-03): entrega em ≤3 min → montar só no ffmpeg/NVENC (`node scripts/rapido-ad03.mjs`: cortes + legenda ASS em tarja + overlays, ~25 s). Remotion leva ~10 min neste PC e, com cache de vídeo de 256 MB, perdeu quadros depois de ~50 s (imagem a "5 fps").
- 2026-11-04 (ad-03): tela dividida: o vídeo de cima não pode ir no mesmo arquivo da criadora antes dos cortes (pula a cada corte); B-roll sem link → baixar foto qualquer do produto e seguir, sem perguntar.
- 2026-11-10 (teste22): REGRA DO USUÁRIO: seguir estritamente o roteiro. Só cortes, legenda e as edições que o roteiro pedir; não acrescentar efeitos, cartelas, zoom, B-roll ou qualquer coisa não pedida, e não mudar nada no vídeo além do que foi pedido. Vale mais que "ritmo frenético" e "criatividade com sentido" das preferências do painel. Imagens de produto só se o roteiro pedir (pasta de produtos no Drive).
