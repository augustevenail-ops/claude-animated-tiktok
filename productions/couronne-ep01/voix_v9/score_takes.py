#!/usr/bin/env python3
"""Note les prises : s04/radio = creux d'énergie à l'intérieur de la phrase (hors pauses de ponctuation) ; dil = montée de hauteur finale."""
import glob, subprocess, sys
import numpy as np
SR = 44100
def load(f): return np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32).copy()
def db(a): return 20*np.log10(np.sqrt(np.mean(a**2))+1e-9)
def dips(a, thr=-28, lo=0.12):
    h, w = int(0.01*SR), int(0.02*SR); e = [db(a[i:i+w]) for i in range(0, len(a)-w, h)]
    out, s = [], None
    for k, v in enumerate(e):
        if v < thr and s is None: s = k
        if v >= thr and s is not None:
            if k - s >= 6 and s/100 > lo and k/100 < len(a)/SR - lo: out.append((s/100, (k-s)/100, round(min(e[s:k]))))
            s = None
    return out
def f0(a, t0, t1):
    fr, hop = int(0.04*SR), int(0.01*SR); res = []
    for i in range(int(t0*SR), int(t1*SR)-fr, hop):
        x = a[i:i+fr] - np.mean(a[i:i+fr])
        if db(x) < -32: continue
        ac = np.correlate(x, x, "full")[fr-1:]; ac /= (ac[0] + 1e-9)
        lag = np.arange(int(SR/260), int(SR/70)); p = lag[np.argmax(ac[lag])]
        if ac[p] > 0.45: res.append(SR/p)
    return np.median(res) if len(res) >= 4 else None
def speech_end(a):
    h = int(0.01*SR); e = [db(a[i:i+h]) for i in range(0, len(a)-h, h)]; return (max(i for i, v in enumerate(e) if v > -40)+1)/100
name = sys.argv[1]
for f in sorted(glob.glob(f"takes/{name}_*.mp3")):
    a = load(f); d = dips(a); L = sorted([x[1] for x in d], reverse=True)
    if name == "dil":
        te = speech_end(a); fin = f0(a, te-0.30, te); mid = f0(a, te-1.0, te-0.45)
        print(f, "durée", round(len(a)/SR,2), "f0 fin/mid", None if fin is None else round(fin), None if mid is None else round(mid),
              "montée", None if (fin is None or mid is None) else round(12*np.log2(fin/mid),1), "demi-tons", "creux", [(round(x[0],2),x[1]) for x in d])
    else:
        keep = 1 if name == "s04" else 2           # pauses de ponctuation attendues (virgule / deux-points + virgule)
        score = round(sum(L[keep:]) + 0.05*max(len(L)-keep, 0), 2)
        print(f, "durée", round(len(a)/SR,2), "score", score, "creux", [(round(x[0],2), x[1], x[2]) for x in d])
