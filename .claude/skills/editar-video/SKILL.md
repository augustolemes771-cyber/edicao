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
ler o `prompt-base.md` do tema (objetivo e densidade do estilo, se existir) e o `aprendizado.md`, e seguir. Ao terminar, ou quando o usuário aprovar, reprovar ou corrigir algo, acrescentar uma linha
`- AAAA-MM-DD (projeto): lição` nele. Regra que vale para todos os temas fica nesta skill. Projeto novo entra em `projetos` do `tema.json`.

## Qualidade de entrevistas e depoimentos (28/10/2026, oficial-1 refeito)

- Vídeo do celular: `npm run preparar-video -- <projeto> <arquivos na ordem>`. Mantém a resolução original (4K continua 4K),
  converte HDR do iPhone com zscale + tonemap e grava quase sem perda. Nunca reduzir para 1080 nem improvisar a conversão:
  a versão reprovada tinha zoom de 1,64x sobre 1080 (borrado). Com fonte 1080, zoom no máximo 1,35.
- Roteiro em ordem de história, não de gravação: `trechos` (lista ordenada) no lugar de `cortes`. Gancho com o resultado
  (número), depois apresentação, dor, pergunta, virada, lição, crédito, CTA e cartão final. Trecho pode se repetir (o gancho
  reaproveita o resultado).
- Bordas no silêncio medido: `silencios: silencios as Trecho[]` com `silencios.json` (o render mede sozinho no PC; ou
  `npm run silencios -- <projeto>`).
- Peças com a qualidade do modelo aprovado (src/pecas/ModeloEntrevista.tsx): `numero3d`, `live` (com host, espectadores e
  comentários da história), `frase`, `selo`, `chips` (um por vez), `siga`, `final`. Legenda `mare` com `falantes`.
  Os efeitos podem mudar de vídeo para vídeo; o que não muda é a qualidade e a sensação: início chamativo, cortes rápidos
  (zoom em cada emenda, chicote só na troca de falante), um evento a cada ~2 s, legenda no meio e um texto por vez.
- Nada de fonte gótica, celular 3D genérico ou símbolos soltos: o usuário reprovou.

## Fluxo por blocos do painel (28/10/2026)

- O foco é volume com qualidade: o vídeo sai em blocos de ~10 s (`npm run bloco -- <projeto> <n>`), cada um com análise automática
  (`npm run qualidade`), render só do trecho e folha de quadros. Ler a folha antes de mostrar; corrigir no máximo uma vez; mostrar a linha
  `[[bloco:...]]` e esperar o "aprovado". Bloco aprovado não se mexe.
- Em todo bloco, pelo menos uma ideia visual nova tirada da fala daquele trecho, sem repetir o efeito principal do bloco anterior e sem
  poluir (um texto por vez, evento a cada ~2 s, legenda no meio).

## Estilo do usuário (ler antes de editar)

Leia `docs/estilo-do-usuario.md` (ritmo, paleta, receitas emoção→efeito, 3D, o que ele reprova). Efeitos prontos em
`src/pecas/efeitos/README.md`: `ImpactoDor` (tremida + glitch + aberração vermelha/ciano + vinheta pulsante), `ObjetoVoaAoCentro`
(olho 3D do contador de espectadores), `Texto3DImpacto`. Dor = `frase` com `dor: true`; solidão = `live` com `drama`/`olho3d`.

## Vídeo de referência/modelo

Quando o usuário aprova um vídeo como modelo, ele quer o ESTILO e não a cópia: leia `docs/referencias/analisar-referencia.md` (coleta de evidências com
`npm run analisar-referencia`, análise do porquê de cada efeito, auditoria de qualidade, gramática transferível e plano de equivalências por função da fala).

## Duração máxima (regra do usuário, 28/10/2026)

Vídeo final com no máximo 59 s por padrão (preferência `duracaoMax` do painel, ou duração citada no pedido, manda no lugar) e dinâmico: corte as pausas (bordas no silêncio medido), tire enrolação e, só se faltar, acelere a fala de
leve (até 1,08x). O motor ainda NÃO tem velocidade por trecho (`src/motor/plano.ts`, `VideoEditado.tsx`): enquanto não houver, resolva só com cortes
e deixe o pedido em `docs/agentes/NOTAS.md`. Conferir `duracaoEditada <= duração máxima` antes de qualquer prévia/render.

## Depois da entrega

- Não renderizar de novo sem pedido. Ajuste depois da entrega vai para o código e para esta skill; render novo só
  quando ele pedir o vídeo.
- Correção que ele pedir vira regra nesta skill, com data.

## Render final de vídeo 4K do celular (28/10/2026, depoimento-2)

- O `preparar-video` grava com quadro-chave a cada 0,5 s (`-g 15 -bf 0`): com GOP longo o render final caía ("No frame found at
  position", busca de quadro > 28 s). Vídeo preparado antes disso: recodificar com esses parâmetros antes do final.
- No PC de 16 GB, rodar o final com o paralelismo padrão; `CONC=6` (cache de 40% da RAM) estourou a memória do Chrome.
