# Projeto edicao

Motor de edição de vídeo em Remotion (canal Mateus Dias). Para editar um vídeo, siga a skill
`.claude/skills/editar-video/SKILL.md`.

- Verificação: `npx tsc --noEmit` e `npm run conferir -- <projeto>` antes de qualquer render.
- Na nuvem, todo `remotion render`/`still` precisa de
  `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
- Vídeos (`*.mp4`, `*.mov`) e mídia de projeto em `public/projetos/` não vão para o git.
- Texto para o usuário em português.
- Pedido de edição feito direto aqui no Claude Code (fora do chat do painel): antes de editar, rode
  `node scripts/contexto.mjs <projeto>` e siga o que ele imprime (preferências do painel, tema, regras aprendidas e
  pendências que o usuário deixou nas imagens do painel). O painel fica só para ver (Studio, Prévias, Mídias) e anotar.
- Ajustes manuais do painel ficam em `src/projetos/ajustes.json` (por projeto: textos e tempos de cenas, câmera, palavras
  da legenda) e valem por cima do edit.ts. Não apague. Cada cena é achada pela chave `tipo@início` calculada pelo edit.ts:
  se você mudar o início ou o tipo de uma cena ajustada, o ajuste deixa de valer; leve o ajuste para o edit.ts e tire do JSON.
- Sessão na nuvem (claude.ai/code, editando pela conversa): a mídia fica só no PC do usuário. Edite com base em
  `transcricao.json`/`silencios.json`, rode `npx tsc --noEmit` e `npx tsx scripts/qualidade.ts <projeto>`, e faça commit e
  push na branch do painel: o painel do usuário puxa sozinho a cada 20 s e o player atualiza. Antes do push, `git pull --rebase`
  (o painel também envia ajustes e transcrições para a mesma branch).
