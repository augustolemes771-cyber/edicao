#!/usr/bin/env python3
"""Gera narração com a API da ElevenLabs (voz neural de nuvem, HTTPS normal, sem WebSocket).
Usa o endpoint with-timestamps, que devolve alinhamento por CARACTERE — dá pra calcular o tempo
exato de cada palavra sem precisar de alinhamento fonético aproximado (muito mais preciso que o
Piper por frase).

Precisa da variável de ambiente ELEVENLABS_API_KEY. NUNCA escreva a chave num arquivo do repo.

Uso: python3 scripts/narrar_elevenlabs.py <projeto> [voice_id] < roteiro.txt
Sem voice_id, lista as vozes disponíveis na conta e usa a primeira de categoria "premade"
(ou a indicada) — imprime a lista pra você escolher numa próxima rodada se quiser outra.
Escreve public/projetos/<projeto>/narracao.mp3 e src/projetos/<projeto>/transcricao.json
"""
import base64
import json
import os
import re
import sys
from pathlib import Path

import requests

RAIZ = Path(__file__).resolve().parent.parent
API = "https://api.elevenlabs.io/v1"


def cabecalho():
    chave = os.environ.get("ELEVENLABS_API_KEY")
    if not chave:
        print("Defina ELEVENLABS_API_KEY no ambiente antes de rodar.", file=sys.stderr)
        sys.exit(1)
    return {"xi-api-key": chave}


def listar_vozes():
    r = requests.get(f"{API}/voices", headers=cabecalho(), timeout=30)
    r.raise_for_status()
    vozes = r.json().get("voices", [])
    for v in vozes:
        print(f"  {v.get('voice_id')}  {v.get('name')}  ({v.get('category')})", file=sys.stderr)
    return vozes


def escolher_voz(voice_id_pedido: str | None) -> str:
    vozes = listar_vozes()
    if voice_id_pedido:
        for v in vozes:
            if v.get("voice_id") == voice_id_pedido or v.get("name", "").lower() == voice_id_pedido.lower():
                print(f"Usando voz: {v.get('name')} ({v.get('voice_id')})", file=sys.stderr)
                return v.get("voice_id")
        print(f"Voz '{voice_id_pedido}' não encontrada na lista acima — pare e me avise.", file=sys.stderr)
        sys.exit(1)
    # Sem pedido: prioriza voz masculina premade e grave (heurística pelo nome; ajuste se sair errado).
    preferidas = ["adam", "antoni", "arnold", "josh", "daniel", "charlie", "george"]
    premade = [v for v in vozes if v.get("category") == "premade"]
    for nome in preferidas:
        for v in premade:
            if nome in v.get("name", "").lower():
                print(f"Usando voz padrão: {v.get('name')} ({v.get('voice_id')})", file=sys.stderr)
                return v.get("voice_id")
    if premade:
        v = premade[0]
        print(f"Usando primeira voz premade disponível: {v.get('name')} ({v.get('voice_id')})", file=sys.stderr)
        return v.get("voice_id")
    print("Nenhuma voz premade encontrada — pare e me avise com a lista impressa acima.", file=sys.stderr)
    sys.exit(1)


def gerar(projeto: str, voice_id_pedido: str | None, texto: str):
    pasta_publica = RAIZ / "public/projetos" / projeto
    pasta_publica.mkdir(parents=True, exist_ok=True)
    pasta_src = RAIZ / "src/projetos" / projeto
    pasta_src.mkdir(parents=True, exist_ok=True)

    voice_id = escolher_voz(voice_id_pedido)

    r = requests.post(
        f"{API}/text-to-speech/{voice_id}/with-timestamps",
        headers={**cabecalho(), "Content-Type": "application/json"},
        json={
            "text": texto,
            "model_id": "eleven_multilingual_v2",
            "voice_settings": {"stability": 0.55, "similarity_boost": 0.8, "style": 0.35, "use_speaker_boost": True},
        },
        timeout=120,
    )
    if r.status_code != 200:
        print(f"Erro {r.status_code} da API: {r.text[:800]}", file=sys.stderr)
        sys.exit(1)
    dados = r.json()
    audio_bytes = base64.b64decode(dados["audio_base64"])
    alinhamento = dados["alignment"]
    chars = alinhamento["characters"]
    inicio_s = alinhamento["character_start_times_seconds"]
    fim_s = alinhamento["character_end_times_seconds"]

    mp3_path = pasta_publica / "narracao.mp3"
    mp3_path.write_bytes(audio_bytes)

    # Reconstroi palavras a partir dos caracteres alinhados (separadas por espaço/quebra de linha).
    entradas = []
    palavra_chars = []
    palavra_ini = None
    for ch, ti, tf in zip(chars, inicio_s, fim_s):
        if ch.strip() == "":
            if palavra_chars:
                entradas.append({"text": " " + "".join(palavra_chars), "startMs": round(palavra_ini * 1000), "endMs": round(ultimo_fim * 1000), "timestampMs": None, "confidence": 1})
                palavra_chars = []
                palavra_ini = None
            continue
        if palavra_ini is None:
            palavra_ini = ti
        palavra_chars.append(ch)
        ultimo_fim = tf
    if palavra_chars:
        entradas.append({"text": " " + "".join(palavra_chars), "startMs": round(palavra_ini * 1000), "endMs": round(ultimo_fim * 1000), "timestampMs": None, "confidence": 1})

    (pasta_src / "transcricao.json").write_text(json.dumps(entradas, ensure_ascii=False, indent=1), encoding="utf8")
    dur = fim_s[-1] if fim_s else 0
    print(f"Narração: {mp3_path} ({len(entradas)} palavras, {dur:.1f}s)")
    print(f"Transcrição: {pasta_src / 'transcricao.json'}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/narrar_elevenlabs.py <projeto> [voice_id_ou_nome] < roteiro.txt", file=sys.stderr)
        sys.exit(1)
    projeto = sys.argv[1]
    voice_id_pedido = sys.argv[2] if len(sys.argv) > 2 else None
    texto = sys.stdin.read().strip()
    texto = re.sub(r"\s+", " ", texto)
    gerar(projeto, voice_id_pedido, texto)
