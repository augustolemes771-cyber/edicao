# Modelo de entrevista: WhatsApp Video 2026-10-27 at 14.42.56 (1)

É o **master 1080×1920** do mesmo reel analisado em `danilowtts_1793055302_4016759772891511112_244833093.md` (aquele era a cópia
720p baixada da rede) e a versão final do guia `IMG_5157-v4b.md`. Na resolução cheia dá para medir detalhes que a cópia escondia:
transição por desfoque, rótulo do falante, pílula da palavra ativa na legenda e a curva do contador. Análise de 28/10/2026:
`npm run analisar-referencia` (ffprobe, cena > 0,3, picos de som, folhas de quadros, visão geral a 1 quadro/2 s) e
`scripts/transcrever.mjs` (whisper.cpp, palavra por palavra). Evidências em `out/analise-wa1/`.

## Ficha e arco
- 48,9 s, 1080×1920 (9:16), 30 fps, com áudio. 191 palavras em ~45,9 s de fala ≈ **4,2 palavras/s** (sem pausa morta).
- Cortes (cena > 0,3): 2,7 · 5,4 · 8,87 · 14,53 · 17,17 · 17,43 · 26,0 · 27,6 · 32,5 · 34,13 · 38,33 · 38,37 · 45,9 s →
  13 cortes = **16/min**, plano médio **~3,5 s** (contando também cartões cheios e transições). Trocas reais de câmera: ~10/min.
- 38 eventos visuais/sonoros em 49 s ≈ **0,8 evento/s** (um a cada ~1,3 s); no gancho, 4 eventos em 2,7 s.
- Arco: **gancho-promessa** 0–2,7 → **pergunta 1** 2,7–5,4 → **resposta 1 (vídeo)** 5,4–14,5 → **pergunta 2** 14,5–17,2 →
  **resposta 2 (live)** 17,2–26 → **re-gancho duelo** 26–27,6 → **síntese** 27,6–38,3 → **CTA** 38,3–45,9 → **cartão final** 45,9–48,9.

## Edição

### Ritmo
- Gancho mais denso (evento a cada ~0,6 s: contador subindo, clarão, moedas). Respostas: um elemento novo a cada 1,5–3 s.
- CTA é o trecho mais calmo: plano aberto fixo com os três, só as pílulas e a caixa de comentário mudando.

### Enquadramento e zoom
- Câmera na mão, luz do dia, praia. Pergunta em plano aberto com dois (entrevistador + convidado); resposta em médio/close do
  convidado com o braço e o microfone do entrevistador entrando pela lateral; CTA aberto com os três.
- Zoom digital curto em ciclo aberto → médio → close; punch-in na palavra forte (ex.: "fácil", "simples").
- Transições: **chicote** na troca de falante (14,5 / 17,2 / 38,3 s, quadros duplos de corte = whip), **desfoque** (rack focus
  falso, ~0,3 s) ao entrar no close da convidada em 34,1 s, **clarão branco** só no gancho (~1,4 s) e em "os dois funcionam" (27,6 s).

### Tipos de tela e cartelas (tempos)
| Tempo | Elemento | Gatilho na fala |
|---|---|---|
| 0,1–2,7 | Contador em ouro 3D "R$ 27 → 66 → 88 → 96 → 100 MIL" atrás da cabeça (pessoa recortada na frente), ease-out; em 100 trava, clarão e moedas caem do topo | "100 mil reais em 30 dias" |
| 2,7–5,4 | Plano aberto; etiqueta pequena "PERGUNTA" acima da legenda; "100 mil" vira pílula roxa em serifa itálica | "o que você faria…" |
| 5,4 | Rótulo do falante ("LILIAN", pequeno, cinza) acima da legenda; selo VÍDEO \| LIVE: só "VÍDEO" fica e sobe ao topo central (pílula ouro clara pequena) | "com o vídeo?" |
| 8,9–12,5 | Chips "MAIS VENDIDOS" → "BLACK FRIDAY" lado a lado acima da legenda (um por vez, ~1 s entre eles) | as próprias palavras |
| 14,5–17,2 | Segunda pergunta: par VÍDEO \| LIVE no centro, "LIVE" sobe ao topo | "faturar R$ 100 mil?" |
| 18–20 | Chip "FÁCIL" com ícone, à frente do peito | "a forma mais fácil" |
| 21–25 | Checklist no mesmo lugar, um por vez: "1 produto" → "tíquete baixo" → "frete grátis" (chip roxo com ✓) | cada item falado |
| 26,0–27,6 | Cena cheia: fundo roxo-noite com estrelas, celular com play × botão LIVE, raio dourado, "QUAL *VENCE?*" | "qual dos dois é o melhor" |
| 27,6–28,5 | Clarão + "OS *DOIS* FUNCIONAM" grande sobre o vídeo escurecido | "os dois funcionam" |
| 31–34 | Placa roxa "escolha o que é / *a sua cara*" acima da legenda | "o que você tem mais identificação" |
| 34,8–38 | Contador "R$ 0 → 12 → 100 MIL" no topo, com cartões VÍDEO e LIVE pendurados embaixo | "vender muito… vídeo… live" |
| 38,3–45,9 | Três lado a lado; pílulas "SIGA <nome>" uma por vez (y do peito); depois caixa "Deixe sua dúvida…" digitada letra a letra | "siga o…", "deixe nos comentários" |
| 45,9–48,9 | Cartão final: logo da marca em ouro num anel, fundo roxo com partículas | — |

### Tipografia
- Chips, selos e títulos: sans geométrica pesada em maiúsculas (Montserrat/Poppins ExtraBold), tracking leve.
- Ênfase: **Playfair Display itálico** dourado (em cartão) ou dentro de pílula roxa (na legenda).
- Números: ouro 3D chanfrado, "R$" e "MIL" menores ao lado do número.
- Rótulos de apoio ("PERGUNTA", nome do falante): versalete minúsculo, cinza claro, ~40% da altura da legenda.

### Cores
- Roxo profundo (cenas cheias, chips, placa), ouro (números, ênfase, anel), branco/vidro (placa da legenda). Nada de neon.

### Legenda
- Placa de vidro branca arredondada, centrada (y ≈ 1260), 1–2 linhas de ~3–5 palavras. Palavra já dita em preto, próximas em cinza
  claro (maré); a **palavra-chave** da frase vira pílula roxa com texto itálico dourado/branco. Some quando um cartão repete a fala.

### Som e trilha
- Voz comprimida (~−14 LUFS), sem trilha marcada. Picos curtos alinhados aos eventos (2,7 · 7,4 · 9,9 · 10,4 · 10,8 · 11,9 · 14,5 ·
  16 · 18,1 · 20,9 s), ≈ 1 som a cada ~2 s: whoosh nas trocas, tick nos chips (inferido pelo pico; o nível exato não é separável da voz).

### Abertura e fechamento
- Abre já no meio da pergunta-promessa, sem vinheta; número em movimento desde o quadro 1.
- Fecha com CTA falado em plano aberto e cartão de marca de ~3 s.

## Roteiro
- **Gancho (0–2,7 s):** pergunta-promessa com número + prazo + plataforma ("como fazer <valor> em <prazo> com <plataforma>?").
- **Estrutura:** a mesma pergunta para cada convidado, cada um com um caminho diferente e concreto (critérios, quantidade, checklist)
  → re-gancho de duelo ("qual dos dois é o melhor?") → síntese conciliadora ("os dois funcionam, escolha o que combina com você")
  → reforço curto → CTA → cartão final.
- **CTA:** só no fim: seguir cada participante pelo nome + "deixe sua dúvida nos comentários" com promessa de resposta.
- **Tom:** direto, coloquial ("cara", "é simples"), frases curtas, verbos de ação (pegaria, escolhe, faria), números concretos.

## Como recriar aqui
| Elemento | Peça |
|---|---|
| Contador ouro 3D do gancho e do resultado | `Numero3D` em `src/pecas/ModeloEntrevista.tsx`; letras 3D: `src/pecas/tres/Texto3D.tsx`; recorte da pessoa: skill it-reelsmaker |
| Moedas/faíscas no travamento | `src/pecas/efeitos/Texto3DImpacto.tsx` (faíscas); moedas só se o número for dinheiro |
| Selo VÍDEO \| LIVE | `Selo` (ModeloEntrevista) |
| Chips e checklist um por vez | `Chips` (ModeloEntrevista) |
| Cena VS, "OS DOIS FUNCIONAM", placa de frase | `Frase` (ModeloEntrevista) + cena cheia de `referencia-IMG_5157-v4b/` |
| Interface de live | `Live` (ModeloEntrevista) |
| Pílula SIGA e caixa de comentário | `Siga`, `Comentario` (ModeloEntrevista) |
| Cartão final | `Final` (ModeloEntrevista) / `Logo3D.tsx` |
| Legenda maré com pílula da palavra-chave | `Legenda.tsx` estilo `mare` |
| Chicote e clarão | transições `chicote` e `flash` do plano |
| **A criar** | transição `desfoque` (rack focus ~0,3 s) e rótulo pequeno do falante/"PERGUNTA" acima da legenda |
| Sons | `assets/sfx_pro` / pack Sound effects (whoosh, tick, swish); sem grave |

## O que é específico deste vídeo (não copiar)
Praia, nomes dos convidados, "100 mil em 30 dias", Black Friday, VÍDEO × LIVE, logo LEGACY, moedas (só cabem porque o número é dinheiro).
