@echo off
chcp 65001 >nul
title Painel de Edicao
set "PASTA=%USERPROFILE%\edicao-painel"
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs;%APPDATA%\npm"
where git >nul 2>&1
if errorlevel 1 (
  echo Instalando o Git...
  winget install -e --id Git.Git --silent --accept-package-agreements --accept-source-agreements
)
where node >nul 2>&1
if errorlevel 1 (
  echo Instalando o Node.js...
  winget install -e --id OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
)
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs;%APPDATA%\npm"
where git >nul 2>&1
if errorlevel 1 goto semgit
where node >nul 2>&1
if errorlevel 1 goto semnode
if not exist "%PASTA%\.git" (
  echo Baixando o painel...
  git clone -b claude/upbeat-pascal-lv0g2w https://github.com/augustolemes771-cyber/edicao.git "%PASTA%"
)
if not exist "%PASTA%\.git" goto falha
cd /d "%PASTA%"
git checkout claude/upbeat-pascal-lv0g2w
git pull --rebase --autostash
powershell -NoProfile -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut([Environment]::GetFolderPath('Desktop')+'\Painel de Edicao.lnk'); $s.TargetPath='%PASTA%\Painel - Instalar e Abrir.bat'; $s.WorkingDirectory='%PASTA%'; $s.Save()" >nul 2>&1
if not exist node_modules (
  echo Primeira vez: instalando, pode demorar alguns minutos...
  call npm install
)
where claude >nul 2>&1
if errorlevel 1 (
  echo Instalando o Claude Code...
  call npm i -g @anthropic-ai/claude-code
)
call claude auth status >nul 2>&1
if errorlevel 1 (
  echo Entre na sua conta do Claude. O navegador vai abrir...
  call claude auth login
)
echo.
echo Abrindo o painel. Nao feche esta janela enquanto estiver editando.
node scripts\supervisor.mjs
goto fim
:semgit
echo Nao consegui instalar o Git. Instale em https://git-scm.com e abra este arquivo de novo.
goto fim
:semnode
echo Nao consegui instalar o Node. Instale em https://nodejs.org e abra este arquivo de novo.
goto fim
:falha
echo Nao consegui baixar o painel. Veja a mensagem acima.
:fim
echo.
pause
