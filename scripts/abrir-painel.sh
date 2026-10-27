#!/usr/bin/env bash
# Prepara tudo sozinho (só na primeira vez) e abre o painel no navegador.
cd "$(dirname "$0")/.." || exit 1
if ! command -v node >/dev/null; then
	echo "Falta instalar o Node.js: https://nodejs.org (botão LTS). Depois dê dois cliques de novo."; read -r -p "Enter para sair"; exit 1
fi
[ -d node_modules ] || { echo "Primeira vez: instalando (alguns minutos)..."; npm install || exit 1; }
if ! command -v claude >/dev/null; then echo "Instalando o Claude Code..."; npm i -g @anthropic-ai/claude-code || sudo npm i -g @anthropic-ai/claude-code || exit 1; fi
if ! claude auth status >/dev/null 2>&1; then echo "Entre na sua conta do Claude (abre o navegador):"; claude auth login; fi
git pull --rebase --autostash >/dev/null 2>&1
exec node painel/servidor.mjs
