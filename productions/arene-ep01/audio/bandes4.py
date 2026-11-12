# Musique « Berceuse brisée » (inquiétante, MÉLODIQUE) : une berceuse lente au carillon en ré mineur dont chaque deuxième phrase pose une
# note de trop (mi♭), sur des cordes sourdes qui gonflent, un trémolo aigu et une pédale grave. Parcours = celui de la vidéo :
# carillon seul au début, cordes sur le message, tension maximale à l'éclair, silence net sur « glacée », puis un fragment suspendu
# (la ré fa… puis mi♭ tenu) jusqu'à la fin. band_L(dur, cues) -> mono float64 48 kHz ; cues : welcome, sixty, dip, end (s).
import numpy as np
from bandes import SR, midi, ramp, lp, nz, Track, pad
from bandes2 import reverb, musicbox

CH = [(50, 53, 57), (46, 50, 53), (43, 46, 50), (45, 49, 52)]                       # Rém, Si♭, Solm, La (cordes)
PH_A = [(69, 1), (74, 1), (77, 1), (76, 1.5), (73, 0.5), (74, 3)]                    # la ré fa mi do♯ ré
PH_B = [(69, 1), (74, 1), (77, 1), (79, 1.5), (75, 0.5), (74, 3)]                    # la ré fa sol mi♭ ré : la note de trop

def band_L(dur, c):
    T = Track(dur, 61); t = T.t; beat = 60 / 66; dip = c["dip"]
    mel, strg, trem, ped, frag = T.buf(), T.buf(), T.buf(), T.buf(), T.buf()
    p, ph = 0.5, 0
    while p < dip - 1.0:
        for m, b in (PH_A if ph % 2 == 0 else PH_B):
            if p < dip - 0.1: T.put(mel, musicbox(midi(m), T.x(min(b * beat + 1.8, 3.6))), p, 1.0 if b >= 1 else 0.8)
            p += b * beat
        p += 1.4 * beat; ph += 1
    cyc = 8 * beat
    for k in range(int(dur // cyc) + 1):
        ch = CH[k % 4]; t0 = k * cyc
        if t0 < dip: T.put(strg, sum(pad(midi(m), T.x(cyc + 1.2), 1.6) * g for m, g in zip(ch, (1, 0.8, 0.6))), t0)
        T.put(ped, pad(midi(26), T.x(cyc + 1.2), 1.5), t0)
    strg = lp(strg, 1100)
    trem = (np.sin(2 * np.pi * midi(88) * t) + 0.6 * np.sin(2 * np.pi * midi(89) * t)) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * t))
    # après le silence : fragment suspendu (la ré fa), puis mi♭ tenu jusqu'à la fin
    p = dip + 2.4
    for m, b in ((69, 1.2), (74, 1.2), (77, 1.4)): T.put(frag, musicbox(midi(m), T.x(3.6)), p, 0.9); p += b * beat
    T.put(frag, musicbox(midi(75), T.x(5.0)), p + 0.3, 1.0)
    cut = 1 - ramp(t, dip - 0.06, dip)
    pre = np.where(t < dip, cut, 0.0)
    g_mel = 0.62 + 0.18 * ramp(t, c["welcome"], c["sixty"])
    g_str = (0.10 + 0.30 * ramp(t, 6, 14) + 0.30 * ramp(t, c["welcome"] - 2, c["welcome"] + 4) + 0.30 * ramp(t, c["sixty"] - 4, c["sixty"]))
    g_trem = 0.14 * ramp(t, c["welcome"], c["sixty"]); g_ped = 0.16 + 0.20 * ramp(t, c["welcome"] - 2, c["sixty"])
    post = ramp(t, dip + 2.3, dip + 2.5)
    y = pre * (g_mel * nz(mel) + g_str * nz(strg) + g_trem * nz(trem) + g_ped * nz(lp(ped, 200))) + post * (0.5 * nz(frag) + 0.14 * nz(lp(ped, 200)))
    y *= 1 - ramp(t, c["end"] - 0.6, c["end"])
    return nz(reverb(y, 2.6, 0.36))


# ---------------------------------------------------------------------------------------------------------------------------------
# « Tension » : musique STRESSANTE, dissonante, sans mélodie consolante (demande utilisateur du 2026-11-12 : « plus stressant »).
# Ostinato grave en croches sur un demi-ton (mi–fa) qui martèle sans fin, cordes aiguës staccato qui frottent (mi–fa, triton), cluster
# grave, tic-tac qui s'accélère, coup de cordes sur le message et sur l'éclair, montée de bruit avant l'éclair. Silence net sur « glacée »,
# puis une note aiguë dissonante tenue (battements) et quelques pulsations jusqu'à la fin.
from bandes3 import saw, swell

def band_M(dur, c):
    T = Track(dur, 71); t = T.t; w, s, dip = c["welcome"], c["sixty"], c["dip"]; beat = 60 / 104; e8 = beat / 2
    low, hi, tick, stab, riser, hold = T.buf(), T.buf(), T.buf(), T.buf(), T.buf(), T.buf()
    LOW = [28, 28, 29, 28, 28, 29, 28, 34]                                  # mi mi fa mi mi fa mi si♭ : demi-ton + triton
    HI = [76, 77, 76, 77, 76, 77, 83, 77]                                    # mi fa mi fa mi fa si fa : frottement aigu
    k = 0
    while k * e8 < dip - 0.05:
        t0 = k * e8
        xl = T.x(e8 * 1.5); T.put(low, saw(midi(LOW[k % 8]), xl, 7) * np.exp(-xl * 9) * np.clip(xl / 0.004, 0, 1), t0, 1.0 if k % 4 == 0 else 0.7)
        if t0 > w - 1.0:
            xh = T.x(e8 * 0.9); T.put(hi, saw(midi(HI[k % 8]), xh, 6) * np.exp(-xh * 18) * np.clip(xh / 0.003, 0, 1), t0 + (e8 / 2 if k % 2 else 0), 1.0)
        k += 1
    q = 0.0                                                                  # tic-tac : 2 par seconde, puis jusqu'à 6 par seconde vers « glacée »
    while q < dip - 0.1:
        xk = T.x(0.03); T.put(tick, np.convolve(T.rng.standard_normal(len(xk)), [1, -0.9], "same") * np.exp(-xk * 150) + np.sin(2 * np.pi * 2600 * xk) * np.exp(-xk * 200), q, 1.0)
        q += max(0.16, 0.5 - 0.34 * ramp(np.array([q]), w, dip)[0])
    def hit(t1, g):                                                          # coup de cordes : cluster mi-fa-fa♯-si♭, attaque dure
        xs = T.x(1.6); sig = sum(saw(midi(m), xs, 10) * a for m, a in ((52, 1), (53, 0.9), (54, 0.8), (58, 0.7), (64, 0.5))) * np.exp(-xs * 2.2) * np.clip(xs / 0.006, 0, 1)
        T.put(stab, lp(sig, 2600), t1, g)
    hit(w - 0.02, 0.8); hit(s - 0.02, 1.0)
    xr = T.x(3.0); gl = np.cumsum(260 * np.exp(1.6 * xr / 3.0)) / SR; T.put(riser, saw(1.0, gl, 8) * (xr / 3.0) ** 2.5, s - 3.0, 1.0)      # montée avant l'éclair
    drone = (np.sin(2 * np.pi * midi(25) * t) + 0.8 * np.sin(2 * np.pi * midi(26) * t) + 0.6 * np.sin(2 * np.pi * midi(27) * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.17 * t))
    beat_hi = (np.sin(2 * np.pi * midi(88) * t) + np.sin(2 * np.pi * (midi(88) * 1.018) * t)) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.35 * t))      # note aiguë dissonante qui bat
    p = dip + 2.3
    T.put(hold, lp(np.sin(2 * np.pi * midi(88) * T.x(dur - p)) + np.sin(2 * np.pi * midi(88) * 1.02 * T.x(dur - p)), 4000) * ramp(T.x(dur - p), 0, 1.2), p, 1.0)
    pul = T.buf(); xk = T.x(0.4); th = np.sin(2 * np.pi * np.cumsum(55 + 40 * np.exp(-xk * 25)) / SR) * np.exp(-xk * 12)
    q = dip + 2.0
    while q < dur - 0.4: T.put(pul, th, q, 0.7); q += 0.95
    cut = 1 - ramp(t, dip - 0.05, dip); pre = np.where(t < dip, cut, 0.0)
    I = 0.35 + 0.25 * ramp(t, 3, w) + 0.4 * ramp(t, s - 4, dip - 0.3)
    y = pre * (I * 0.9 * nz(lp(low, 500)) + (0.15 + 0.35 * ramp(t, w, s)) * nz(lp(hi, 3200)) + 0.16 * (0.5 + I) * nz(tick) + 0.55 * nz(stab) + 0.5 * nz(riser) * ramp(t, s - 3, s)
                + 0.28 * nz(lp(drone, 180)) + 0.07 * ramp(t, w, s) * nz(beat_hi)) + ramp(t, dip + 2.2, dip + 2.8) * (0.30 * nz(hold) + 0.5 * nz(pul))
    y *= 1 - ramp(t, c["end"] - 0.6, c["end"])
    return nz(reverb(y, 1.5, 0.2))


# ---------------------------------------------------------------------------------------------------------------------------------
# « Piano de peur » : piano seul, léger, dans une tonalité de peur (demande utilisateur du 2026-11-12 : « de légères notes ou accords de
# piano dans une tonalité de stress ou de peur »). Accords dissonants arpégés doucement (mi dim7, fa mineur 7 majeur, sol mineur avec ré/mi♭
# qui frottent, triton la♭/si/mi♭/sol♭), la note du haut qui goutte, paire mi–fa aiguë qui tinte (seconde mineure). La tension monte (accords
# plus rapprochés, notes plus fortes, octave en plus), gros cluster de piano sur l'éclair après une montée, silence net sur « glacée », puis
# une note grave et la seconde mineure aiguë qui tinte jusqu'à la fin, sans résolution. band_P(dur, cues) -> mono float64 48 kHz.
from bandes import piano

CH_P = [[40, 52, 55, 58, 61], [41, 53, 56, 60, 64], [43, 55, 58, 62, 63], [44, 56, 59, 63, 66]]

def band_P(dur, c):
    T = Track(dur, 81); t = T.t; w, s, dip = c["welcome"], c["sixty"], c["dip"]
    pn, hi, st, ped = T.buf(), T.buf(), T.buf(), T.buf()
    p, k = 0.4, 0
    while p < dip - 1.2:
        I = 0.4 + 0.3 * float(ramp(np.array([p]), w - 2, w + 3)[0]) + 0.3 * float(ramp(np.array([p]), s - 6, s)[0])
        ch = CH_P[k % 4]
        T.put(pn, piano(midi(ch[0]), T.x(4.5)), p, 0.9)
        gap = 0.46 - 0.2 * I; q = p + 0.18
        for n in ch[1:]:
            T.put(pn, piano(midi(n + (12 if I > 0.75 else 0)), T.x(3.2)), q, 0.5 + 0.3 * I); q += gap
        for r in range(3): T.put(pn, piano(midi(ch[-1] + 12), T.x(2.4)), q + r * gap * 1.7, (0.32 + 0.25 * I) * (0.78 ** r))
        p += 4.6 - 1.7 * I; k += 1
    q = w - 0.5; step = 1.0                                                           # paire mi–fa aiguë qui tinte : de plus en plus serrée
    while q < dip - 0.4:
        T.put(hi, piano(midi(88), T.x(2.0)), q, 0.34); T.put(hi, piano(midi(89), T.x(2.0)), q + 0.11, 0.3)
        q += step; step = max(0.38, step - 0.035)
    def hit(t1, g):                                                                   # gros cluster de piano grave
        for m in (28, 29, 35, 40, 41, 47, 52, 53, 59): T.put(st, piano(midi(m), T.x(4.0)), t1, g)
    hit(w - 0.02, 0.35); hit(s - 0.02, 0.8)
    T.put(ped, swell(T, s, 3.0), 0.0, 1.0)
    p2 = dip + 2.3; T.put(pn, piano(midi(40), T.x(5.0)), p2, 0.9)
    q = p2 + 0.9
    while q < dur - 0.5: T.put(hi, piano(midi(88), T.x(2.4)), q, 0.34); T.put(hi, piano(midi(89), T.x(2.4)), q + 0.12, 0.28); q += 1.9
    cut = np.where(t < dip, 1 - ramp(t, dip - 0.05, dip), 0.0); back = ramp(t, dip + 2.2, dip + 2.4)
    drone = (np.sin(2 * np.pi * midi(28) * t) + 0.8 * np.sin(2 * np.pi * midi(29) * t)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.13 * t))
    y = (cut + back) * (0.85 * nz(pn) + 0.40 * nz(hi)) + cut * (0.55 * nz(st) + 0.45 * nz(ped) + (0.10 + 0.14 * ramp(t, w, s)) * nz(lp(drone, 160)))
    y *= 1 - ramp(t, c["end"] - 0.6, c["end"])
    return nz(reverb(y, 2.4, 0.34))
