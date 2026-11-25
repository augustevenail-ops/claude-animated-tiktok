#!/usr/bin/env python3
"""Assemble la voix off à partir des meilleures prises (qc.json) avec des silences maîtrisés entre phrases.
Sortie : voix_off_v7.wav (48 kHz, 24 bits) + phrases/montage.json (prise choisie, début/fin de chaque phrase)."""
import json, re, subprocess, pathlib
import numpy as np
D = pathlib.Path(__file__).parent; P = D / "phrases"; SR = 48000
S = json.load(open(P / "phrases.json", encoding="utf-8")); C = D / "phrases2/cut"; Q = json.load(open(D / "phrases2/qc2.json", encoding="utf-8"))
GAP = {9: .6, 10: .8, 12: .6, 13: .6, 15: .6, 16: .35, 17: .5, 18: .4, 25: .6, 26: .8, 31: .22, 34: .7, 35: .7,
       37: .6, 38: .7, 40: .45, 41: .45, 42: .6, 43: .7}
def inner_pause(a):
    n = int(0.01 * SR); db = 20 * np.log10(np.sqrt(np.add.reduceat(a ** 2, np.arange(0, len(a), n)) / n) + 1e-9)
    sp = np.where(db > -42)[0]; q = db[sp[0]:sp[-1] + 1] < -45; best = cur = 0
    for x in q: cur = cur + 1 if x else 0; best = max(best, cur)
    return best * 0.01
def load(p): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p), "-ac", "1", "-ar", str(SR), "-af", "highpass=f=70", "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
out = [np.zeros(int(0.25 * SR))]; t = 0.25; M = []
for i, txt in enumerate(S):
    ok = [k for k in Q if Q[k]["i"] == i and Q[k]["gap"] >= 0.15 and Q[k]["cut_db"] <= -40]
    ok = [k for k in ok if inner_pause(load(C / k)) <= (0.55 if re.search(r"[,:;]", txt) else 0.3)] or ok
    f = max(ok, key=lambda k: Q[k]["meanscore"])
    a = load(C / f); n = int(0.01 * SR)
    db = 20 * np.log10(np.sqrt(np.add.reduceat(a ** 2, np.arange(0, len(a), n)) / n) + 1e-9)
    sp = np.where(db > -42)[0]; s0 = max(0, sp[0] * n - int(0.03 * SR)); s1 = min(len(a), (sp[-1] + 1) * n + int(0.12 * SR))
    tail = float(db[-2:].max()); seg = a[s0:s1].copy()
    fi, fo = int(0.008 * SR), int(0.04 * SR); seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
    M.append(dict(i=i, take=f, score=Q[f]["meanscore"], pause=inner_pause(a), start=round(t, 3), end=round(t + len(seg) / SR, 3), tail_db=round(tail, 1), text=txt))
    out.append(seg); t += len(seg) / SR
    g = GAP.get(i, .5) if i < len(S) - 1 else 1.2; out.append(np.zeros(int(g * SR))); t += g
v = np.concatenate(out); v = v / np.abs(v).max() * 0.89
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", str(D / "voix_off_v7.wav")], input=v.tobytes(), check=True)
json.dump(M, open(P / "montage.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("durée", round(len(v) / SR, 2), "s ; coupures finales suspectes :", [(m["i"], m["take"], m["tail_db"]) for m in M if m["tail_db"] > -35])
