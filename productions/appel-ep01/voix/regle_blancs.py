# Règle les pauses d'après l'alignement (words.json) en mesurant le silence RÉEL (< -45 dB) à chaque ponctuation :
# point 0,36 s, temps forts 0,50 s, fin de paragraphe 0,60 s, virgule / deux-points 0,14 s. Le silence n'est ajouté ou
# retiré qu'à l'intérieur d'un vrai silence (jamais dans un son : pas de « euh » coupé) ; virgule sans silence = laissée telle quelle.
#   python3 regle_blancs.py voice_brut.mp3 words_brut.json texte.txt voice.mp3
import json, re, subprocess, sys
import numpy as np

src, wj, txt, dst = sys.argv[1:5]; SR = 44100; n = SR // 100
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                 capture_output=True, check=True).stdout, np.float32).copy()
w = json.load(open(wj, encoding="utf-8"))
paras = [p.split() for p in open(txt, encoding="utf-8").read().replace("«", "").replace("»", "").split("\n\n") if p.strip()]
fin_para = set(np.cumsum([len(p) for p in paras])[:-1] - 1)
FORT = {"passent.", "minuit.", "pas.", "jamais."}                       # temps forts : un souffle de plus
e = 20 * np.log10(np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, 1)) + 1e-9)

# Début de mot dédoublé (artefact Fish, entendu comme un grésillement avant « Chaque », « Après », « Lucas ») : bouffée
# ≤ 0,12 s qui commence au début aligné du mot suivant une ponctuation, suivie d'un vrai trou (< -50 dB, creux < -70 dB)
# puis du mot -> la bouffée est effacée avec fondus de 5 ms.
nett = []
for a, b in zip(w, w[1:]):
    if a["w"][-1] not in ".!?,:": continue
    f, f1 = int(a["e"] * 100) + 3, int(b["s"] * 100) + 3
    while f <= f1:
        if e[f] > -45 and e[f - 4:f].min() < -50:
            while e[f - 1] > -50: f -= 1
            g = f
            while g < len(e) and e[g] > -50: g += 1
            h = g
            while h < len(e) and e[h] < -50: h += 1
            if g - f <= 12 and h - g >= 3 and e[g:h].min() < -70:
                F = int(0.005 * SR); q0, q1 = f * n, g * n
                x[q0:q1] = 0; x[q0 - F:q0] *= np.linspace(1, 0, F); x[q1:q1 + F] *= np.linspace(0, 1, F)
                nett.append(f"{b['w']} {f / 100:.2f}")
            break
        f += 1
e = 20 * np.log10(np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, 1)) + 1e-9)


def run(f0, f1):                                                       # plus long silence (trames) dans [f0, f1)
    best, cur, st = (0, 0), 0, 0
    for f in range(max(0, f0), min(len(e), f1)):
        if e[f] < -45:
            if not cur: st = f
            cur += 1
            if cur > best[1] - best[0]: best = (st, st + cur)
        else: cur = 0
    return best

edits, rep = [], []                                                    # (position éch., delta s)
for i, (a, b) in enumerate(zip(w, w[1:])):
    p = a["w"][-1]
    if p not in ".!?,:": continue
    tgt = 0.28 if a["w"] == "heures," and b["w"].startswith("minuit") else 0.14 if p in ",:" else 0.60 if i in fin_para else 0.50 if a["w"] in FORT else 0.36
    r0, r1 = run(int(a["e"] * 100) - 10, int(b["s"] * 100) + 10); L = (r1 - r0) / 100
    if L >= 0.03:
        f = r0 + int(np.argmin(e[r0:r1])); pos = f * n + n // 2
        if L < tgt - 0.03: edits.append((pos, tgt - L))
        elif L > tgt + 0.12: edits.append((pos, -(L - tgt), (r0 * n, r1 * n)))
    elif p not in ",:":                                                # point sans silence : trame la plus calme si assez basse
        f0 = int(a["e"] * 100) - 6; f = f0 + int(np.argmin(e[f0:int(b["s"] * 100) + 6]))
        if e[f] < -35: edits.append((f * n + n // 2, tgt))
        else: rep.append(f"point sans creux : {a['w']} {b['w']}")

parts, last = [], 0
for ed in sorted(edits):
    pos, d = ed[0], ed[1]
    if d > 0: parts += [x[last:pos], np.zeros(int(d * SR), np.float32)]; last = pos
    else:                                                              # retrait centré, borné au silence mesuré
        r = int(-d * SR); lo = max(ed[2][0] + n, pos - r // 2); hi = min(ed[2][1] - n, lo + r)
        parts.append(x[last:lo]); last = hi
parts.append(x[last:])
F = int(0.008 * SR)                                                    # fondus 8 ms aux raccords (dans le silence)
for k, q in enumerate(parts):
    if len(q) > 2 * F and q.any():
        q = parts[k] = q.copy()
        if k: q[:F] *= np.linspace(0, 1, F)
        if k < len(parts) - 1: q[-F:] *= np.linspace(1, 0, F)
y = np.concatenate(parts)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", dst], input=y.tobytes(), check=True)
print("\n".join(rep)); print("débuts dédoublés effacés :", nett); print(f"{len(edits)} pauses réglées ; durée {len(y) / SR:.2f} s")
