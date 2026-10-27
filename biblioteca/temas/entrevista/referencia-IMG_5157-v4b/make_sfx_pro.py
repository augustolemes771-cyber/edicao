"""Premium SFX kit (48 kHz stereo 24-bit WAV), pure numpy/scipy synthesis. No bells/chimes/coins.

    python tools/make_sfx_pro.py assets/sfx_pro
"""
import sys
import wave
from pathlib import Path

import numpy as np
from scipy import signal

SR = 48000
rng = np.random.default_rng(11)
PEAK = 10 ** (-3 / 20)


def T(d):
    return np.arange(int(d * SR)) / SR


def exp_env(t, a, tau):
    return np.clip(t / max(a, 1e-4), 0, 1) * np.exp(-np.maximum(t - a, 0) / tau)


def sos(kind, f, x, order=2):
    return signal.sosfilt(signal.butter(order, f, kind, fs=SR, output="sos"), x, axis=0)


def bn(n, lo, hi, order=2):
    return sos("band", [lo, hi], rng.standard_normal(n), order)


def sweep_noise(n, f0, f1, q=1.2, seed=None):
    """Band-pass filtered noise, centre frequency sweeping f0->f1 (chunked biquads with state)."""
    r = np.random.default_rng(seed) if seed is not None else rng
    x = r.standard_normal(n)
    y = np.zeros(n)
    zi = None
    blk = 256
    fc = np.geomspace(f0, f1, n // blk + 1)
    for i, s in enumerate(range(0, n, blk)):
        f = min(fc[i], SR * 0.45)
        b, a = signal.iirpeak(f, q, fs=SR)
        if zi is None:
            zi = np.zeros(max(len(a), len(b)) - 1)
        seg, zi = signal.lfilter(b, a, x[s:s + blk], zi=zi)
        y[s:s + blk] = seg
    return y / (np.std(y) + 1e-9)


def tone(t, f0, f1=None, tau_p=0.05):
    """Sine with exponential pitch fall from f0 to f1."""
    f1 = f0 if f1 is None else f1
    f = f1 + (f0 - f1) * np.exp(-t / tau_p)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def sat(x, d=1.5):
    return np.tanh(d * x) / np.tanh(d)


def reverb(x, dur=0.5, lp=5000, wet=0.3, seed=3):
    r = np.random.default_rng(seed)
    n = int(dur * SR)
    t = np.arange(n) / SR
    ir = sos("low", lp, r.standard_normal(n) * np.exp(-t / (dur / 4.5)))
    k = int(0.004 * SR)
    ir[:k] *= np.linspace(0, 1, k)
    ir /= np.sqrt(np.sum(ir ** 2))
    return x + wet * signal.fftconvolve(x, ir[:, None] if x.ndim == 2 else ir, axes=0)[: len(x)]


def mono2(x, w=0.35):
    """Mono -> stereo with a tiny Haas delay on the right, blended by w."""
    d = int(0.0007 * SR)
    r = np.roll(x, d)
    r[:d] = 0
    return np.stack([x * (1 - w * 0.3) + w * 0.3 * r, r * (1 - w * 0.3) + w * 0.3 * x], 1)


def pan_noise(n, f0, f1, q=1.0):
    return np.stack([sweep_noise(n, f0, f1, q, seed=21), sweep_noise(n, f0, f1, q, seed=22)], 1)


def finish(x, dur, fade=0.004, lpf=9500, hp=22):
    n = int(dur * SR)
    if x.ndim == 1:
        x = np.stack([x, x], 1)
    x = x[:n]
    if len(x) < n:
        x = np.pad(x, ((0, n - len(x)), (0, 0)))
    x = sos("low", lpf, x, 4)
    x = sos("high", hp, x, 2)
    x = x - x.mean(0)
    f = int(fade * SR)
    x[:f] *= np.linspace(0, 1, f)[:, None]
    x[-f:] *= np.linspace(1, 0, f)[:, None]
    return x * (PEAK / np.max(np.abs(x)))


# ---------------- sounds ----------------
def sub_hit():
    t = T(1.0)
    sub = tone(t, 130, 38, 0.09) * exp_env(t, 0.002, 0.28)
    body = tone(t, 70, 44, 0.2) * exp_env(t, 0.003, 0.35)
    click = bn(len(t), 600, 2800) * exp_env(t, 0.0005, 0.012)
    air = bn(len(t), 150, 2500) * exp_env(t, 0.004, 0.18) * 0.25
    x = sat(sub * 0.9 + body * 0.6, 2.0) + click * 0.5 + air
    return reverb(mono2(x, 0.3), 0.6, 3500, 0.18)


def whoosh(d, f0, f1, gain=1.0):
    n = int(d * SR)
    t = np.arange(n) / SR
    env = np.sin(np.pi * np.clip(t / d, 0, 1)) ** 2.2
    y = pan_noise(n, f0, f1, 0.9)
    low = pan_noise(n, f0 * 0.4, f1 * 0.5, 0.7)
    return (y * 0.7 + low * 0.5) * env[:, None] * gain


def swipe_glass():
    d = 0.35
    n = int(d * SR)
    t = np.arange(n) / SR
    env = (np.sin(np.pi * np.clip(t / d, 0, 1)) ** 1.6)[:, None]
    return pan_noise(n, 900, 3600, 2.5) * env * 0.6 + pan_noise(n, 300, 900, 0.8) * env * 0.6


def ui_tick():
    t = T(0.09)
    k = bn(len(t), 900, 3200) * exp_env(t, 0.0005, 0.006)
    b = tone(t, 320, 190, 0.012) * exp_env(t, 0.0008, 0.02)
    return mono2(k * 0.7 + b * 0.8, 0.2)


def ui_pop():
    t = T(0.16)
    b = tone(t, 520, 190, 0.03) * exp_env(t, 0.002, 0.045)
    n = bn(len(t), 300, 1500) * exp_env(t, 0.001, 0.01) * 0.3
    return reverb(mono2(sat(b, 1.4) + n, 0.3), 0.12, 2500, 0.15)


def card_land():
    t = T(0.30)
    th = tone(t, 190, 70, 0.025) * exp_env(t, 0.001, 0.07)
    n = bn(len(t), 250, 1800) * exp_env(t, 0.0008, 0.015) * 0.6
    air = bn(len(t), 400, 4000) * exp_env(t, 0.03, 0.09) * 0.12
    return reverb(mono2(sat(th, 1.8) + n + air, 0.4), 0.3, 3000, 0.25)


def counter_run():
    d = 1.45
    t = T(d)
    n = len(t)
    out = np.zeros(n)
    times, tt, gap = [], 0.02, 0.17
    while tt < d - 0.12:
        times.append(tt)
        tt += gap
        gap = max(gap * 0.90, 0.034)
    m = T(0.05)
    for ts in times:
        p = ts / d
        f = 260 * 2 ** (p * 1.9)
        tk = (tone(m, f * 1.5, f, 0.01) * exp_env(m, 0.0005, 0.012) * 0.8
              + bn(len(m), 800, 3000) * exp_env(m, 0.0003, 0.004) * 0.35)
        s = int(ts * SR)
        out[s:s + len(m)] += tk[: n - s] * (0.6 + 0.4 * p)
    g = (t / d) ** 2.2
    sw = (sos("low", 400, rng.standard_normal(n), 2) * 1.5 + tone(t, 55, 110, 0.7)) * g * 0.5
    air = sweep_noise(n, 300, 2800, 0.8, seed=9) * (t / d) ** 2 * 0.22
    x = (out + sw + air) * np.clip((d - t) / 0.06, 0, 1)
    return reverb(mono2(x, 0.4), 0.25, 3000, 0.15)


def counter_land():
    t = T(0.6)
    s = tone(t, 110, 42, 0.07) * exp_env(t, 0.002, 0.2)
    air = pan_noise(len(t), 2200, 500, 0.7) * exp_env(t, 0.01, 0.18)[:, None] * 0.28
    return reverb(mono2(sat(s, 1.8), 0.2) + air, 0.4, 3000, 0.2)


def energy_pulse():
    d = 0.7
    t = T(d)
    env = np.sin(np.pi * np.clip(t / d, 0, 1) ** 0.8) ** 2
    pad = (tone(t, 82, 164, 0.5) + 0.5 * tone(t, 123, 246, 0.5)) * env * 0.5
    air = pan_noise(len(t), 400, 3000, 1.0) * env[:, None] * 0.35
    return reverb(mono2(sat(pad, 1.3), 0.4) + air, 0.35, 3000, 0.2)


def phrase_hit():
    t = T(0.8)
    th = tone(t, 150, 52, 0.06) * exp_env(t, 0.002, 0.2)
    crack = bn(len(t), 700, 4500) * exp_env(t, 0.0005, 0.02)
    air = pan_noise(len(t), 3000, 700, 0.8) * exp_env(t, 0.005, 0.2)[:, None] * 0.35
    return reverb(mono2(sat(th, 2.0) * 0.9 + crack * 0.45, 0.3) + air, 0.5, 3200, 0.22)


def riser():
    d = 2.7
    t = T(d)
    n = len(t)
    g = (t / d) ** 2.0
    noise = pan_noise(n, 200, 4500, 1.1) * g[:, None] * 0.8
    f = 55 * 2 ** (t / d * 1.8)
    ph = 2 * np.pi * np.cumsum(f) / SR
    ton = np.sin(ph) * g * 0.7 + np.sin(1.5 * ph) * g ** 1.5 * 0.2
    tail = np.clip((d - t) / 0.08, 0, 1)
    return (mono2(sat(ton, 1.3), 0.3) + noise) * tail[:, None]


def type_soft():
    d = 1.4
    n = int(d * SR)
    out = np.zeros(n)
    ts = 0.05
    m = T(0.06)
    while ts < d - 0.1:
        f = rng.uniform(220, 380)
        k = (tone(m, f * 1.3, f, 0.008) * exp_env(m, 0.0005, 0.012) * 0.7
             + bn(len(m), 700, 2600) * exp_env(m, 0.0003, 0.005) * 0.3)
        s = int(ts * SR)
        out[s:s + len(m)] += k[: n - s] * rng.uniform(0.45, 0.9)
        ts += rng.uniform(0.07, 0.15)
    return mono2(out, 0.25)


def logo_sting():
    d = 2.0
    t = T(d)
    boom = tone(t, 100, 40, 0.12) * exp_env(t, 0.003, 0.6)
    air = pan_noise(len(t), 300, 2600, 0.7) * (np.sin(np.pi * np.clip(t / 1.6, 0, 1)) ** 2)[:, None] * 0.4
    pe = np.clip(t / 0.5, 0, 1) ** 2 * np.exp(-np.maximum(t - 0.5, 0) / 0.7)
    pad = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(110, 0), (165, 1), (220.7, 2), (277.2, 3), (329.6, 4)]) * pe * 0.12
    pad = sos("low", 1500, pad, 2)
    return reverb(mono2(sat(boom, 1.8) * 0.9 + pad, 0.5) + air, 1.0, 3500, 0.3)


def coin_soft():
    """Damped gold-bar thud: low inharmonic partials with fast decay, no ringing highs."""
    t = T(0.5)
    body = sum(a * np.sin(2 * np.pi * f * t) * np.exp(-t / tau)
               for f, a, tau in [(310, 1, 0.07), (487, 0.6, 0.05), (731, 0.4, 0.035), (1130, 0.2, 0.02)])
    body *= np.clip(t / 0.0008, 0, 1)
    th = tone(t, 140, 60, 0.03) * exp_env(t, 0.001, 0.12)
    n = bn(len(t), 500, 3000) * exp_env(t, 0.0004, 0.01) * 0.5
    return reverb(mono2(sat(body * 0.5 + th * 0.8, 1.5) + n, 0.3), 0.25, 2800, 0.2)


KIT = [
    ("pro_sub_hit", 1.0, sub_hit),
    ("pro_whoosh", 0.55, lambda: whoosh(0.55, 350, 3500)),
    ("pro_whoosh_short", 0.28, lambda: whoosh(0.28, 500, 3200, 0.8)),
    ("pro_swipe_glass", 0.35, swipe_glass),
    ("pro_ui_tick", 0.09, ui_tick),
    ("pro_ui_pop", 0.16, ui_pop),
    ("pro_card_land", 0.30, card_land),
    ("pro_counter_run", 1.45, counter_run),
    ("pro_counter_land", 0.6, counter_land),
    ("pro_energy_pulse", 0.7, energy_pulse),
    ("pro_phrase_hit", 0.8, phrase_hit),
    ("pro_riser", 2.7, riser),
    ("pro_type_soft", 1.4, type_soft),
    ("pro_logo_sting", 2.0, logo_sting),
    ("pro_coin_soft", 0.5, coin_soft),
]


def write24(path, x):
    q = np.clip(np.round(x * 8388607), -8388608, 8388607).astype("<i4")
    b = q.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes()
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(3)
        w.setframerate(SR)
        w.writeframes(b)


def main():
    out = Path(sys.argv[1] if len(sys.argv) > 1 else "assets/sfx_pro")
    out.mkdir(parents=True, exist_ok=True)
    for name, d, fn in KIT:
        write24(out / f"{name}.wav", finish(fn(), d, 0.002 if d < 0.2 else 0.004))
        print("ok", name)


if __name__ == "__main__":
    main()
