# Musique énergique / épique (synthèse numpy), 120 BPM, accords Rém - Si♭ - Solm - La (4 mesures = 8 s chacun) :
# cordes en doubles croches, tambours graves (taiko) + caisse, coups de cuivres aux changements d'accord, thème de cors,
# montées de bruit blanc + impacts aux repères. Nappe sombre d'ambient.py gardée en fond.
# epic2(dur, cues) -> mono float64 48 kHz, crête ~1. cues : drums, full, dip, end (s). Aperçu : python epic2.py 70 apercu.wav
import os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambient import ambient, SR, CHORDS, midi, _lp

BEAT = 0.5; BAR = 2.0
THEME = [(0, 2), (7, 1), (3, 1), (2, 1.5), (0, 0.5), (-2, 1), (0, 1)]  # degrés (demi-tons / fondamentale), durées en temps

def ramp(t, a, b):
    u = np.clip((t - a) / max(1e-6, b - a), 0, 1); return u * u * (3 - 2 * u)

def saw(f, x, nh=10):
    return sum(np.sin(2 * np.pi * f * k * x) / k for k in range(1, nh + 1))

def epic2(dur, cues, seed=7):
    n = int(dur * SR); t = np.arange(n) / SR; rng = np.random.default_rng(seed)
    nz = lambda v: v / (np.abs(v).max() + 1e-9)
    def put(dst, s, t0, g=1.0):
        i = int(t0 * SR); j = min(n, i + len(s))
        if 0 <= i < n: dst[i:j] += s[: j - i] * g
    root = lambda tt: CHORDS[int(tt // 8) % 4][0]
    # cordes : doubles croches, motif sur la fondamentale (oct. 2-3), accents sur les temps
    st = np.zeros(n); step = BEAT / 4; L = int(step * 0.9 * SR); x = np.arange(L) / SR
    env = np.clip(x / 0.006, 0, 1) * np.exp(-x * 14)
    PAT = [0, 12, 0, 7, 0, 12, 0, 10, 0, 12, 0, 7, 3, 12, 0, 7]
    k = 0
    while k * step < dur:
        t0 = k * step; f = midi(root(t0) - 12 + PAT[k % 16])
        put(st, (saw(f, x, 9) + 0.5 * saw(f * 1.004, x, 9)) * env, t0, 1.0 if k % 4 == 0 else 0.6); k += 1
    st = _lp(st, 1400)
    # tambours : taiko (grosse caisse grave) + caisse (bruit) ; motif par mesure, roulement toutes les 4 mesures
    D = int(1.0 * SR); xd = np.arange(D) / SR
    taiko = np.sin(2 * np.pi * np.cumsum(48 + 90 * np.exp(-xd * 25)) / SR) * np.exp(-xd * 6) + np.convolve(rng.standard_normal(D), np.ones(25) / 25, "same") * np.exp(-xd * 45) * 2
    snare = np.convolve(rng.standard_normal(D), [1, -0.6], "same") * np.exp(-xd * 18) * 0.6 + np.sin(2 * np.pi * 190 * xd) * np.exp(-xd * 25) * 0.5
    kick, sn = np.zeros(n), np.zeros(n); b = 0
    while b * BAR < dur:
        t0 = b * BAR
        for off, g in ((0, 1), (0.75, 0.55), (1.0, 0.8)): put(kick, taiko, t0 + off, g)
        for off in (0.5, 1.5): put(sn, snare, t0 + off, 1)
        if b % 4 == 3:
            for q in range(8): put(kick, taiko, t0 + 1.0 + q * 0.125, 0.35 + 0.08 * q)   # roulement vers l'accord suivant
        b += 1
    # cuivres : coup + tenue sur chaque changement d'accord ; thème de cors (oct. 3) en section pleine
    br = np.zeros(n); hn = np.zeros(n)
    for c in range(int(dur // 8) + 1):
        t0 = c * 8.0
        if t0 >= dur: break
        r0 = CHORDS[c % 4][0]; Lb = int(3.0 * SR); xb = np.arange(Lb) / SR
        eb = np.clip(xb / 0.03, 0, 1) * (0.35 + 0.65 * np.exp(-xb * 3)) * np.clip((3.0 - xb) / 0.8, 0, 1)
        put(br, sum(saw(midi(m), xb, 12) * g for m, g in ((r0 - 12, 1), (r0 - 5, 0.8), (r0, 0.6), (r0 + 3 + (1 if c % 4 == 3 else 0), 0.4))) * eb, t0)
        p = t0 + 4.0
        for deg, d in THEME:
            Lh = int(d * BEAT * SR); xh = np.arange(Lh) / SR; f = midi(r0 + deg)
            eh = np.clip(xh / 0.05, 0, 1) * np.clip((d * BEAT - xh) / 0.08, 0, 1)
            put(hn, (saw(f * (1 + 0.003 * np.sin(2 * np.pi * 5.5 * xh)), xh, 8)) * eh, p); p += d * BEAT
    br = _lp(br, 1600); hn = _lp(hn, 1200)
    # montées (bruit filtré qui s'ouvre) + impacts
    fx = np.zeros(n)
    def riser(t1, d=2.5):
        Lr = int(d * SR); xr = np.arange(Lr) / SR; s = rng.standard_normal(Lr) * (xr / d) ** 2
        s = np.convolve(s, np.ones(6) / 6, "same"); put(fx, s * 0.5, t1 - d)
    def boom(t1, g=1.0):
        Lr = int(2.5 * SR); xr = np.arange(Lr) / SR
        put(fx, (np.sin(2 * np.pi * np.cumsum(35 + 60 * np.exp(-xr * 6)) / SR) * np.exp(-xr * 1.6) * 1.6 + np.convolve(rng.standard_normal(Lr), np.ones(12) / 12, "same") * np.exp(-xr * 10) * 2), t1, g)
    c = cues
    riser(c["drums"]); boom(c["drums"]); riser(c["full"]); boom(c["full"]); boom(c["end"] - 2.4, 0.8)
    base = ambient(dur, 5)
    full, after = ramp(t, c["full"] - 2, c["full"]), ramp(t, c["dip"] + 0.6, c["dip"] + 1.6)
    fin = ramp(t, c["end"] - 7, c["end"] - 5)  # relance pour la question finale
    g_st = (0.30 + 0.25 * ramp(t, 2, 8) + 0.15 * full) * (1 - 0.5 * after * (1 - fin))
    g_k = (0.25 * ramp(t, 4, 10) + 0.4 * ramp(t, c["drums"] - 0.1, c["drums"]) + 0.2 * full) * (1 - 0.7 * after * (1 - fin))
    g_sn = (0.18 * ramp(t, c["drums"], c["drums"] + 0.1) + 0.12 * full) * (1 - after * (1 - fin))
    g_br = 0.22 + 0.2 * ramp(t, c["drums"], c["drums"] + 1) + 0.15 * full
    g_hn = (0.22 * ramp(t, c["drums"] + 4, c["drums"] + 6) + 0.18 * full) * (1 - after * (1 - fin))
    y = 0.45 * base + g_st * nz(st) + g_k * nz(kick) + g_sn * nz(sn) + g_br * nz(br) + g_hn * nz(hn) + 0.45 * nz(fx)
    y *= 1 - ramp(t, c["end"] - 0.25, c["end"])
    return y / (np.abs(y).max() + 1e-9)

if __name__ == "__main__":
    d = float(sys.argv[1]) if len(sys.argv) > 1 else 70
    y = epic2(d, {"drums": 22, "full": 48, "dip": 62, "end": d}) * 0.5
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", sys.argv[2] if len(sys.argv) > 2 else "apercu.wav"], input=y.tobytes(), check=True)
