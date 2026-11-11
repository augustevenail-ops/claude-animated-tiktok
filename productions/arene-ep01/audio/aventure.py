# Musique « aventure angoissante » (synthèse numpy) + sifflement-signature ORIGINAL de la série (4 notes propres au projet,
# aucune reprise d'un motif existant). 6/8 à 64 mesures/min (une mesure = 0,9375 s ; accord Rém - Si♭ - Solm - La toutes
# aucune reprise d'un motif existant). 6/8 (croche 0,3125 s, mesure 1,875 s ; accord Rém - Si♭ - Solm - La toutes

# aventure(dur, cues) -> mono float64 48 kHz. cues : drums, full, dip, end (s). Aperçu : python aventure.py 70 apercu.wav
import os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ambient import ambient, SR, CHORDS, midi, _lp

E8 = 0.3125                    # croche : 6/8, une mesure (6 croches) = 1,875 s ; un accord de 8 s ≈ 4,3 mesures
WHISTLE = [(81, 0.38), (86, 0.30), (84, 0.30), (81, 0.85)]          # la5 ré6 do6 la5 : motif propre au projet
THEME = [(0, 3), (7, 3), (5, 2), (3, 1), (2, 3), (0, 3), (-2, 2), (0, 4)]  # degrés / fondamentale, durées en croches

def ramp(t, a, b):
    u = np.clip((t - a) / max(1e-6, b - a), 0, 1); return u * u * (3 - 2 * u)
def saw(f, x, nh=10): return sum(np.sin(2 * np.pi * f * k * x) / k for k in range(1, nh + 1))

def whistle(rng, gain=1.0):
    out = []
    for m, d in WHISTLE:
        L = int(d * SR); x = np.arange(L) / SR; f = midi(m) * (1 + 0.012 * np.sin(2 * np.pi * 5.2 * x) * np.clip(x / 0.15, 0, 1))
        f = f * (1 + 0.02 * np.exp(-x * 30))                      # petite glissade d'attaque
        e = np.clip(x / 0.04, 0, 1) * np.clip((d - x) / 0.07, 0, 1)
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.04 * np.convolve(rng.standard_normal(L), np.ones(8) / 8, "same")
        out.append(s * e); out.append(np.zeros(int(0.03 * SR)))
    return np.concatenate(out) * gain

def aventure(dur, cues, seed=9):
    n = int(dur * SR); t = np.arange(n) / SR; rng = np.random.default_rng(seed)
    nz = lambda v: v / (np.abs(v).max() + 1e-9)
    def put(dst, s, t0, g=1.0):
        i = int(t0 * SR); j = min(n, i + len(s))
        if 0 <= i < n: dst[i:j] += s[: j - i] * g
    root = lambda tt: CHORDS[int(tt // 8) % 4][0]
    # galop : croche longue + deux doubles (long-court-court) sur chaque temps pointé, cordes graves étouffées
    gal = np.zeros(n); k = 0
    while k * 3 * E8 < dur:
        t0 = k * 3 * E8; r = root(t0) - 12
        for off, d, g in ((0, E8 * 1.6, 1.0), (2 * E8, E8 * 0.45, 0.55), (2.5 * E8, E8 * 0.45, 0.6)):
            L = int(d * SR); x = np.arange(L) / SR; e = np.clip(x / 0.008, 0, 1) * np.exp(-x * 7)
            put(gal, (saw(midi(r), x, 7) + 0.6 * saw(midi(r + 12) * 1.003, x, 5)) * e, t0 + off, g)
        k += 1
    gal = _lp(gal, 650)
    # tambours graves : un coup par mesure 6/8 (2 temps), doublé en section pleine
    D = int(1.4 * SR); xd = np.arange(D) / SR
    taiko = np.sin(2 * np.pi * np.cumsum(40 + 70 * np.exp(-xd * 20)) / SR) * np.exp(-xd * 3.5) + np.convolve(rng.standard_normal(D), np.ones(30) / 30, "same") * np.exp(-xd * 35) * 1.5
    dr, dr2 = np.zeros(n), np.zeros(n); b = 0
    while b * 6 * E8 < dur:
        put(dr, taiko, b * 6 * E8); put(dr2, taiko, b * 6 * E8 + 3 * E8, 0.7); put(dr2, taiko, b * 6 * E8 + 5 * E8, 0.45); b += 1
    # thème de cors (oct. 3), lent, une fois par cycle de deux accords
    hn = np.zeros(n)
    for c in range(0, int(dur // 8) + 1, 2):
        p = c * 8.0 + 1.0; r0 = CHORDS[c % 4][0]
        for deg, d in THEME:
            L = int(d * E8 * SR); x = np.arange(L) / SR
            e = np.clip(x / 0.12, 0, 1) * np.clip((d * E8 - x) / 0.15, 0, 1)
            put(hn, (saw(midi(r0 + deg) * (1 + 0.003 * np.sin(2 * np.pi * 5 * x)), x, 8) + 0.5 * saw(midi(r0 + deg - 12), x, 6)) * e, p); p += d * E8
    hn = _lp(hn, 1000)
    # trémolo aigu (angoisse) : la quinte de l'accord, oct. 5, amplitude hachée à 12 Hz
    trem = np.zeros(n)
    for c in range(int(dur // 8) + 1):
        i0, i1 = int(c * 8 * SR), min(n, int((c * 8 + 8) * SR))
        if i0 >= n: break
        x = t[i0:i1]; trem[i0:i1] = np.sin(2 * np.pi * midi(CHORDS[c % 4][2] + 12) * x) * (0.6 + 0.4 * np.sin(2 * np.pi * 12 * x))
    # sifflement-signature + réponse lointaine (écho de forêt)
    wh = np.zeros(n); w = whistle(rng)
    put(wh, w, 0.15, 1.0); put(wh, _lp(w, 2500), 2.55, 0.45)
    for d, g in ((0.33, 0.35), (0.71, 0.22), (1.2, 0.12)):
        k_ = int(d * SR); wh[k_:] += wh[:-k_] * g
    c = cues
    base = ambient(dur, 5)
    full, after = ramp(t, c["full"] - 3, c["full"]), ramp(t, c["dip"] + 0.6, c["dip"] + 1.8)
    fin = ramp(t, c["end"] - 6, c["end"] - 4)
    g_gal = (0.12 + 0.28 * ramp(t, 4.5, 10) + 0.1 * full) * (1 - 0.5 * after * (1 - fin))
    g_dr = (0.1 * ramp(t, 6, 12) + 0.32 * ramp(t, c["drums"] - 0.2, c["drums"] + 1) + 0.1 * full) * (1 - 0.6 * after * (1 - fin))
    g_dr2 = 0.28 * full * (1 - after)
    g_hn = 0.24 * ramp(t, c["drums"] + 2, c["drums"] + 5) + 0.06 * full
    g_tr = 0.07 * ramp(t, c["full"] - 4, c["full"] + 2) * (1 - 0.5 * after)
    y = 0.8 * base * (1 - 0.6 * ramp(t, 0, 0.1) * (1 - ramp(t, 3.5, 6))) + g_gal * nz(gal) + g_dr * nz(dr) + g_dr2 * nz(dr2) + g_hn * nz(hn) + g_tr * nz(trem) + 0.5 * nz(wh)
    y *= 1 - ramp(t, c["end"] - 1.2, c["end"])
    return y / (np.abs(y).max() + 1e-9)

if __name__ == "__main__":
    d = float(sys.argv[1]) if len(sys.argv) > 1 else 70
    y = aventure(d, {"drums": 22, "full": 48, "dip": 62, "end": d}) * 0.5
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", sys.argv[2] if len(sys.argv) > 2 else "apercu.wav"], input=y.tobytes(), check=True)
