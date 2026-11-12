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
