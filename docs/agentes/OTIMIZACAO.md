# Otimização — achados do Agente 5

Atualizado em 2026-10-28 · commit `8cdd10b` (auditoria 2) · medido na nuvem (4 vCPU, 15 GB, sem GPU, WebGL por CPU `swangle`).
Reexecutar: `npm run auditar` (completo, ~7 min aqui) ou `npm run auditar -- --rapido` (sem render). Saída em `out/auditoria.json`.
**Números daqui só servem para comparar antes/depois. Nada do pod foi medido**; o que depende do pod está marcado *(estimado)* ou *(testar no pod)*.

## O que foi medido

| Medida | Resultado |
|---|---|
| `npm run testar-painel` | passa; ~1,9 s |
| `tsc --noEmit` | 6,5 s, sem erros |
| Webpack (bundle), rodada fria → quente | 24,1 s → 3,4 s (cache em `node_modules/.cache` funciona; ~11% do render curto) |
| Render de teste (cenarios-exemplo, 4 s, 720p, `swangle`, 4 threads) | ~200 s = **0,6 q/s** reais. É o 3D por CPU; não representa o pod com GPU |
| `loudnorm` (30 s, 1080p/20 Mbps) como está × com `-vn` | 1,87 s × 0,68 s (**2,7×**) |
| Painel: subida / rotas | sobe em 0,2 s; quase todas as rotas 1–5 ms |
| Painel: `/api/claude` | **305–320 ms** (2 processos `claude` a cada chamada) |
| Painel: `/api/biblioteca` | 63 ms e **1,7 MB** (catálogo do pack inteiro) |
| Código enviado ao pod por bloco | 6,6 MB, 188 arquivos, 17 chamadas `ssh` no fluxo |
| Tokens fixos do assistente | CLAUDE.md ~130, SKILL.md ~1.800, prompts do painel ~2.300 (já enxuto) |

## Lista priorizada (ganho × esforço)

Dono sugerido entre parênteses; eu não edito áreas dos outros agentes.

### A. Alto ganho, baixo esforço
1. ✅ **FEITO (Agente 2, `nQuadros`)** — Métrica de q/s errada (`scripts/render-job.mjs`, aviso "Render: WebGL ...").
   Evidência: render de 4,01 s (120 quadros) reportou "495 quadros ... 2.5 q/s" porque divide `composition.durationInFrames` (vídeo inteiro) em vez dos quadros do `frameRange`. Em bloco de 10 s o pod mostraria q/s inflado e atrapalha qualquer ajuste de CONC.
   Diff: `const n = frameRange ? frameRange[1] - frameRange[0] + 1 : composition.durationInFrames;` e usar `n` nas duas contas do aviso.
2. **`-vn` nas passadas de áudio** (Agente 2 · `render-job.mjs` passo 4 "medir"; `scripts/bloco.ts` passo 4 `silencedetect`).
   A primeira passada do loudnorm decodifica o vídeo 4K/50 Mbps à toa. Medido 2,7× em 1080p/20 Mbps; em 4K deve ser bem maior *(testar com um final real)*. Diff: inserir `'-vn'` antes de `'-af'` nas duas chamadas de medição (a gravação final já usa `-c:v copy`, não muda).
3. **`/api/claude` com cache de 60 s** (Agente 1 · `painel/servidor.mjs` ~l.829).
   Cada chamada roda `claude --version` e `claude auth status` (~0,3 s aqui; no Windows costuma ser 1–3 s e bloqueia a abertura do painel). Guardar `{em, resposta}` e reaproveitar por 60 s; invalidar em `/api/claude/entrar|trocar|instalar`.
4. **Prévia do 3D em qualidade de prévia** (Agente 3 · `src/pecas/Cenario.tsx` l.428, `Entrevista.tsx` l.193, `ModeloEntrevista.tsx` l.80/220).
   `leve = !getRemotionEnvironment().isRendering` só vale para o Studio; toda prévia do painel é "rendering", então roda `antialias`, sombra `variance` 2048 e AA cheio a 720p. Sugestão: `render-job.mjs` passar `inputProps.previa = tipo !== 'final'` (campo opcional em `PropsVideo`), e as peças usarem `leve = previa || !isRendering` (sombra 1024, `antialias: false` ou `dpr` menor). Ganho depende da GPU *(testar no pod: A/B com `npm run auditar`)*.

### B. Alto ganho, esforço médio
5. **Vídeo-fonte proxy para prévias** (Agente 2 · `preparar-video.mjs` + `render-job.mjs`/`pod.mjs`).
   `preparar-video` mantém o 4K "quase sem perda"; a prévia (≤1080p) decodifica esse 4K a cada quadro (`OffthreadVideo` no corpo todo) e o envio pelo upload doméstico é o gargalo que o `pod.mjs` já tenta contornar (limite de 3 min para prévia). Gerar `video-prev.mp4` (1920 de largura, H.264 crf 18–20, `-g 15`) uma vez, usar na prévia (`edit.video` → proxy quando `tipo !== 'final'`) e enviar só o proxy ao pod; o final usa o original. *(estimado: envio 4–10× menor, decodificação por quadro 3–4× mais barata; não medido: não há vídeo real no repositório.)* Cuidado: o zoom da edição tem margem no 4K; no proxy 1080p, prévia a 1080p fica levemente mais mole com zoom alto — manter 720p/540p como padrão.
6. **Menos idas e voltas SSH** — a parte (a) *não reenviar código igual* já foi feita (hash em `.envio/codigo.hash`, commit 2994386) e há resumo de tempos por etapa; falta (b) (Agente 2 · `painel/pod.mjs` `renderNoPod`).
   Cada bloco faz tar → scp → untar de 6,6 MB e ~10 chamadas `ssh` novas (cada uma com handshake e a regra de repetir até 4× por causa do MaxStartups). Ideias: (a) hash do conteúdo de `CODIGO` guardado em `.painel/pod-manifesto.json`; se igual ao do pod, pular o envio; (b) juntar `mkdir .envio`, listar mídias, `cmp package-lock`, MaxStartups, `date` num único `ssh` de "preflight" que devolve linhas; (c) ControlMaster não existe no OpenSSH do Windows, então (b) é o caminho. *(estimado 5–20 s por bloco; medir no pod com timestamps por fase.)*
7. **Varrer `CONC` no pod** (Agente 2). Hoje `CONC=$(nproc)` (16). Com Chrome + NVENC + ffmpeg de OffthreadVideo competindo, 16 abas pode ser pior que 10–12. Rodar no pod: `npm run auditar -- --varrer-conc 6,8,12,16` e fixar o melhor (guardar em `config.json › pod.conc`). *(testar no pod)*

### C. Ganho menor ou incerto
8. **jpegQuality 95 na prévia** (`render-job.mjs`, `remotion.config.ts`): prévia a 80–85 reduz o custo de captura/transferência de cada quadro; no 4K final manter 92–95. *(testar no pod; aqui o `swangle` esconde o efeito.)*
9. **`/api/biblioteca` 1,7 MB e `/api/temas` 43 ms** (Agente 1): é chamado uma vez ao abrir a aba, não é caminho quente; se a aba ficar lenta, enviar o catálogo do pack em separado/paginado.
10. **Polling do cliente**: `pollTarefas` 1 s com tarefa ativa (rota ~1 ms), `pollBloco` 1,5 s, `verificarClaude` só até logar. Custo desprezível; não mexer.
11. **Áudio codificado duas vezes** (AAC 320k do Remotion → loudnorm → AAC 320k): perda mínima a 320k; só vale mudar se aparecer chiado.
12. **Gzip no servidor**: `app.js` 138 KB (43 KB gz). Só importa se o painel for acessado por túnel; local não.

## O que já está bom (não mexer)
- Pasta `public` do bundle por hard links e só do projeto (sem GB por render).
- Cache do webpack: 24 s → 3,4 s na segunda rodada.
- Escolha automática de modelo/esforço (`painel/config.mjs`), `--strict-mcp-config`, `--exclude-dynamic-system-prompt-sections`, `LIMITE_TURNOS`, conversa retomada sem reler a skill. Tokens fixos pequenos.
- NVENC com queda para CPU, cadeia de fallback de WebGL, loudnorm de duas passadas linear (-14 LUFS / -1,5 dBTP), `+faststart`.
- `useMemo` nos materiais do 3D (36 usos); cenas 3D só montam o canvas quando há objetos.

## Pendente de medir no pod
Tempo por fase de um bloco real (código → mídias → deps → bundle → render → download), q/s com GPU (`egl` × `angle-egl`), CONC ideal, A/B de jpegQuality e de qualidade 3D na prévia, efeito do proxy de vídeo. O `auditar` já imprime q/s reais e aceita `--varrer-conc`; rode-o no pod (`cd /workspace/edicao && npm run auditar`).

## O que mudou desde a auditoria anterior
- Feito pelos outros agentes: q/s correto (item 1), cache do bundle por hash do código em `.painel/bundle-cache` (o que eu media como 24 s → 3,4 s agora também vale entre processos e no pod), pulo do envio de código igual (6a), linha `Tempos: código, mídias, dependências, render, download`, teste rápido do NVENC.
- Ainda aberto: 2 (`-vn`), 3 (cache `/api/claude`), 4 (3D leve na prévia), 5 (proxy), 6b (preflight único de ssh), 7 (CONC), 8 (jpegQuality).
- Dica para os donos: as linhas `Tempos:` do pod, coladas aqui no próximo ciclo, substituem as estimativas *(estimado)* acima.

## Histórico
- 2026-10-28 · `8cdd10b` · segunda leitura após novos commits; itens 1 e 6a já resolvidos.
- 2026-10-28 · `cb0691a` · primeira auditoria (este documento).
