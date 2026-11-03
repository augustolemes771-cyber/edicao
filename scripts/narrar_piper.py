#!/usr/bin/env python3
"""Gera narração com Piper TTS (100% local depois de baixado o modelo, sem WebSocket/edge-tts)
com tempo exato por palavra. Sintetiza PALAVRA A PALAVRA (sem pausa extra entre elas) pra ter
o limite exato de cada uma sem precisar de alinhamento fonema->palavra.

Uso: python3 scripts/narrar_piper.py <projeto> [voz=pt_BR-faber-medium] < roteiro.txt
Escreve public/projetos/<projeto>/narracao.mp3 (convertido de wav) e
src/projetos/<projeto>/transcricao.json
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
from piper.voice import PiperVoice
from piper.config import SynthesisConfig

RAIZ = Path(__file__).resolve().parent.parent


def baixar_voz(nome: str) -> Path:
    """Baixa o modelo .onnx + .json da voz se ainda não existir, via huggingface (HTTPS normal, sem WebSocket)."""
    destino = RAIZ / ".piper-voices"
    destino.mkdir(exist_ok=True)
    onnx = destino / f"{nome}.onnx"
    cfg = destino / f"{nome}.onnx.json"
    if onnx.exists() and cfg.exists():
        return onnx
    # Nome tipo "pt_BR-faber-medium" -> idioma pt, país BR, voz faber, qualidade medium.
    partes = nome.split("-")
    lang_country = partes[0]  # pt_BR
    lang = lang_country.split("_")[0]  # pt
    voz_nome = partes[1]
    qualidade = partes[2]
    base = f"https://huggingface.co/rhasspy/piper-voices/resolve/main/{lang}/{lang_country}/{voz_nome}/{qualidade}"
    for arquivo, caminho in [(f"{nome}.onnx", onnx), (f"{nome}.onnx.json", cfg)]:
        url = f"{base}/{arquivo}"
        print(f"Baixando {url}", file=sys.stderr)
        subprocess.run(["curl", "-fL", "--progress-bar", "-o", str(caminho), url], check=True)
    return onnx


def gerar(projeto: str, nome_voz: str, texto: str):
    pasta_publica = RAIZ / "public/projetos" / projeto
    pasta_publica.mkdir(parents=True, exist_ok=True)
    pasta_src = RAIZ / "src/projetos" / projeto
    pasta_src.mkdir(parents=True, exist_ok=True)

    onnx = baixar_voz(nome_voz)
    voice = PiperVoice.load(str(onnx))
    syn_config = SynthesisConfig(length_scale=1.08)

    # Tokeniza preservando pontuação grudada na palavra (igual ao formato do transcricao.json existente).
    palavras_txt = texto.split()

    sr = voice.config.sample_rate
    gap_s = 0.06  # respiro curto entre palavras, REALMENTE inserido no áudio (antes só contava no tempo, não no som)
    gap_samples = np.zeros(int(sr * gap_s), dtype=np.float32)
    silencio_inicial_s = 0.08
    audio_total = [np.zeros(int(sr * silencio_inicial_s), dtype=np.float32)]
    entradas = []
    t_ms = silencio_inicial_s * 1000

    for w in palavras_txt:
        chunks = list(voice.synthesize(w, syn_config=syn_config))
        audio_palavra = np.concatenate([c.audio_float_array for c in chunks]) if chunks else np.zeros(0, dtype=np.float32)
        dur_ms = (len(audio_palavra) / sr) * 1000 if sr else 0
        if dur_ms <= 0:
            continue
        audio_total.append(audio_palavra)
        entradas.append({"text": " " + w, "startMs": round(t_ms), "endMs": round(t_ms + dur_ms), "timestampMs": None, "confidence": 1})
        t_ms += dur_ms + gap_s * 1000
        audio_total.append(gap_samples)

    audio_final = np.concatenate(audio_total) if audio_total else np.zeros(0, dtype=np.float32)
    wav_path = pasta_publica / "narracao.wav"
    mp3_path = pasta_publica / "narracao.mp3"
    import wave

    pcm16 = np.clip(audio_final * 32767, -32768, 32767).astype(np.int16)
    with wave.open(str(wav_path), "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm16.tobytes())
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(wav_path), str(mp3_path)], check=True)
    wav_path.unlink()

    (pasta_src / "transcricao.json").write_text(json.dumps(entradas, ensure_ascii=False, indent=1), encoding="utf8")
    print(f"Narração: {mp3_path} ({len(entradas)} palavras, {t_ms/1000:.1f}s)")
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
