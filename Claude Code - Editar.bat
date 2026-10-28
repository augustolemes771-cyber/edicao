@echo off
chcp 65001 >nul
title Claude Code - Editar videos
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs;%APPDATA%\npm"
cd /d "%USERPROFILE%\edicao-painel" || (echo Pasta do painel nao encontrada. Rode antes o "Painel - Instalar e Abrir.bat". & pause & exit /b 1)
git pull --rebase --autostash
echo.
echo Claude Code aberto na pasta do painel. Peca assim: "edite o video segundo: ..." (ele le as preferencias e as observacoes do painel).
echo.
call claude
pause
