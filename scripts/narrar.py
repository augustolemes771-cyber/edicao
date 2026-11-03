#!/usr/bin/env python3
"""Gera narração neural (edge-tts) com tempo exato por palavra, sem Whisper.
Uso: python3 scripts/narrar.py <projeto> <voz> <taxa> < roteiro.txt
Escreve public/projetos/<projeto>/narracao.mp3 e src/projetos/<projeto>/transcricao.json
"""
import asyncio
import json
import re
import sys
from pathlib import Path

import edge_tts

RAIZ = Path(__file__).resolve().parent.parent


async def gerar(projeto: str, voz: str, taxa: str, texto: str):
    pasta_publica = RAIZ / "public/projetos" / projeto
    pasta_publica.mkdir(parents=True, exist_ok=True)
    pasta_src = RAIZ / "src/projetos" / projeto
    pasta_src.mkdir(parents=True, exist_ok=True)

    mp3 = pasta_publica / "narracao.mp3"
    comunicar = edge_tts.Communicate(texto, voz, rate=taxa)
    palavras = []
    with open(mp3, "wb") as f:
        async for trecho in comunicar.stream():
            if trecho["type"] == "audio":
                f.write(trecho["data"])
            elif trecho["type"] == "WordBoundary":
                palavras.append(
                    {
                        "text": " " + trecho["text"],
                        "startMs": trecho["offset"] / 10000,
                        "endMs": (trecho["offset"] + trecho["duration"]) / 10000,
                        "timestampMs": None,
                        "confidence": 1,
                    }
                )

    (pasta_src / "transcricao.json").write_text(json.dumps(palavras, ensure_ascii=False, indent=1), encoding="utf8")
    print(f"Narração: {mp3} ({len(palavras)} palavras)")
    print(f"Transcrição: {pasta_src / 'transcricao.json'}")
    return mp3


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/narrar.py <projeto> [voz=pt-BR-AntonioNeural] [taxa=+12%] < roteiro.txt", file=sys.stderr)
        sys.exit(1)
    projeto = sys.argv[1]
    voz = sys.argv[2] if len(sys.argv) > 2 else "pt-BR-AntonioNeural"
    taxa = sys.argv[3] if len(sys.argv) > 3 else "+12%"
    texto = sys.stdin.read().strip()
    texto = re.sub(r"\s+", " ", texto)
    asyncio.run(gerar(projeto, voz, taxa, texto))
