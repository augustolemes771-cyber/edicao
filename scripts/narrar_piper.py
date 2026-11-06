#!/usr/bin/env python3
"""Gera narração com Piper TTS (100% local depois de baixado o modelo, sem WebSocket/edge-tts).

Sintetiza por FRASE (não palavra por palavra) pra manter entonação natural — a primeira versão
gerava palavra isolada por palavra, o que soa cortado/robótico (sem prosódia entre palavras).
O tempo de cada palavra dentro da frase é estimado proporcionalmente ao nº de caracteres: não é
tão preciso quanto um alinhamento fonema-a-fonema, mas o áudio fica natural, que é o que importa
mais pra legenda/vídeo (pequeno desvio de ±100-200ms por palavra é imperceptível no vídeo final).

Uso: python3 scripts/narrar_piper.py <projeto> [voz=pt_BR-faber-medium] < roteiro.txt
Escreve public/projetos/<projeto>/narracao.mp3 e src/projetos/<projeto>/transcricao.json
"""
import json
import re
import subprocess
import sys
import wave
from pathlib import Path

import numpy as np
from piper.config import SynthesisConfig
from piper.voice import PiperVoice

RAIZ = Path(__file__).resolve().parent.parent


def baixar_voz(nome: str) -> Path:
    destino = RAIZ / ".piper-voices"
    destino.mkdir(exist_ok=True)
    onnx = destino / f"{nome}.onnx"
    cfg = destino / f"{nome}.onnx.json"
    if onnx.exists() and cfg.exists():
        return onnx
    partes = nome.split("-")
    lang_country = partes[0]
    lang = lang_country.split("_")[0]
    voz_nome = partes[1]
    qualidade = partes[2]
    base = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang}/{lang_country}/{voz_nome}/{qualidade}"
    for arquivo, caminho in [(f"{nome}.onnx", onnx), (f"{nome}.onnx.json", cfg)]:
        url = f"{base}/{arquivo}"
        print(f"Baixando {url}", file=sys.stderr)
        subprocess.run(["curl", "-fL", "--progress-bar", "-o", str(caminho), url], check=True)
    return onnx


# Divide em frases por pontuação forte (. ? !), mantendo a pontuação na própria frase.
def dividir_frases(texto: str) -> list[str]:
    partes = re.split(r"(?<=[.!?])\s+", texto.strip())
    return [p.strip() for p in partes if p.strip()]


def gerar(projeto: str, nome_voz: str, texto: str):
    pasta_publica = RAIZ / "public/projetos" / projeto
    pasta_publica.mkdir(parents=True, exist_ok=True)
    pasta_src = RAIZ / "src/projetos" / projeto
    pasta_src.mkdir(parents=True, exist_ok=True)

    onnx = baixar_voz(nome_voz)
    voice = PiperVoice.load(str(onnx))
    syn_config = SynthesisConfig(length_scale=1.08)
    sr = voice.config.sample_rate

    frases = dividir_frases(texto)
    pausa_frase_s = 0.35
    silencio_inicial_s = 0.15

    audio_total = [np.zeros(int(sr * silencio_inicial_s), dtype=np.float32)]
    entradas = []
    t_ms = silencio_inicial_s * 1000

    for frase in frases:
        chunks = list(voice.synthesize(frase, syn_config=syn_config))
        audio_frase = np.concatenate([c.audio_float_array for c in chunks]) if chunks else np.zeros(0, dtype=np.float32)
        dur_ms = (len(audio_frase) / sr) * 1000 if sr else 0
        if dur_ms <= 0:
            continue
        audio_total.append(audio_frase)

        # Distribui a duração real da frase entre as palavras, proporcional ao nº de caracteres
        # (palavras maiores demoram mais, aproximação razoável sem precisar de alinhamento fonético).
        palavras = frase.split()
        pesos = [max(len(w), 2) for w in palavras]
        soma_pesos = sum(pesos)
        cursor_ms = t_ms
        for w, peso in zip(palavras, pesos):
            dur_palavra = dur_ms * (peso / soma_pesos)
            entradas.append({"text": " " + w, "startMs": round(cursor_ms), "endMs": round(cursor_ms + dur_palavra), "timestampMs": None, "confidence": 1})
            cursor_ms += dur_palavra

        t_ms += dur_ms + pausa_frase_s * 1000
        audio_total.append(np.zeros(int(sr * pausa_frase_s), dtype=np.float32))

    audio_final = np.concatenate(audio_total) if audio_total else np.zeros(0, dtype=np.float32)
    wav_path = pasta_publica / "narracao.wav"
    mp3_path = pasta_publica / "narracao.mp3"

    pcm16 = np.clip(audio_final * 32767, -32768, 32767).astype(np.int16)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm16.tobytes())
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav_path), str(mp3_path)], check=True)
    wav_path.unlink()

    (pasta_src / "transcricao.json").write_text(json.dumps(entradas, ensure_ascii=False, indent=1), encoding="utf8")
    print(f"Narração: {mp3_path} ({len(entradas)} palavras, {len(frases)} frases, {t_ms/1000:.1f}s)")
    print(f"Transcrição: {pasta_src / 'transcricao.json'}")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python3 scripts/narrar_piper.py <projeto> [voz=pt_BR-faber-medium] < roteiro.txt", file=sys.stderr)
        sys.exit(1)
    projeto = sys.argv[1]
    voz = sys.argv[2] if len(sys.argv) > 2 else "pt_BR-faber-medium"
    texto = sys.stdin.read().strip()
    texto = re.sub(r"\s+", " ", texto)
    gerar(projeto, voz, texto)
