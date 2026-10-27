#!/usr/bin/env bash
PASTA="$HOME/edicao-painel"
command -v git >/dev/null || xcode-select --install
[ -d "$PASTA/.git" ] || git clone -b claude/upbeat-pascal-lv0g2w https://github.com/augustolemes771-cyber/edicao.git "$PASTA" || exit 1
cd "$PASTA" && git checkout claude/upbeat-pascal-lv0g2w -q; git pull --rebase --autostash -q
exec bash scripts/abrir-painel.sh
