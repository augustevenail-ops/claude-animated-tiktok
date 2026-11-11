# Bandes son « avant le déclenchement » (synthèse numpy, originales) : tension qui monte par couches, pulsation grave
# régulière, aigu tenu, coupure nette sur « vingt-trois », suspens sur la question finale. Ni épique ni panique.
#   H « Pulsation de cordes » : croches graves répétées (108 BPM), harmonique aiguë tenue, tic métallique, cœur
#   I « Souffle retenu »      : drone + basse qui respire, motif grave de piano, trémolo aigu, nappes inversées
#   J « Tambours lointains »  : toms sourds lointains en motif régulier, cuivres graves tenus, col legno
#   K « Pulse électronique »  : basse synthé en doubles croches dont le filtre s'ouvre, charleston, nappe sombre
import numpy as np
from bandes import SR, midi, ramp, lp, hp, nz, Track, piano, pad
from bandes2 import reverb, pizz

def saw(f, x, nh=12): return sum(np.sin(2 * np.pi * f * k * x) / k for k in range(1, nh + 1))

def curve(T, c):
    """intensité 0..1 : 0,3 au départ -> 0,6 sur « Bienvenue » -> 1 au compte à rebours ; 0 juste après « vingt-trois »"""
    t = T.t
    I = 0.3 + 0.15 * ramp(t, 3, c["welcome"]) + 0.15 * ramp(t, c["welcome"] - 0.3, c["welcome"] + 1.5) + 0.4 * ramp(t, c["sixty"] - 4, c["dip"] - 0.3)
    cut = 1 - ramp(t, c["dip"] - 0.06, c["dip"])                     # silence net sur « vingt-trois »
    back = ramp(t, c["dip"] + 1.6, c["dip"] + 3.5)                    # reprise en suspens pour la question
    I = np.where(t < c["dip"], I, 0.45 * back)
    out = 1 - ramp(t, c["end"] - 0.6, c["end"])
    return I, np.where(t < c["dip"], cut, back) * out

def swell(T, t1, d=1.8):  # nappe inversée (souffle qui monte vers un repère)
    x = T.x(d); s = lp(T.rng.standard_normal(len(x)), 2500) * (x / d) ** 3; b = T.buf(); T.put(b, s, t1 - d); return b

def heart(T, beat):
    b = T.buf(); x = T.x(0.4); k = np.sin(2 * np.pi * np.cumsum(52 + 30 * np.exp(-x * 30)) / SR) * np.exp(-x * 11)
    i = 0
    while i * beat * 2 < T.dur: T.put(b, k, i * beat * 2); T.put(b, k, i * beat * 2 + 0.28, 0.6); i += 1
    return b

def band_H(dur, c):
    T = Track(dur, 41); beat = 60 / 108
    lo, hi, tick, harm = T.buf(), T.buf(), T.buf(), T.buf()
    ROOT = lambda tt: 38 if (tt // 8) % 4 != 3 else 39                # ré grave, glisse d'un demi-ton toutes les 32 s (malaise)
    k = 0
    while k * beat / 2 < dur:
        t0 = k * beat / 2; x = T.x(beat / 2 * 0.9); e = np.clip(x / 0.01, 0, 1) * np.exp(-x * 6)
        T.put(lo, saw(midi(ROOT(t0)), x) * e, t0, 1 if k % 2 == 0 else 0.75)
        T.put(hi, saw(midi(ROOT(t0) + 12), x, 8) * e, t0, 1 if k % 2 == 0 else 0.7)
        if k % 2 == 0: T.put(tick, hp(T.rng.standard_normal(int(0.015 * SR)), 4000) * np.exp(-T.x(0.015) * 300) + 0.4 * np.sin(2 * np.pi * 3100 * T.x(0.015)) * np.exp(-T.x(0.015) * 300), t0)
        k += 1
    harm = np.sin(2 * np.pi * midi(93) * T.t) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.2 * T.t)) + 0.5 * np.sin(2 * np.pi * midi(94) * T.t) * ramp(T.t, c["sixty"] - 4, c["dip"])
    I, g = curve(T, c)
    lo_d, lo_b = lp(lo, 350), lp(lo, 1600)
    y = (lo_d * (1 - I) + lo_b * I) / (np.abs(lo).max() + 1e-9) * 0.7 + 0.3 * I * nz(lp(hi, 2200)) + 0.12 * nz(tick) * (0.4 + I) \
        + 0.07 * nz(harm) * (0.3 + I) + 0.35 * ramp(T.t, c["welcome"], c["welcome"] + 4) * nz(heart(T, beat)) * I + 0.3 * nz(swell(T, c["welcome"]) + swell(T, c["sixty"]))
    return nz(reverb(y * g, 1.6, 0.25))

def band_I(dur, c):
    T = Track(dur, 42); t = T.t; beat = 60 / 80
    drone = sum(saw(midi(m), t, 6) * gg for m, gg in ((26, 1), (33, 0.6), (38, 0.4)))
    breathe = 0.55 + 0.45 * np.sin(2 * np.pi * t / (2 * beat)) ** 2
    pn = T.buf(); MOT = [(50, 0), (51, 1.5), (50, 2), (45, 3)]          # ré mi♭ ré la (grave), une fois par mesure
    b = 0
    while b * 4 * beat < dur:
        for m, off in MOT: T.put(pn, piano(midi(m - 12), T.x(1.6)), b * 4 * beat + off * beat, 1)
        b += 1
    trem = (np.sin(2 * np.pi * midi(86) * t) + 0.6 * np.sin(2 * np.pi * midi(87) * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 11 * t))
    I, g = curve(T, c)
    y = 0.5 * nz(lp(drone, 260 + 500 * 0.5)) * breathe * (0.6 + 0.4 * I) + 0.5 * nz(pn) * (0.5 + 0.5 * I) + 0.12 * nz(trem) * I ** 1.5 \
        + 0.35 * nz(swell(T, c["welcome"], 2.5) + swell(T, c["sixty"], 2.5)) + 0.25 * nz(heart(T, beat)) * ramp(t, c["sixty"] - 2, c["sixty"]) * I
    return nz(reverb(y * g, 2.2, 0.3))

def band_J(dur, c):
    T = Track(dur, 43); t = T.t; beat = 60 / 96; bar = 4 * beat
    tom = T.buf(); cl = T.buf()
    x = T.x(0.9); TOM = lambda f0: np.sin(2 * np.pi * np.cumsum(f0 + 40 * np.exp(-x * 18)) / SR) * np.exp(-x * 5) + lp(T.rng.standard_normal(len(x)), 500) * np.exp(-x * 30)
    PAT = [(0, 70, 1), (1.5, 82, 0.6), (2, 70, 0.8), (3, 62, 0.7), (3.5, 62, 0.5)]
    b = 0
    while b * bar < dur:
        for off, f0, gg in PAT: T.put(tom, TOM(f0), b * bar + off * beat, gg)
        for q in range(8):
            if q % 3 == 0: T.put(cl, hp(T.rng.standard_normal(int(0.03 * SR)), 1500) * np.exp(-T.x(0.03) * 120), b * bar + q * beat / 2)
        b += 1
    brass = T.buf(); CH = [(38, 45, 50), (38, 46, 51), (38, 45, 50), (37, 44, 49)]
    for k in range(int(dur // 8) + 1): T.put(brass, sum(pad(midi(m), T.x(8.6), 1.5) * gg for m, gg in zip(CH[k % 4], (1, 0.7, 0.5))), k * 8.0)
    I, g = curve(T, c)
    y = 0.6 * nz(lp(tom, 900)) * (0.35 + 0.65 * I) + 0.4 * nz(lp(brass, 600)) * (0.5 + 0.5 * I) + 0.12 * nz(cl) * I + 0.3 * nz(swell(T, c["welcome"]) + swell(T, c["sixty"]))
    return nz(reverb(y * g, 2.4, 0.38))   # réverbération large = tambours lointains

def band_K(dur, c):
    T = Track(dur, 44); t = T.t; beat = 60 / 112
    bs, hat = T.buf(), T.buf(); NOTES = [38, 38, 50, 38, 38, 45, 38, 48]
    k = 0
    while k * beat / 4 < dur:
        t0 = k * beat / 4; x = T.x(beat / 4 * 0.85); e = np.clip(x / 0.004, 0, 1) * np.exp(-x * 14)
        T.put(bs, saw(midi(NOTES[(k // 2) % 8] - (1 if (t0 // 8) % 4 == 3 else 0)), x) * e, t0, 1 if k % 4 == 0 else 0.6)
        if k % 2 == 1: T.put(hat, hp(T.rng.standard_normal(int(0.03 * SR)), 8000) * np.exp(-T.x(0.03) * 90), t0, 1 if k % 4 == 3 else 0.4)
        k += 1
    I, g = curve(T, c)
    dark, mid, bright = lp(bs, 250), lp(bs, 700), lp(bs, 2000)
    w1, w2 = np.clip(1 - 2 * I, 0, 1), np.clip(2 * I - 1, 0, 1); w0 = 1 - w1 - w2
    filt = (dark * w1 + mid * w0 + bright * w2) / (np.abs(bs).max() + 1e-9)
    padd = sum(saw(midi(m), t, 6) for m in (50, 53, 57, 62)) ; padd = lp(padd, 700) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.1 * t))
    y = 0.7 * filt + 0.12 * nz(hat) * I + 0.25 * nz(padd) * (0.5 + 0.5 * I) + 0.3 * nz(heart(T, beat)) * ramp(t, c["sixty"] - 2, c["sixty"]) + 0.3 * nz(swell(T, c["welcome"]) + swell(T, c["sixty"]))
    return nz(reverb(y * g, 1.4, 0.22))

def band_J2(dur, c):  # J validée + départ retardé (cues["start"]) + tension supplémentaire dès l'annonce du haut-parleur
    T = Track(dur, 45); t = T.t; beat = 60 / 96; bar = 4 * beat; w = c["welcome"]
    base = band_J(dur, c)
    ghost, pedal = T.buf(), T.buf()
    x = T.x(0.5); G = np.sin(2 * np.pi * np.cumsum(90 + 30 * np.exp(-x * 25)) / SR) * np.exp(-x * 12)
    k = 0
    while k * beat / 4 < dur:   # toms fantômes en doubles croches entre les coups
        if k % 4 in (1, 3): T.put(ghost, G, k * beat / 4, 0.5 + 0.5 * (k % 8 == 7))
        xp = T.x(beat / 2 * 0.9)
        if k % 2 == 0: T.put(pedal, saw(midi(26), xp, 8) * np.clip(xp / 0.01, 0, 1) * np.exp(-xp * 5), k * beat / 4, 1 if k % 8 == 0 else 0.6)
        k += 1
    cluster = (np.sin(2 * np.pi * midi(86) * t) + np.sin(2 * np.pi * midi(87) * t) + 0.6 * np.sin(2 * np.pi * midi(81) * t)) * (0.65 + 0.35 * np.sin(2 * np.pi * 9 * t))
    I, g = curve(T, c)
    ten = ramp(t, w - 0.2, w + 1.5) * (0.6 + 0.4 * ramp(t, c["sixty"] - 2, c["sixty"]))
    add = ten * (0.22 * nz(lp(ghost, 1200)) + 0.22 * nz(lp(pedal, 380)) + 0.07 * nz(cluster) * (0.5 + 0.5 * I)) * g
    y = base + nz(reverb(add, 2.0, 0.3)) * 0.55 * np.abs(base).max()
    s0 = c.get("start", 0.0); y *= ramp(t, s0, s0 + 0.35) if s0 else 1   # musique coupée avant « start »
    return nz(y)

BANDES3 = {"H": band_H, "I": band_I, "J": band_J, "K": band_K, "J2": band_J2}
