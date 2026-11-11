# Musique d'ambiance inquiétante (synthèse numpy) : nappe Rém - Si♭ - Solm - La (8 s par accord), cloches lointaines
# éparses, écho de forêt. ambient(dur, seed) -> mono float64 à 48 kHz, crête ~1. Aperçu : python ambient.py 30 apercu.wav
import subprocess, sys
import numpy as np

SR = 48000
CHORDS = [[50, 53, 57, 62], [46, 50, 53, 58], [43, 46, 50, 55], [45, 49, 52, 57]]  # midi : Dm, Bb, Gm, A
BELLS = [74, 77, 81, 76, 74, 72, 69, 70]  # ré5 fa5 la5 mi5 ré5 do5 la4 si♭4

def midi(m): return 440 * 2 ** ((m - 69) / 12)

def _lp(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    b = 1 - a
    for i in range(0, len(x), 4096):  # IIR 1 pôle par blocs (numpy pur)
        seg = x[i:i + 4096]; out = np.empty_like(seg)
        for j, v in enumerate(seg): s = a * s + b * v; out[j] = s
        y[i:i + 4096] = out
    return y

def ambient(dur, seed=5):
    n = int(dur * SR); t = np.arange(n) / SR; rng = np.random.default_rng(seed)
    pad = np.zeros(n)
    for k in range(int(np.ceil(dur / 8)) + 1):
        a0 = k * 8.0; ch = CHORDS[k % 4]
        i0, i1 = int(max(0, a0 - 1.5) * SR), min(n, int((a0 + 9.5) * SR))
        if i0 >= n: break
        x = t[i0:i1]; e = np.clip(np.minimum((x - (a0 - 1.5)) / 2.5, (a0 + 9.5 - x) / 2.5), 0, 1)
        for m in ch:
            f = midi(m - 12)
            for det in (-0.12, 0.0, 0.11):  # 3 voix légèrement désaccordées (chorus)
                ph = 2 * np.pi * f * (1 + det / 100) * x + rng.uniform(0, 6)
                pad[i0:i1] += (np.sin(ph) + 0.35 * np.sin(2 * ph) + 0.12 * np.sin(3 * ph)) * e / 3
    pad *= 0.75 + 0.25 * np.sin(2 * np.pi * 0.07 * t)          # respiration lente
    pad = _lp(pad, 700)
    bells = np.zeros(n)
    p, i = 3.0, 0
    while p < dur - 2:
        f = midi(BELLS[i % len(BELLS)]); L = int(3.5 * SR); x = np.arange(L) / SR
        s = (np.sin(2 * np.pi * f * x) + 0.4 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 3)) * np.exp(-x * 1.4)
        j = int(p * SR); bells[j:j + L] += s[: max(0, min(L, n - j))]
        p += rng.choice([2.5, 3.5, 4.0, 5.5]); i += 1
    for d, g in ((0.29, 0.45), (0.61, 0.3), (1.13, 0.18)):     # écho de forêt
        k = int(d * SR); bells[k:] += bells[:-k] * g
    y = pad / (np.abs(pad).max() + 1e-9) + 0.22 * bells / (np.abs(bells).max() + 1e-9)
    return y / (np.abs(y).max() + 1e-9)

if __name__ == "__main__":
    d = float(sys.argv[1]) if len(sys.argv) > 1 else 30
    y = ambient(d) * 0.5
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", sys.argv[2] if len(sys.argv) > 2 else "apercu.wav"], input=y.tobytes(), check=True)
