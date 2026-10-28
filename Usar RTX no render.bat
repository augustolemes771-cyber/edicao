@echo off
chcp 65001 >nul
title Usar a RTX no render
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\nodejs"
cd /d "%USERPROFILE%\edicao-painel" || (echo Pasta do painel nao encontrada. & pause & exit /b 1)
git pull --rebase --autostash
node scripts\gpu-forte.mjs
echo.
echo Pronto. Pode fechar esta janela (o painel continua aberto).
pause
