#!/usr/bin/env python3
"""Retire des passages de charabia TTS sans tout régénérer (voix + image coupées ensemble, sur un changement de plan).
  python3 tools/coupe_charabia.py <voix_in.wav> <voix_out.wav> <cuts.json> c0:c1:B [c0:c1:B ...]
c0-c1 : intervalle de voix à retirer (s) ; B : image de début du plan suivant. La longueur est arrondie à l'image
(L = round((c1-c0)*30)) ; l'image retire [B-L, B) (fin du plan précédent), la voix [c0, c0+L/30).
Condition : B >= (c0+L/30)*30, pour que seul du silence soit décalé entre les deux coupes."""
import json, subprocess, sys
import numpy as np
SR, FPS = 48000, 30
src, dst, cj = sys.argv[1:4]
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f64le", "-"], capture_output=True).stdout, np.float64).copy()
cuts = []
for a in sys.argv[4:]:
    c0, c1, B = a.split(":"); c0, c1, B = float(c0), float(c1), int(B)
    L = round((c1 - c0) * FPS); c1 = c0 + L / FPS
    assert B >= c1 * FPS - 0.5, f"coupe {a} : la voix déborde sur le plan suivant"
    cuts.append(dict(c0=round(c0, 4), c1=round(c1, 4), L=L, B=B))
cuts.sort(key=lambda c: c["c0"]); keep, prev, f = [], 0, int(0.015 * SR)
for c in cuts:
    s0, s1 = int(c["c0"] * SR), int(c["c1"] * SR)
    a = x[prev:s0].copy(); a[-f:] *= np.linspace(1, 0, f); keep.append(a); prev = s1
b = x[prev:].copy(); b[:f] *= np.linspace(0, 1, f); keep.append(b)
for k in range(1, len(keep) - 1): keep[k][:f] *= np.linspace(0, 1, f)
y = np.concatenate(keep)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", dst], input=y.tobytes(), check=True)
json.dump(cuts, open(cj, "w"), indent=1); print("retiré", sum(c["L"] for c in cuts), "images ;", round(len(y) / SR, 2), "s")
