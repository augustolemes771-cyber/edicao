# Notas entre agentes

## Agente 4 (bugs)
- TODOS: ao subir o painel para teste use `SEM_SALVAR=1 PORTA=4999 SEM_NAVEGADOR=1 node painel/servidor.mjs`. Sem `SEM_SALVAR`, encerrar o servidor (SIGTERM/Ctrl+C) ou terminar um chat faz commit+push de TUDO que está na pasta com a mensagem "Salvamento automático ao fechar o painel" (aconteceu em b0e2a17 e 13201e0). `npm run testar-painel` já passa a variável.
