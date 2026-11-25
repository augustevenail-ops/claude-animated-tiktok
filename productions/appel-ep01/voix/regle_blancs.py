# Règle les blancs entre phrases d'après l'alignement (words.json) : fin de phrase 0,45 s (silence net à chaque point), temps qui passe
# (« Les heures passent. », « minuit. », « Lucas. ») 0,60 s, fin de paragraphe 0,75 s. Le silence est ajouté ou retiré
# à l'endroit le plus calme du blanc ; les blancs à l'intérieur des phrases ne sont pas touchés.
#   python3 regle_blancs.py voice.mp3 words.json texte.txt voice_regle.mp3
import json, re, subprocess, sys
import numpy as np

src, wj, txt, dst = sys.argv[1:5]; SR = 44100
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                 capture_output=True, check=True).stdout, np.float32).copy()
w = json.load(open(wj, encoding="utf-8"))
paras = [p.split() for p in open(txt, encoding="utf-8").read().replace("«", "").replace("»", "").split("\n\n") if p.strip()]
fin_para = set(np.cumsum([len(p) for p in paras])[:-1] - 1)          # index du dernier mot de chaque paragraphe
LONG = {"passent.", "minuit.", "Lucas."}                           # temps qui passe, énumération de la famille

cuts = []                                                              # (position en échantillons, delta en s)
for i, (a, b) in enumerate(zip(w, w[1:])):
    if not re.search(r"[.!?]$", a["w"]): continue
    tgt = 0.75 if i in fin_para else 0.60 if a["w"] in LONG else 0.45   # consigne : un vrai silence à chaque point
    g = b["s"] - a["e"]
    if abs(g - tgt) < 0.06: continue
    s0, s1 = int(a["e"] * SR), int(b["s"] * SR); n = SR // 100
    if s1 - s0 > 8 * n:                                                # centre de la fenêtre de 80 ms la plus calme du blanc
        e = [np.max([np.sqrt(np.mean(x[q:q + n] ** 2)) for q in range(k, k + 8 * n, n)]) for k in range(s0, s1 - 8 * n, n)]
        pos = s0 + int(np.argmin(e)) * n + 4 * n
    else: pos = (s0 + s1) // 2
    cuts.append((pos, tgt - g, max(0, s1 - s0)))

parts, last = [], 0
for pos, d, gap in cuts:
    if d > 0: parts += [x[last:pos], np.zeros(int(d * SR), np.float32)]; last = pos
    else:
        r = min(int(-d * SR), max(0, gap - int(0.1 * SR)))             # on garde au moins 0,1 s du blanc d'origine
        parts.append(x[last:pos - r // 2]); last = pos + (r - r // 2)
parts.append(x[last:])
F = int(0.012 * SR)                                                    # fondus 12 ms à chaque raccord : pas de clic
for k, p in enumerate(parts):
    if len(p) > 2 * F and p.any():
        if k: p[:F] *= np.linspace(0, 1, F)
        if k < len(parts) - 1: p[-F:] *= np.linspace(1, 0, F)
y = np.concatenate(parts)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", dst], input=y.tobytes(), check=True)
print(f"{len(cuts)} blancs réglés ; durée {len(y) / SR:.2f} s")
