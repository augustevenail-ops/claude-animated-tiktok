# Trois bandes son originales indépendantes (synthèse numpy), pensées pour TikTok : une accroche dès la 1re seconde,
# retenue sous la voix, montée sur « Bienvenue », palier sur « soixante », creux sur « vingt-trois », relance finale.
#   A « Pulsation »  : arpège synthé sombre en croches, basse sub, battement sourd, motif de cloche de 4 notes (100 BPM)
#   B « Horloge »    : tic-tac + pizzicati en ostinato, violoncelle tenu, motif de célesta (compte à rebours) (96 BPM)
#   C « Cinéma »     : motif de piano de 3 notes répété, nappe de cordes grave, battement de cœur, cors en fin (80 BPM)
# bande(nom, dur, cues) -> mono float64 48 kHz crête 1 ; cues : welcome, sixty, dip, end (s).
import numpy as np

SR = 48000
def midi(m): return 440.0 * 2 ** ((m - 69) / 12)
def ramp(t, a, b):
    u = np.clip((t - a) / max(1e-6, b - a), 0, 1); return u * u * (3 - 2 * u)
def lp(x, fc):  # passe-bas 2 pôles (FFT, sans boucle)
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X / (1 + (f / fc) ** 4) ** 0.5, len(x))
def hp(x, fc):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); return np.fft.irfft(X * (f / fc) ** 2 / (1 + (f / fc) ** 4) ** 0.5, len(x))
nz = lambda v: v / (np.abs(v).max() + 1e-9)

class Track:
    def __init__(s, dur, seed): s.n = int(dur * SR); s.t = np.arange(s.n) / SR; s.rng = np.random.default_rng(seed); s.dur = dur
    def buf(s): return np.zeros(s.n)
    def put(s, dst, sig, t0, g=1.0):
        i = int(round(t0 * SR)); j = min(s.n, i + len(sig))
        if 0 <= i < s.n and j > i: dst[i:j] += sig[: j - i] * g
    def x(s, d): return np.arange(int(d * SR)) / SR

def pluck(f, x, bright=6.0, decay=3.0):      # corde pincée / synthé : harmoniques qui s'éteignent plus vite en aigu
    return sum(np.sin(2 * np.pi * f * k * x) / k * np.exp(-x * decay * (1 + (k - 1) / bright)) for k in range(1, 9))
def bell(f, x, decay=1.6):
    return (np.sin(2 * np.pi * f * x) + 0.45 * np.sin(2 * np.pi * f * 2.76 * x) * np.exp(-x * 4) + 0.2 * np.sin(2 * np.pi * f * 5.4 * x) * np.exp(-x * 8)) * np.exp(-x * decay)
def piano(f, x):
    return sum(np.sin(2 * np.pi * f * k * (1 + 0.0004 * k * k) * x) / k ** 1.3 * np.exp(-x * (0.9 + 0.7 * k)) for k in range(1, 8)) * np.clip(x / 0.004, 0, 1)
def pad(f, x, att=1.2):                     # cordes : 3 dents de scie désaccordées, attaque lente
    s = sum(sum(np.sin(2 * np.pi * f * (1 + det) * k * x + k) / k for k in range(1, 9)) for det in (-0.003, 0, 0.0035))
    d = x[-1] if len(x) else 1; return s * np.clip(x / att, 0, 1) * np.clip((d - x) / 0.8, 0, 1)
def kick(x, f0=48, sweep=70): return np.sin(2 * np.pi * np.cumsum(f0 + sweep * np.exp(-x * 30)) / SR) * np.exp(-x * 6)
def boom(T, t1, g=1.0):
    x = T.x(3.0); s = np.sin(2 * np.pi * np.cumsum(32 + 50 * np.exp(-x * 5)) / SR) * np.exp(-x * 1.3)
    nb = lp(T.rng.standard_normal(len(x)), 900) * np.exp(-x * 7) * 1.2; return s + nb
def riser(T, d=2.4):
    x = T.x(d); return hp(T.rng.standard_normal(len(x)), 1500) * (x / d) ** 2.5 * 0.6

PROG = [50, 46, 41, 48]        # Rém, Si♭, Fa, Do (fondamentales)
MIN = {50: (0, 3, 7), 46: (0, 4, 7), 41: (0, 4, 7), 48: (0, 4, 7)}

def arc(T, c):
    t = T.t
    welc, six = ramp(t, c["welcome"] - 0.3, c["welcome"] + 0.2), ramp(t, c["sixty"] - 0.3, c["sixty"] + 0.2)
    dip = ramp(t, c["dip"] - 0.2, c["dip"] + 0.1) * (1 - ramp(t, c["dip"] + 2.2, c["dip"] + 3.5))
    out = 1 - ramp(t, c["end"] - 0.8, c["end"])
    return welc, six, dip, out

def band_A(dur, c):   # Pulsation
    T = Track(dur, 21); B = 60 / 100; bar = 4 * B
    arp, sub, kk, bl, hat = T.buf(), T.buf(), T.buf(), T.buf(), T.buf()
    k = 0
    while k * B / 2 < dur:
        t0 = k * B / 2; r = PROG[int(t0 // bar) % 4]; ch = MIN[r]
        note = r + 12 + [ch[0], ch[1], ch[2], 12, ch[2], ch[1], ch[0], ch[1]][k % 8]
        T.put(arp, pluck(midi(note), T.x(B / 2 * 0.95), 4, 7), t0, 1 if k % 2 == 0 else 0.7)
        if k % 2 == 1: T.put(hat, hp(T.rng.standard_normal(int(0.05 * SR)), 7000) * np.exp(-T.x(0.05) * 70), t0, 1)
        k += 1
    for b in range(int(dur // bar) + 1):
        r = PROG[b % 4]; T.put(sub, np.sin(2 * np.pi * midi(r - 24) * T.x(bar)) * np.clip(T.x(bar) / 0.05, 0, 1) * np.clip((bar - T.x(bar)) / 0.1, 0, 1), b * bar)
        for q in (0, 2): T.put(kk, kick(T.x(0.6)), b * bar + q * B, 1)
        if b % 2 == 0:  # motif de cloche (accroche) : 4 notes sur 2 mesures
            for i, (deg, off) in enumerate(((7, 0), (5, 1.5), (3, 2), (2, 3.5))):
                T.put(bl, bell(midi(r + 24 + deg), T.x(2.0)), b * bar + off * B, 1 - 0.1 * i)
    arp = lp(arp, 1600)
    welc, six, dip, out = arc(T, c); t = T.t
    y = (0.55 + 0.15 * welc + 0.15 * six) * nz(arp) * (1 - 0.6 * dip) + 0.45 * nz(sub) * ramp(t, 1.5, 3) * (1 - 0.7 * dip) \
        + (0.18 + 0.3 * welc + 0.12 * six) * nz(kk) * (1 - dip) + (0.08 * welc + 0.06 * six) * nz(hat) * (1 - dip) + 0.35 * nz(bl) * (1 - 0.5 * dip)
    fx = T.buf(); T.put(fx, riser(T), c["welcome"] - 2.4); T.put(fx, boom(T, 0), c["welcome"]); T.put(fx, riser(T), c["sixty"] - 2.4); T.put(fx, boom(T, 0), c["sixty"], 0.8)
    return nz((y + 0.35 * nz(fx)) * out)

def band_B(dur, c):   # Horloge
    T = Track(dur, 22); B = 60 / 96; bar = 4 * B
    tick, pz, cello, cel, kk = T.buf(), T.buf(), T.buf(), T.buf(), T.buf()
    k = 0
    while k * B < dur:
        T.put(tick, hp(T.rng.standard_normal(int(0.02 * SR)), 3000) * np.exp(-T.x(0.02) * 200) * (1 if k % 2 == 0 else 0.6) + 0.3 * np.sin(2 * np.pi * (2200 if k % 2 == 0 else 1800) * T.x(0.02)) * np.exp(-T.x(0.02) * 250), k * B)
        k += 1
    k = 0
    while k * B / 2 < dur:
        t0 = k * B / 2; r = PROG[int(t0 // bar) % 4]; ch = MIN[r]
        note = r + [0, 12, ch[2], 12, ch[1] + 12, 12, ch[2], 7][k % 8]
        T.put(pz, pluck(midi(note), T.x(0.25), 3, 14), t0, 1 if k % 4 == 0 else 0.65); k += 1
    for b in range(int(dur // bar) + 1):
        r = PROG[b % 4]; T.put(cello, pad(midi(r - 12), T.x(bar + 0.3), 0.6), b * bar)
        T.put(kk, kick(T.x(0.7), 44, 60), b * bar, 1); T.put(kk, kick(T.x(0.7), 44, 60), b * bar + 2.5 * B, 0.6)
        if b % 2 == 1:
            for i, (deg, off) in enumerate(((12, 0), (10, 0.5), (7, 1), (3, 2))):
                T.put(cel, bell(midi(r + 24 + deg), T.x(1.5), 2.4), b * bar + off * B, 1 - 0.1 * i)
    cello = lp(cello, 900)
    welc, six, dip, out = arc(T, c); t = T.t
    y = 0.22 * nz(tick) * (1 - 0.5 * dip) + (0.4 + 0.15 * welc + 0.1 * six) * nz(pz) * ramp(t, 0.5, 2) * (1 - 0.7 * dip) + (0.35 + 0.15 * six) * nz(cello) * ramp(t, 3, 6) \
        + (0.3 * welc + 0.15 * six) * nz(kk) * (1 - dip) + 0.28 * nz(cel) * (1 - 0.5 * dip)
    fx = T.buf(); T.put(fx, riser(T), c["welcome"] - 2.4); T.put(fx, boom(T, 0), c["welcome"]); T.put(fx, boom(T, 0), c["sixty"], 0.8)
    return nz((y + 0.3 * nz(fx)) * out)

def band_C(dur, c):   # Cinéma
    T = Track(dur, 23); B = 60 / 80; bar = 4 * B
    pno, strg, hb, horn = T.buf(), T.buf(), T.buf(), T.buf()
    k = 0
    while k * B / 2 < dur:  # motif de 3 notes en croches (accroche), fondamentale qui suit les accords
        t0 = k * B / 2; r = PROG[int(t0 // bar) % 4]; ch = MIN[r]
        note = r + 12 + [ch[2] + 12, ch[1] + 12, ch[0] + 12][k % 3] if (k // 3) % 2 == 0 else r + 12 + [ch[2] + 12, ch[1] + 12, ch[0] + 12][k % 3] - 12 * (k % 3 == 2)
        T.put(pno, piano(midi(note), T.x(1.2)), t0, 0.9 if k % 3 == 0 else 0.7); k += 1
    for b in range(int(dur // bar) + 1):
        r = PROG[b % 4]; ch = MIN[r]
        for m, g in ((r - 12, 1), (r - 12 + ch[2], 0.6), (r + ch[1], 0.5)): T.put(strg, pad(midi(m), T.x(bar + 0.6), 1.0), b * bar, g)
        for q, g in ((0, 1), (0.35, 0.6), (2, 0.9), (2.35, 0.55)): T.put(hb, kick(T.x(0.5), 50, 40), b * bar + q * B, g)
        for m, g in ((r - 12, 1), (r - 5, 0.7)): T.put(horn, pad(midi(m), T.x(bar), 0.5), b * bar, g)
    strg = lp(strg, 1100); horn = lp(horn, 800)
    welc, six, dip, out = arc(T, c); t = T.t
    y = (0.5 + 0.1 * six) * nz(pno) * (1 - 0.6 * dip) + (0.3 + 0.2 * welc + 0.1 * six) * nz(strg) * ramp(t, 1, 5) + (0.2 + 0.25 * welc) * nz(hb) * ramp(t, 4, 8) * (1 - dip) \
        + (0.22 * six + 0.12 * welc) * nz(horn) * (1 - 0.8 * dip)
    fx = T.buf(); T.put(fx, riser(T), c["welcome"] - 2.4); T.put(fx, boom(T, 0), c["welcome"]); T.put(fx, riser(T), c["sixty"] - 2.4); T.put(fx, boom(T, 0), c["sixty"], 0.8)
    return nz((y + 0.3 * nz(fx)) * out)

BANDES = {"A": band_A, "B": band_B, "C": band_C}
def bande(nom, dur, cues): return BANDES[nom](dur, cues)
