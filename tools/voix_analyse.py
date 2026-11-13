# Analyse d'une prise de voix perso : segments de parole, pauses, claps (code erreur), souffles probables.
import sys, json, subprocess, numpy as np
src = sys.argv[1]; SR = 48000
raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).astype(np.float64)
H = 480; n = len(x) // H; fr = x[:n * H].reshape(n, H)
rms = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9); pk = 20 * np.log10(np.abs(fr).max(1) + 1e-9)
# énergie hautes fréquences relative (souffle / s : bruit ; voix voisée : grave)
spec = np.abs(np.fft.rfft(fr * np.hanning(H), axis=1)); f = np.fft.rfftfreq(H, 1 / SR)
lo = spec[:, (f > 80) & (f < 1000)].sum(1); hi = spec[:, f > 2500].sum(1); ratio = hi / (lo + 1e-9)
flat = np.exp(np.log(spec[:, 3:] + 1e-12).mean(1)) / (spec[:, 3:].mean(1) + 1e-12)
thr = np.median(rms[rms > -60]) - 22 if (rms > -60).any() else -45
sp = rms > thr
out = {"thr": float(thr), "frames": []}
for i in range(n): out["frames"].append([round(float(rms[i]), 1), round(float(pk[i]), 1), round(float(ratio[i]), 2), round(float(flat[i]), 3)])
json.dump(out, open(sys.argv[2], "w"))
# segments
segs = []; i = 0
while i < n:
    if sp[i]:
        j = i
        while j < n and (sp[j] or (j + 15 < n and sp[j:j + 15].any() and False)): j += 1
        segs.append((i, j)); i = j
    else: i += 1
# fusion des trous < 60 ms
m = []
for a, b in segs:
    if m and a - m[-1][1] < 6: m[-1] = (m[-1][0], b)
    else: m.append((a, b))
print("seuil", round(thr, 1), "dB ; segments", len(m))
for a, b in m:
    seg = slice(a, b); d = (b - a) * 10
    tag = ""
    if d < 120 and (pk[seg].max() - rms[seg].mean()) > 12: tag = "CLAP?"
    elif ratio[seg].mean() > 1.2 and rms[seg].max() < thr + 22: tag = "souffle?"
    print(f"{a/100:7.2f}-{b/100:7.2f} {d:5d}ms rms{rms[seg].max():6.1f} hf{ratio[seg].mean():5.2f} fl{flat[seg].mean():.3f} {tag}")
