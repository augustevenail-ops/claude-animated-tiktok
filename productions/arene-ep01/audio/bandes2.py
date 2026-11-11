# Bandes son « découverte / début d'aventure » (synthèse numpy, mélodies originales) : légères, mélodiques, curieuses,
# une pointe d'étrangeté ; pas d'impacts ni de montées. Mélodie audible dès la 1re seconde ; « Bienvenue » ajoute une
# couche douce, « soixante » un léger battement, « vingt-trois » laisse la mélodie seule, la fin résout.
#   D « Boîte à musique » : valse 3/4 (84 BPM), boîte à musique + nappe, ré mineur dorien
#   E « Marimba & flûte »  : ostinato de marimba (100 BPM), flûte, couleur lydienne (émerveillement inquiet)
#   F « Guitare »          : arpèges de guitare pincée (Karplus-Strong, 92 BPM), mélodie de guitare aiguë, contrebasse douce
#   G « Piano léger »      : mélodie de piano aiguë, pizzicati, violons tenus (88 BPM)
import numpy as np
from bandes import SR, midi, ramp, lp, hp, nz, Track, bell, piano, pad

def reverb(x, rt=1.6, mix=0.28, seed=3):
    rng = np.random.default_rng(seed); L = int(rt * SR); ir = rng.standard_normal(L) * np.exp(-np.arange(L) / SR * 6.9 / rt)
    ir = lp(ir, 5000); n = len(x) + L; F = 1 << (n - 1).bit_length()
    w = np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[: len(x)]
    return (1 - mix) * x + mix * nz(w) * np.abs(x).max()

def ks(f, d, damp=0.996, bright=0.5, seed=0):   # guitare pincée (Karplus-Strong, vectorisé par période)
    N = max(2, int(round(SR / f))); L = int(d * SR) + N + 1; y = np.zeros(L)
    rng = np.random.default_rng(seed); y[:N + 1] = lp(rng.standard_normal(N + 1), f * (4 + 8 * bright))[: N + 1]
    i = N + 1
    while i < L:
        j = min(L, i + N); y[i:j] = damp * 0.5 * (y[i - N:j - N] + y[i - N - 1:j - N - 1]); i = j
    return y[N + 1:]

def marimba(f, x): return (np.sin(2 * np.pi * f * x) + 0.25 * np.sin(2 * np.pi * f * 3.93 * x) * np.exp(-x * 25)) * np.exp(-x * 5) * np.clip(x / 0.002, 0, 1)
def flute(f, x, rng):
    d = x[-1] if len(x) else 1; vib = 1 + 0.006 * np.sin(2 * np.pi * 5 * x) * np.clip((x - 0.25) / 0.3, 0, 1)
    ph = 2 * np.pi * np.cumsum(f * vib) / SR; br = lp(rng.standard_normal(len(x)), 3000) * 0.05
    return (np.sin(ph) + 0.18 * np.sin(2 * ph) + 0.05 * np.sin(3 * ph) + br) * np.clip(x / 0.06, 0, 1) * np.clip((d - x) / 0.1, 0, 1)
def musicbox(f, x): return (np.sin(2 * np.pi * f * x) + 0.3 * np.sin(2 * np.pi * f * 3 * x) * np.exp(-x * 6) + 0.12 * np.sin(2 * np.pi * f * 5.98 * x) * np.exp(-x * 12)) * np.exp(-x * 2.2) * np.clip(x / 0.002, 0, 1)
def pizz(f, x): return sum(np.sin(2 * np.pi * f * k * x) / k * np.exp(-x * (9 + 3 * k)) for k in range(1, 6)) * np.clip(x / 0.004, 0, 1)

def melody(T, dst, notes, beat, t0, inst, gain=1.0, loop_until=None, gaps=None):
    """notes : [(midi | None, temps)] ; rejoue la phrase jusqu'à loop_until"""
    p = t0; end = loop_until if loop_until is not None else 1e9; rep = 0
    while p < min(end, T.dur):
        for m, b in notes:
            if p >= min(end, T.dur): break
            if m is not None and not (gaps and gaps(p)): T.put(dst, inst(midi(m), T.x(min(b * beat * 1.6 + 0.4, 3.0))), p, gain)
            p += b * beat
        rep += 1

def arcs(T, c):
    t = T.t
    welc = ramp(t, c["welcome"] - 1.0, c["welcome"] + 2.0); six = ramp(t, c["sixty"] - 0.5, c["sixty"] + 1.5)
    dip = ramp(t, c["dip"] - 0.3, c["dip"] + 0.1) * (1 - ramp(t, c["dip"] + 2.0, c["dip"] + 3.2))
    out = 1 - ramp(t, c["end"] - 1.0, c["end"]); return welc, six, dip, out

def soft_beat(T, beat, every, f0=55):  # battement doux (grosse caisse feutrée)
    b = T.buf(); x = T.x(0.5); k = np.sin(2 * np.pi * np.cumsum(f0 + 30 * np.exp(-x * 25)) / SR) * np.exp(-x * 9)
    i = 0
    while i * beat * every < T.dur: T.put(b, k, i * beat * every); i += 1
    return b

def band_D(dur, c):  # Boîte à musique (3/4)
    T = Track(dur, 31); beat = 60 / 84; bar = 3 * beat
    CH = [(50, 53, 57), (48, 52, 55), (46, 50, 53), (45, 49, 52)]  # Rém, Do, Si♭, La
    MEL = [(81, 1), (86, 1), (88, 1), (89, 2), (88, 1), (86, 1), (84, 1), (81, 1), (79, 3),
           (81, 1), (84, 1), (86, 1), (88, 2), (86, 1), (85, 1), (81, 2), (None, 3)]
    mb, acc, pd = T.buf(), T.buf(), T.buf()
    melody(T, mb, MEL, beat, 0.15, musicbox)
    for b in range(int(dur // bar) + 1):
        ch = CH[(b // 2) % 4]
        T.put(acc, pizz(midi(ch[0] - 12), T.x(0.8)), b * bar, 1.0)
        for q in (1, 2): T.put(acc, sum(pizz(midi(m), T.x(0.5)) for m in ch[1:]) * 0.5, b * bar + q * beat, 0.6)
        if b % 2 == 0: T.put(pd, sum(pad(midi(m), T.x(2 * bar + 0.5), 0.8) for m in ch), b * bar)
    pd = lp(pd, 900); welc, six, dip, out = arcs(T, c)
    y = 0.6 * nz(mb) + (0.32 + 0.08 * six) * nz(acc) * (1 - 0.8 * dip) + (0.05 + 0.18 * welc) * nz(pd) * (1 - 0.6 * dip) + 0.12 * six * nz(soft_beat(T, beat, 3)) * (1 - dip)
    return nz(reverb(y * out, 2.0, 0.32))

def band_E(dur, c):  # Marimba & flûte (lydien)
    T = Track(dur, 32); beat = 60 / 100; bar = 4 * beat
    CH = [(50, 54, 57, 64), (52, 56, 59, 66), (50, 54, 57, 64), (47, 50, 54, 59)]  # Ré(add9), Mi/ré (lydien), Ré, Sim
    mar, fl, pd = T.buf(), T.buf(), T.buf()
    k = 0
    while k * beat / 2 < dur:
        t0 = k * beat / 2; ch = CH[int(t0 // (2 * bar)) % 4]
        T.put(mar, marimba(midi(ch[[0, 2, 3, 2, 1, 2, 3, 2][k % 8]] + 12), T.x(0.6)), t0, 1 if k % 4 == 0 else 0.7); k += 1
    MEL = [(78, 1.5), (81, 0.5), (80, 2), (76, 1.5), (78, 0.5), (73, 2), (None, 2),
           (78, 1.5), (81, 0.5), (85, 1), (83, 1), (80, 3), (None, 3)]
    rng = np.random.default_rng(5)
    melody(T, fl, MEL, beat, 4 * beat + 0.1, lambda f, x: flute(f, x, rng), 1.0, gaps=lambda p: c["dip"] - 0.3 < p < c["dip"] + 2.5)
    for b in range(int(dur // (2 * bar)) + 1): T.put(pd, sum(pad(midi(m - 12), T.x(2 * bar + 0.5), 1.0) for m in CH[b % 4][:3]), b * 2 * bar)
    pd = lp(pd, 800); welc, six, dip, out = arcs(T, c)
    sh = T.buf(); i = 0
    while i * beat / 4 < dur: T.put(sh, hp(T.rng.standard_normal(int(0.04 * SR)), 6000) * np.exp(-T.x(0.04) * 60), i * beat / 4, 1 if i % 2 else 0.5); i += 1
    y = 0.5 * nz(mar) * (1 - 0.4 * dip) + 0.45 * nz(fl) + (0.08 + 0.15 * welc) * nz(pd) + (0.04 * welc + 0.05 * six) * nz(sh) * (1 - dip) + 0.1 * six * nz(soft_beat(T, beat, 2)) * (1 - dip)
    return nz(reverb(y * out, 1.8, 0.3))

def band_F(dur, c):  # Guitare
    T = Track(dur, 33); beat = 60 / 92; bar = 4 * beat
    CH = [(45, 52, 57, 60, 64), (41, 48, 53, 57, 60), (43, 50, 55, 59, 62), (40, 47, 52, 55, 59)]  # Lam, Fa, Sol, Mim
    gt, mel, bs = T.buf(), T.buf(), T.buf()
    k = 0
    while k * beat / 2 < dur:
        t0 = k * beat / 2; ch = CH[int(t0 // bar) % 4]; idx = [0, 2, 3, 4, 1, 3, 2, 4][k % 8]
        T.put(gt, ks(midi(ch[idx]), 1.6, 0.9965, 0.4, k), t0, 1 if k % 8 == 0 else 0.6); k += 1
    MEL = [(76, 1), (79, 1), (81, 2), (79, 1), (76, 1), (74, 2), (72, 1), (74, 1), (76, 3), (None, 3),
           (76, 1), (79, 1), (84, 2), (83, 1), (79, 1), (81, 4), (None, 4)]
    melody(T, mel, MEL, beat, 2 * bar + 0.05, lambda f, x: ks(f, min(len(x) / SR, 2.0), 0.998, 0.7), 1.0, gaps=lambda p: c["dip"] - 0.3 < p < c["dip"] + 2.5)
    for b in range(int(dur // bar) + 1):
        ch = CH[b % 4]; T.put(bs, pizz(midi(ch[0] - 12), T.x(1.2)) * 1.0, b * bar); T.put(bs, pizz(midi(ch[0] - 5), T.x(0.8)), b * bar + 2.5 * beat, 0.6)
    welc, six, dip, out = arcs(T, c)
    y = 0.5 * nz(gt) * (1 - 0.4 * dip) + 0.42 * nz(mel) + (0.1 + 0.2 * welc) * nz(bs) * (1 - 0.8 * dip) + 0.12 * six * nz(soft_beat(T, beat, 2, 50)) * (1 - dip)
    return nz(reverb(y * out, 1.4, 0.22))

def band_G(dur, c):  # Piano léger
    T = Track(dur, 34); beat = 60 / 88; bar = 4 * beat
    CH = [(52, 55, 59), (48, 52, 55), (43, 47, 50), (50, 54, 57)]  # Mim, Do, Sol, Ré
    pn, pz, vl = T.buf(), T.buf(), T.buf()
    MEL = [(83, 0.5), (86, 0.5), (88, 1), (86, 0.5), (83, 0.5), (81, 2), (None, 0.5), (79, 0.5), (81, 0.5), (83, 0.5), (78, 3), (None, 1),
           (83, 0.5), (86, 0.5), (88, 1), (91, 1), (90, 1), (86, 2), (88, 0.5), (86, 0.5), (83, 4), (None, 1)]
    melody(T, pn, MEL, beat, 0.15, piano, 1.0, gaps=lambda p: c["dip"] - 0.3 < p < c["dip"] + 2.3)
    k = 0
    while k * beat / 2 < dur:
        t0 = k * beat / 2; ch = CH[int(t0 // bar) % 4]
        T.put(pz, pizz(midi(ch[[0, 2, 1, 2][k % 4]]), T.x(0.4)), t0, 1 if k % 2 == 0 else 0.55); k += 1
    for b in range(int(dur // bar) + 1): T.put(vl, sum(pad(midi(m + 12), T.x(bar + 0.6), 0.9) for m in CH[b % 4][1:]), b * bar)
    vl = lp(vl, 1600); welc, six, dip, out = arcs(T, c)
    y = 0.55 * nz(pn) + (0.3 + 0.08 * six) * nz(pz) * (1 - 0.7 * dip) + (0.04 + 0.16 * welc) * nz(vl) * (1 - 0.6 * dip) + 0.1 * six * nz(soft_beat(T, beat, 2)) * (1 - dip)
    return nz(reverb(y * out, 1.8, 0.28))

BANDES2 = {"D": band_D, "E": band_E, "F": band_F, "G": band_G}
