# Musique « légèrement épique » (synthèse numpy) : reprend la nappe sombre + cloches d'ambient.py et ajoute, en montée
# progressive : ostinato de cordes graves (croches, 90 BPM, 3 mesures par accord = 8 s), tambours graves type taiko,
# nappes de cuivres en crescendo. Retenue : la voix reste devant ; tout est piloté par des repères en secondes.
# epic(dur, cues) -> mono float64 48 kHz, crête ~1. cues : strings, drums, full, dip, end (s). Aperçu : python epic.py 70 apercu.wav
import os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambient import ambient, SR, CHORDS, midi, _lp

BEAT = 60 / 90  # 0,667 s ; 12 croches par accord de 8 s

def ramp(t, a, b):  # 0 avant a, 1 après b (lissé)
    u = np.clip((t - a) / max(1e-6, b - a), 0, 1); return u * u * (3 - 2 * u)

def saw(f, x, nh=10):
    return sum(np.sin(2 * np.pi * f * k * x) / k * (1 - k / (nh + 2)) for k in range(1, nh + 1))

def epic(dur, cues, seed=5):
    n = int(dur * SR); t = np.arange(n) / SR; rng = np.random.default_rng(seed)
    base = ambient(dur, seed)
    # ostinato de cordes : motif sur la fondamentale de l'accord (oct. 2), accent sur les temps
    ost = np.zeros(n); step = BEAT / 2; L = int(step * 0.95 * SR); x = np.arange(L) / SR
    env = np.clip(x / 0.012, 0, 1) * np.exp(-x * 4.5)
    PAT = [0, 0, 12, 0, 7, 0, 12, 7]
    k = 0
    while k * step < dur:
        t0 = k * step; root = CHORDS[int(t0 // 8) % 4][0] - 12
        s = saw(midi(root + PAT[k % 8]), x, 8) * env * (1.0 if k % 2 == 0 else 0.65)
        i = int(t0 * SR); j = min(n, i + L); ost[i:j] += s[: j - i]; k += 1
    ost = _lp(ost, 900)
    # tambours graves : temps 1 et « et » du 3 ; double frappe en fin de cycle d'accord
    drum = np.zeros(n); D = int(1.2 * SR); xd = np.arange(D) / SR
    body = np.sin(2 * np.pi * np.cumsum(42 + 75 * np.exp(-xd * 22)) / SR) * np.exp(-xd * 5)
    click = np.convolve(rng.standard_normal(D), np.ones(30) / 30, "same") * np.exp(-xd * 40) * 2.5
    hitw = body + click
    bar = 4 * BEAT; b = 0
    while b * bar < dur:
        for off, g in ((0, 1.0), (2.5 * BEAT, 0.6)) + (((3 * BEAT, 0.5), (3.5 * BEAT, 0.7)) if b % 3 == 2 else ()):
            i = int((b * bar + off) * SR); j = min(n, i + D)
            if i < n: drum[i:j] += hitw[: j - i] * g
        b += 1
    # cuivres : quinte + octave de l'accord, gonflement sur 2 mesures
    brass = np.zeros(n)
    for c in range(int(dur // 8) + 1):
        t0 = c * 8.0; ch = CHORDS[c % 4]; i0 = int(t0 * SR); i1 = min(n, int((t0 + 8) * SR))
        if i0 >= n: break
        xb = t[i0:i1] - t0; e = np.sin(np.pi * np.clip(xb / 8, 0, 1)) ** 2
        for m, g in ((ch[0] - 12, 1.0), (ch[0] - 5, 0.7), (ch[0], 0.5)):
            brass[i0:i1] += saw(midi(m) * (1 + 0.0015 * np.sin(2 * np.pi * 5 * xb)), xb, 8) * e * g
    brass = _lp(brass, 1100)
    nz = lambda v: v / (np.abs(v).max() + 1e-9)
    c = cues
    g_ost = 0.10 + 0.32 * ramp(t, c["strings"], c["strings"] + 6) + 0.12 * ramp(t, c["full"] - 4, c["full"])
    g_drum = 0.55 * ramp(t, c["drums"] - 0.5, c["drums"] + 8) + 0.25 * ramp(t, c["full"] - 4, c["full"])
    g_brass = 0.30 * ramp(t, c["full"] - 6, c["full"] + 2)
    # après « vingt-trois » : on retombe (ostinato + battement de cœur des tambours), extinction finale
    after = ramp(t, c["dip"] + 0.8, c["dip"] + 2.5)
    g_ost *= 1 - 0.35 * after; g_drum *= 1 - 0.45 * after; g_brass *= 1 - 0.7 * after
    y = 0.85 * base + g_ost * nz(ost) + g_drum * nz(drum) + g_brass * nz(brass)
    y *= 1 - ramp(t, c["end"] - 1.6, c["end"])
    return y / (np.abs(y).max() + 1e-9)

if __name__ == "__main__":
    d = float(sys.argv[1]) if len(sys.argv) > 1 else 70
    y = epic(d, {"strings": 9, "drums": 22, "full": 45, "dip": 62, "end": d}) * 0.5
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", sys.argv[2] if len(sys.argv) > 2 else "apercu.wav"], input=y.tobytes(), check=True)
