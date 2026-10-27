# API do painel

Contrato entre o servidor (`painel/servidor.mjs` e módulos) e a página (`painel/web/`). Toda rota `/api/*`, `/out/*`,
`/midia/*`, `/sfx/*`, `/fontes/*` e `/pack/*` exige o token: cabeçalho `x-painel-token` ou `?t=` (para `<video>`, `<img>`,
`<audio>`). Respostas em JSON; erro = status 4xx/5xx com `{erro: "mensagem em português"}`.

## Já existentes

| Rota | Uso |
|---|---|
| `GET /api/biblioteca` | `{pecas, modelos3d, blender, templates, sfx, fontes, referencias, salvos, pack}` (`pack` é novo, ver abaixo) |
| `GET /api/projetos` | `[{nome, videos: [{arquivo, data}]}]` (vídeos em `out/`, mais novo primeiro) |
| `GET /api/temas` · `POST /api/temas {nome, descricao}` | temas de template; `{temas: [{id, nome, descricao, regras, projetos: [{nome, formato}]}], semTema}` |
| `GET /api/midias?projeto=` | `{midias: [{nome, tamanho}], referencias: [...], notas}` |
| `POST /api/midia?projeto=&tipo=midias\|referencias&nome=` | corpo = arquivo cru |
| `POST /api/midia/apagar {projeto, tipo, nome}` · `POST /api/notas {projeto, texto}` | |
| `POST /api/chat {projeto, tema, pedido}` | SSE: `{tipo:'texto', texto}`, `{tipo:'acao', acao}`, `{tipo:'erro', texto}`, `{tipo:'fim', erro, custo}` |
| `POST /api/parar {projeto}` · `POST /api/novo-chat {projeto}` | |
| `GET /api/claude` · `POST /api/claude/instalar` · `POST /api/claude/entrar` | `{instalado, logado}` |
| `GET /api/codigo?f=` | `{texto}` de arquivos da biblioteca |
| `POST /api/studio {rota}` · `POST /api/reiniciar` · `POST /api/sync/salvar` | |

## Novas

| Rota | Uso |
|---|---|
| `GET /api/config` | `{prefs, config}`. `prefs` (git, vale em todo PC): `{formatoPadrao:'vertical'\|'horizontal', resPrevia:540\|720\|1080, intensidade:'calma'\|'normal'\|'frenetica', legendaPadrao:'palavra'\|'ouro'\|'impacto'\|'neon', confirmarFinal, salvarSozinho, sempre}`. `config` (só este PC): `{modelo:''\|'sonnet'\|'opus'\|'haiku', gpuStudio, gpuCodificador, navegadorRender, notificar, pod:{ativo, host, porta, usuario, chave, pasta, gl}}` |
| `POST /api/config {prefs?, config?}` | salva só as chaves enviadas |
| `POST /api/tarefas {tipo, projeto, opcoes}` | cria tarefa e devolve `{id}`. `tipo`: `previa`, `final`, `transcrever`, `roteiro`, `conferir`, `link`, `pack`, `preparar-pod`. `opcoes`: `{res, de, ate, pod}` (render; `pod` true/false sobrepõe o padrão), `{url, destino:'midias'\|'referencias'}` (link), `{url}` (pack: link do Google Drive ou caminho de .zip) |
| `GET /api/tarefas` | `[{id, tipo, projeto, estado:'fila'\|'rodando'\|'ok'\|'erro'\|'cancelado', fase, pct:0..100\|null, eta:segundos\|null, onde:'pc'\|'pod', saida, aviso, erro, log:[últimas linhas], inicio, fim}]`, mais novas primeiro. Renders rodam um por vez (fila). |
| `POST /api/tarefas/cancelar {id}` | |
| `POST /api/pod/testar` | `{ok, texto}` (conexão, GPU, Node e ffmpeg do pod) |
| `GET /api/fluxo?projeto=` | `{etapas: [{id, nome, feito, detalhe, acao: {tipo:'tarefa'\|'chat', valor}}]}`: projeto, mídia, transcrição, roteiro, cenas, conferir, prévia, final |
| `GET /api/historico?projeto=` | `[{quem:'eu'\|'ia'\|'acao'\|'erro', texto, t, custo?}]` (conversa salva neste PC) |
| `GET /api/prompts` · `POST /api/prompts [{titulo, texto}]` | atalhos de pedido (em `biblioteca/prompts.json`, no git) |
| `POST /api/projetos {nome, tema, formato}` | cria o projeto (`scripts/novo.mjs`) e o registra no tema |
| `POST /api/abrir-pasta {projeto, onde:'midias'\|'referencias'\|'saida'\|'projeto'}` | abre a pasta no explorador do PC |
| `GET /pack/<caminho>` | arquivo do pack (`biblioteca/pack/arquivos/`, fora do git) |

`pack` em `/api/biblioteca`: `[{nome, categoria, tipo:'video'\|'audio'\|'imagem'\|'fonte'\|'lut'\|'modelo3d'\|'outro', arquivo, tamanho, baixado}]`, lido de
`biblioteca/pack/catalogo.json` (no git). `baixado` diz se o arquivo existe neste PC.
