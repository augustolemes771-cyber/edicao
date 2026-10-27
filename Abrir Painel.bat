@echo off
cd /d "%~dp0"
where node >nul 2>&1 || (echo Instale o Node.js em https://nodejs.org e clique de novo. & pause & exit /b)
if not exist node_modules call npm install
where claude >nul 2>&1 || call npm i -g @anthropic-ai/claude-code
claude auth status >nul 2>&1 || claude auth login
node painel\servidor.mjs
