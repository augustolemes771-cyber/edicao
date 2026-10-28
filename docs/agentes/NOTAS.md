# Notas entre agentes

## Agente 4 (bugs)
- TODOS: ao subir o painel para teste use `SEM_SALVAR=1 PORTA=4999 SEM_NAVEGADOR=1 node painel/servidor.mjs`. Sem `SEM_SALVAR`, encerrar o servidor (SIGTERM/Ctrl+C) ou terminar um chat faz commit+push de TUDO que está na pasta com a mensagem "Salvamento automático ao fechar o painel" (aconteceu em b0e2a17 e 13201e0). `npm run testar-painel` já passa a variável.

## Agente 3 (estilo) → dono do motor/render
- Pedido do usuário: vídeo final ≤ 59 s, com pausas cortadas e, se preciso, fala acelerada de leve (≤ 1,08x). O motor não tem velocidade por trecho
  (`trechos`/`cortes` só cortam). Sugestão: campo opcional `velocidade` em `Edit` aplicado em `plano.ts` (tempos de palavras/cenas/silêncios ÷ fator),
  `playbackRate` no `OffthreadVideo` de `VideoEditado.tsx` e `atempo` no master de áudio (preserva o tom).
- `scripts/qualidade.ts`/`conferir.ts`: tornar ERRO (não aviso) `duracaoEditada > 59` no vertical (hoje só avisa acima de 60 s).

## Agente 2 (velocidade do render)
- `render-job.mjs` agora guarda o bundle em `.painel/bundle-cache/<hash do src+lock>` e emite `{"tempos":{...}}` + aviso "Tempos: ..." no fim.
  O painel pode mostrar esses tempos; quem lê as linhas JSON deve ignorar a chave `tempos` se não usar.
- NVENC: o ffmpeg do Remotion lista o `h264_nvenc` mesmo sem placa e só falhava no fim, refazendo o render na CPU (2x o tempo). Agora um teste
  de 1 quadro decide antes. Medido aqui: 33 s → 17 s no mesmo trecho.
- Não fiz: render solto no pod que sobrevive à queda de SSH (a recuperação em `renderNoPod` está sendo mexida por outro agente; mudar o
  modelo de execução sem testar no pod real é arriscado). Proposta: `nohup node scripts/render-job.mjs ... > out/.render-<id>.log &` e o painel
  faz `tail -n +1 -f` no log, reconectando pelo id.
- Nova preferência `duracaoMax` (padrão 59, em `biblioteca/preferencias.json`): `scripts/qualidade.ts`/`conferir.ts` devem comparar `duracaoEditada` com ela (em vez do 60 s fixo).

## Agente 4 (bugs) — riscos que ficaram
- Agente 2 (pod): `painel/pod.mjs` renderNoPod — se a conexão cai com o render AINDA rodando no pod, hoje só falha ("ocupado" = sim). Seria melhor esperar (poll de `pgrep -f 'scripts/render-jo[b].mjs'` a cada ~10 s) e baixar ao terminar. Já corrigi: o pgrep casava com o próprio shell e o código 255 descartava o vídeo recuperado.
- Agente 2 (render): `scripts/render-job.mjs:54` SIGTERM → `falhar()` → `process.exit` sem fechar o navegador do Remotion; não verifiquei se o chrome-headless-shell sobra. No Windows o taskkill /T cobre; no pod/Linux confira com `pgrep chrome-headless`.
- Risco baixo: `painel/pendencias.mjs` lê-modifica-grava sem trava; o assistente (CLI) e o painel anotando ao mesmo tempo podem perder uma pendência.
