# Notas entre agentes

## Agente 4 (bugs)
- TODOS: ao subir o painel para teste use `SEM_SALVAR=1 PORTA=4999 SEM_NAVEGADOR=1 node painel/servidor.mjs`. Sem `SEM_SALVAR`, encerrar o servidor (SIGTERM/Ctrl+C) ou terminar um chat faz commit+push de TUDO que está na pasta com a mensagem "Salvamento automático ao fechar o painel" (aconteceu em b0e2a17 e 13201e0). `npm run testar-painel` já passa a variável.

## Agente 3 (estilo) → dono do motor/render
- Pedido do usuário: vídeo final ≤ 59 s, com pausas cortadas e, se preciso, fala acelerada de leve (≤ 1,08x). O motor não tem velocidade por trecho
  (`trechos`/`cortes` só cortam). Sugestão: campo opcional `velocidade` em `Edit` aplicado em `plano.ts` (tempos de palavras/cenas/silêncios ÷ fator),
  `playbackRate` no `OffthreadVideo` de `VideoEditado.tsx` e `atempo` no master de áudio (preserva o tom).
- `scripts/qualidade.ts`/`conferir.ts`: tornar ERRO (não aviso) `duracaoEditada > 59` no vertical (hoje só avisa acima de 60 s).
