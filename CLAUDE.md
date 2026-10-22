# Projeto edicao

Motor de edição de vídeo em Remotion (canal Mateus Dias). Para editar um vídeo, siga a skill
`.claude/skills/editar-video/SKILL.md`.

- Verificação: `npx tsc --noEmit` e `npm run conferir -- <projeto>` antes de qualquer render.
- Na nuvem, todo `remotion render`/`still` precisa de
  `--browser-executable=/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell`.
- Vídeos (`*.mp4`, `*.mov`) e mídia de projeto em `public/projetos/` não vão para o git.
- Texto para o usuário em português.
