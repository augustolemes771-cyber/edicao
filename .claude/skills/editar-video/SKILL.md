---
name: editar-video
description: Edita vídeos do canal Mateus Dias (@ddiasmatt) neste projeto Remotion. No horizontal (YouTube) usa a identidade do canal em preto, branco e #00A8A3, com grade curva, estrela, moldura "Passo" e a curva de intensidade. No vertical (Reels, Shorts, TikTok) usa a legenda palavra por palavra e os efeitos das referências desmontadas. Recebe o vídeo decupado, transcreve, corta as notas faladas, escreve as cenas sincronizadas por palavra, confere, gera a prévia e renderiza em 4K com -14 LUFS. Use quando pedirem para animar, editar ou finalizar um vídeo, fazer um Reel ou Short, "anima o vídeo do canal", "motion no vídeo", "legenda palavra por palavra", ou mandarem um mp4 para editar. Não use para decupar (cortar o bruto), thumbnail ou criativo de anúncio.
---

ATENÇÃO: siga estas regras. Não invente nem pule etapas. Se houver pedido fora delas, avise antes.

# Editar vídeo (Remotion)

Port da skill `yt-ddiasmatt-animation` para Remotion. O motor está em `src/motor/`, as peças em `src/pecas/` e
cada vídeo em `src/projetos/<nome>/edit.ts`. Os efeitos aprendidos nas referências e a peça que reproduz cada um
estão em `docs/referencias/desmontagem.md`.

## Antes de começar

1. Conferir o pedido: arquivo de origem, formato (horizontal ou vertical), trechos de tela gravada, prazo. Perguntar
   só o que faltar.
2. `npm install` se `node_modules` não existir. Ler `docs/referencias/desmontagem.md` para vídeos verticais.
3. Na nuvem, o render precisa de `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`,
   porque o download do Chrome do Remotion é bloqueado.

## Fluxo

1. **Projeto:** `npm run novo -- <nome>` (ou `--vertical`) e o vídeo decupado em `public/projetos/<nome>/video.mp4`.
2. **Transcrição:** `npm run transcrever -- <nome>`. Usa o Scribe com `ELEVENLABS_API_KEY`; sem a chave, o
   whisper.cpp local (grátis).
3. **Roteiro:** `npm run roteiro -- <nome>` e ler `docs/<nome>/transcript-lines.txt` inteiro. Marcar notas
   faladas, pedidos para a IA, trechos de tela, números falados, nomes, chamadas para a descrição e para se
   inscrever, e a tela final.
4. **Cortar notas faladas** em `cortes`, no tempo original:
   `(o) => [[o.say('abre nota').inicio - 0.15, o.say('fecha nota').fim + 0.2]]`. Cada pedido falado
   ("IA, coloca aqui...") vira tarefa. A nota sai do vídeo, salvo quando ele manda deixar.
5. **Cenas:** escrever `cenas: (b) => [...]` com âncoras `b.at`, `b.say`, `b.tempos` e `b.atsW`. Nunca usar tempo
   digitado à mão. Atenção a palavras repetidas: `b.at('em')` pega a primeira ocorrência; use
   `b.say('em menos')` ou o segundo argumento.
6. **Conferir:** `npm run conferir -- <nome>`: 0 erro de âncora, 0 impacto depois de t2, curva dentro da faixa
   (no horizontal), fundos ~70% grade e ~20% verde.
7. **Olhar:** renderizar stills (`npx remotion still <nome> out/x.jpg --frame=N --scale=0.5`) dos momentos de
   cada cena. Auditar: nada cortado na borda, nada sobre o rosto, nada adiantado à fala, tela gravada livre.
8. **Prévia:** `npm run preview -- <nome>` e enviar `out/<nome>-preview.mp4` para aprovação.
9. **Final:** `npm run render -- <nome>` só depois da aprovação. Sai em 4K, 50 Mbps, -14 LUFS e -1,5 dBTP.

## Vertical (Reels, Shorts, TikTok)

- `formato: 'vertical'`, `verificarCurva: false`, `regraCamera: false`.
- Legenda sempre: `legenda: {estilo: 'palavra' | 'ouro' | 'impacto', enfase: [...]}`. Uma ênfase a cada uma ou duas
  frases, não mais: `serif`, `cor`, `caixa`, `circulo`, `grande`.
- Ritmo das referências: zoom seco em começo de frase a cada 3 a 6 s, `foco` na abertura e na volta das cartelas,
  `flash` ou `chicote` só nas trocas de assunto, uma cartela (`cartao`, `letras`, `kicker`) por ideia-chave.
- A legenda some sozinha durante as cenas com texto próprio.

## it-reelsmaker (vertical)

Skill complementar em `.claude/skills/it-reelsmaker/` (68 KB: ler só a seção do passo, via Grep `^## ` e offset/limit). Dela vêm: transcrição e corte por
áudio (`scripts/transcribe.py`, `speech_mask.py`, `cut.py`), rostos (`faces.py`), recorte (`matte.py`), master −14 LUFS (`master_audio.py`), `patch_render.py` e o checklist §13.
Pipeline §6; referências em `references/` (ler só a do assunto: `pitfalls.md` antes de entregar).

## Regras extras (ler só quando o pedido pedir)

Em `docs/referencias/regras-extras.md`: **horizontal/YouTube** (identidade, curva de intensidade), **texto atrás da pessoa**, **cenários 3D e neon**,
**depoimentos e cortes de conteúdo**. Leia apenas a seção do assunto do pedido, com Grep pelo título; não leia o arquivo inteiro.

## Temas (painel)

Todo vídeo pertence a um tema (`biblioteca/temas/<tema>/`: `tema.json` com a lista de projetos e `aprendizado.md`). Antes de editar,
ler o `aprendizado.md` do tema e seguir. Ao terminar, ou quando o usuário aprovar, reprovar ou corrigir algo, acrescentar uma linha
`- AAAA-MM-DD (projeto): lição` nele. Regra que vale para todos os temas fica nesta skill. Projeto novo entra em `projetos` do `tema.json`.

## Depois da entrega

- Não renderizar de novo sem pedido. Ajuste depois da entrega vai para o código e para esta skill; render novo só
  quando ele pedir o vídeo.
- Correção que ele pedir vira regra nesta skill, com data.
