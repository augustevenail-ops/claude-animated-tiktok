# Raccourcit les blancs d'une voix off : chaque silence plus long que --max est ramené à --max secondes.
# Usage : python tools/voice_tighten.py in.mp3 out.wav [--max 0.22] [--db -40] [--keep "t1,t2"]
#   --keep : instants (s, dans le fichier d'origine) des pauses à garder plus longues (--keepmax, défaut 0.45 s),
#            pour les micro-pauses voulues avant une révélation.
# numpy + ffmpeg uniquement. Écrit aussi out.map.json : [[t_origine, t_nouveau], ...] pour recaler words.json.
import json, subprocess, sys
import numpy as np

args = sys.argv[1:]
src, dst = args[0], args[1]
opt = {"--max": "0.22", "--db": "-40", "--keep": "", "--keepmax": "0.45"}
for i, a in enumerate(args):
    if a in opt: opt[a] = args[i + 1]
mx, thr, keepmax = float(opt["--max"]), float(opt["--db"]), float(opt["--keepmax"])
keep = [float(x) for x in opt["--keep"].split(",") if x]
SR = 44100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
hop = SR // 100
rms = np.array([np.sqrt(np.mean(x[i:i + hop] ** 2) + 1e-12) for i in range(0, len(x), hop)])
quiet = 20 * np.log10(rms) < thr
runs, i = [], 0
while i < len(quiet):
    if quiet[i]:
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        runs.append((i * hop, min(j * hop, len(x))))
        i = j
    else: i += 1
fade = int(0.015 * SR)
out, pos, mapping, removed = [], 0, [[0.0, 0.0]], 0
for a, b in runs:
    if a == 0 or b >= len(x): continue  # leave head/tail silence to the editor
    lim = keepmax if any(a / SR - 0.3 <= k <= b / SR + 0.3 for k in keep) else mx
    n = b - a
    if n / SR <= lim: continue
    keep_n = int(lim * SR)
    cut0, cut1 = a + keep_n // 2, b - (keep_n - keep_n // 2)
    seg = x[pos:cut0].copy()
    if len(seg) > fade: seg[-fade:] *= np.linspace(1, 0, fade)
    out.append(seg)
    tail = x[cut1:cut1 + fade].copy()
    x[cut1:cut1 + fade] = tail * np.linspace(0, 1, len(tail))
    removed += cut1 - cut0
    pos = cut1
    mapping.append([round(cut1 / SR, 4), round((cut1 - removed) / SR, 4)])
out.append(x[pos:])
y = np.concatenate(out)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", dst], input=y.astype(np.float32).tobytes())
json.dump(mapping, open(dst.rsplit(".", 1)[0] + ".map.json", "w"))
print(f"{src}: {len(x) / SR:.2f} s -> {len(y) / SR:.2f} s ({removed / SR:.2f} s de blancs retirés)")
