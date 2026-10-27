@echo off
chcp 65001 >nul
title Painel de Edicao
set "PASTA=%USERPROFILE%\edicao-painel"
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs;%APPDATA%\npm"
where git >nul 2>&1 || (echo Instalando o Git... & winget install -e --id Git.Git --silent --accept-package-agreements --accept-source-agreements)
where node >nul 2>&1 || (echo Instalando o Node.js... & winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements)
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs;%APPDATA%\npm"
where git >nul 2>&1 || (echo Nao consegui instalar o Git. Instale em https://git-scm.com e abra este arquivo de novo. & pause & exit /b 1)
where node >nul 2>&1 || (echo Nao consegui instalar o Node. Instale em https://nodejs.org e abra este arquivo de novo. & pause & exit /b 1)
if not exist "%PASTA%\.git" git clone -b claude/upbeat-pascal-lv0g2w https://github.com/augustolemes771-cyber/edicao.git "%PASTA%"
cd /d "%PASTA%" || (pause & exit /b 1)
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Painel de Edicao.lnk'); $s.TargetPath='%PASTA%\Painel - Instalar e Abrir.bat'; $s.WorkingDirectory='%PASTA%'; $s.Save()" >nul 2>&1
git checkout claude/upbeat-pascal-lv0g2w >nul 2>&1
git pull --rebase --autostash >nul 2>&1
if not exist node_modules (echo Primeira vez: instalando, pode demorar alguns minutos... & call npm install)
where claude >nul 2>&1 || (echo Instalando o Claude Code... & call npm i -g @anthropic-ai/claude-code)
claude auth status >nul 2>&1 || (echo Entre na sua conta do Claude... & claude auth login)
node painel\servidor.mjs
pause
