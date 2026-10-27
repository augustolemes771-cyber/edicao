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
| `GET /api/config` | `{prefs, config}`. `prefs` (git, vale em todo PC): `{formatoPadrao:'vertical'\|'horizontal', resPrevia:540\|720\|1080, intensidade:'calma'\|'normal'\|'frenetica', legendaPadrao:'palavra'\|'ouro'\|'impacto'\|'neon', confirmarFinal, amostras, salvarSozinho, sempre}` (`formatoPadrao`, `intensidade` e `legendaPadrao` aceitam `'auto'` = a IA decide). `config` (só este PC): `{modelo:''\|'auto'\|'sonnet'\|'opus'\|'haiku', esforco:''\|'low'\|'medium'\|'high', gpuStudio, gpuCodificador, navegadorRender, notificar, pod:{ativo, host, porta, usuario, chave, pasta, gl}}` |
| `POST /api/config {prefs?, config?}` | salva só as chaves enviadas |
| `POST /api/tarefas {tipo, projeto, opcoes}` | cria tarefa e devolve `{id}`. `tipo`: `previa`, `final`, `transcrever`, `roteiro`, `conferir`, `link`, `pack`, `preparar-pod`. `opcoes`: `{res, de, ate, pod}` (render; `pod` true/false sobrepõe o padrão), `{url, destino:'midias'\|'referencias'\|'tema', tema?}` (link; `tema` baixa um vídeo modelo e dispensa projeto), pack: `{url}` (link do Google Drive, caminho completo de um .zip ou de uma pasta deste PC), `{caminho, noLugar:true}` (cataloga a pasta sem copiar), `{url, pasta}` (link do Drive + pasta local como raiz, baixa só o que falta), `{soFaltando:true}` (sozinho ou junto com os outros). Opções inválidas: status 400 com `{erro}`. `projeto` é ignorado em `pack` e `preparar-pod` |
| `GET /api/tarefas` | `[{id, tipo, projeto, estado:'fila'\|'rodando'\|'ok'\|'erro'\|'cancelado', fase, pct:0..100\|null, eta:segundos\|null, onde:'pc'\|'pod', saida, aviso, erro, log:[últimas linhas], inicio, fim}]`, mais novas primeiro. Renders rodam um por vez (fila). |
| `POST /api/tarefas/cancelar {id}` | cancela da fila ou encerra o processo (no pod, também o render remoto). 400 se já terminou |
| `POST /api/pod/testar` | `{ok, texto}` (conexão, GPU, Node e ffmpeg do pod) |
| `GET /api/fluxo?projeto=` | `{etapas: [{id, nome, feito, detalhe, acao: {tipo:'tarefa'\|'chat', valor}}]}`: projeto, mídia, transcrição, roteiro, cenas, conferir, prévia, final |
| `GET /api/historico?projeto=` | `[{quem:'eu'\|'ia'\|'acao'\|'erro', texto, t, custo?}]` (conversa salva neste PC) |
| `GET /api/prompts` · `POST /api/prompts [{titulo, texto}]` | atalhos de pedido (em `biblioteca/prompts.json`, no git) |
| `POST /api/projetos {nome, tema, formato}` | cria o projeto (`scripts/novo.mjs`) e o registra no tema |
| `POST /api/abrir-pasta {projeto, onde:'midias'\|'referencias'\|'saida'\|'projeto'}` | abre a pasta no explorador do PC |
| `GET /api/tema-modelos?tema=` | vídeos modelo do tema: `[{nome, tamanho, video, analise}]` (`analise` = caminho do .md ou null; `video` false quando só a análise veio de outro PC) |
| `POST /api/tema-modelo?tema=&nome=` · `POST /api/tema-modelo/apagar {tema, nome}` | envia (corpo = arquivo cru, só vídeo) ou apaga o vídeo modelo e a análise |
| `GET /tema-modelo/<tema>/<arquivo>` | o vídeo modelo (fica em `biblioteca/temas/<tema>/modelos/`, fora do git; a análise `.md` vai para o git) |
| `GET /pack/<caminho>` | arquivo do pack: procura primeiro na `raiz` de `.painel/pack.json` (se existir) e depois em `biblioteca/pack/arquivos/` (fora do git); 404 se não achar ou se sair da pasta |

`pack` em `/api/biblioteca`: `[{nome, categoria, tipo:'video'\|'audio'\|'imagem'\|'fonte'\|'lut'\|'modelo3d'\|'outro', arquivo, tamanho, baixado}]`, lido de
`biblioteca/pack/catalogo.json` (no git). `baixado` diz se o arquivo existe neste PC (mesma busca do `/pack/`). Os demais campos do catálogo (ex.: `origem`) vêm junto.

Detalhes das tarefas:
- `saida`: caminho relativo à raiz (`out/x.mp4` no render, `public/projetos/<p>/[referencias/]arquivo.mp4` no link, `docs/<p>/transcript-lines.txt` no roteiro).
- `transcrever`, `roteiro` e `conferir` têm `pct: null` (só `fase` e `log`).
- No pod, `fase` termina com "no pod" e a barra junta os passos: enviar código (0-4), mídias (4-20), dependências (20-23), render (23-95), baixar (95-100).
- O link usa `.painel/bin/yt-dlp` (baixado do GitHub oficial na primeira vez) quando não há yt-dlp no PATH.
- `POST /api/projetos` devolve `{nome (slug), tema, formato}`; tema inexistente vira `aleatorios`; sem `formato` usa `prefs.formatoPadrao`.
- `POST /api/prompts` grava a lista limpa (`titulo` até 80, `texto` até 6000 caracteres) e a devolve.
- `/api/historico` com `custo` na última fala da IA ou numa linha `acao` "Pedido concluído"; com `prefs.salvarSozinho`, o chat termina com uma `acao` "Salvo no git: ..." (ou um `erro`).

No chat, com `modelo: 'auto'` o servidor escolhe modelo e esforço pelo pedido (`escolherModelo` em painel/config.mjs), avisa numa linha `acao` e libera subagentes. Com `prefs.amostras`, o Claude responde com linhas `[[amostra:A|out/arquivo.jpg|descrição]]`, que a página mostra como imagens com o botão "Quero esta".
