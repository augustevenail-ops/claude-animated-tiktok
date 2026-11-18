#!/usr/bin/env python3
"""Montée de hauteur progressive sur la fin d'une prise (rubberband, formants conservés) : versions +1/+2/+3 demi-tons
enchaînées en fondus de 25 ms le long d'une rampe. python3 glide.py <prise.mp3> <t0> <t1> <G demi-tons> <sortie.wav>"""
import subprocess, sys
import numpy as np
SR = 44100
def load(f): return np.frombuffer(subprocess.run(["ffmpeg","-v","quiet","-i",f,"-ac","1","-ar",str(SR),"-f","f32le","-"],capture_output=True).stdout,np.float32).copy()
def shifted(src, st):
    out = f"glide/_{abs(hash((src, st)))}.wav"
    subprocess.run(["ffmpeg","-loglevel","error","-y","-i",src,"-af",f"rubberband=pitch={2**(st/12)}:formant=preserved:pitchq=quality",out],check=True)
    s = load(out); o = load(src); n = min(len(o), len(s)); k = int(0.01*SR)
    e1 = np.convolve(np.abs(o[:n]), np.ones(k)/k, "same"); e2 = np.convolve(np.abs(s[:n]), np.ones(k)/k, "same")
    c = np.correlate(e2, e1, "full"); lag = int(np.argmax(c) - (n-1))          # retard de rubberband à compenser
    s = np.roll(s, -lag); return s[:len(o)] if len(s) >= len(o) else np.pad(s, (0, len(o)-len(s)))
def glide(src, t0, t1, G, power=1.5, cf=0.025):
    o = load(src); vers = [o] + [shifted(src, st) for st in (1, 2, 3)]
    t = np.arange(len(o)) / SR; r = np.clip((t - t0) / (t1 - t0), 0, 1) ** power * G
    idx = np.clip(np.floor(r + 0.5), 0, 3).astype(int)                        # version la plus proche de la rampe
    out = np.zeros(len(o), np.float32); n = int(cf*SR)
    w = np.zeros((4, len(o)), np.float32)
    for k in range(4): w[k] = (idx == k).astype(np.float32)
    ker = np.hanning(n*2+1).astype(np.float32); ker /= ker.sum()
    for k in range(4): w[k] = np.convolve(w[k], ker, "same")
    w /= (w.sum(0) + 1e-9)
    for k in range(4): out += w[k] * vers[k]
    return out
if __name__ == "__main__":
    src, t0, t1, G, dst = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
    a = np.clip(glide(src, t0, t1, G), -0.98, 0.98).astype(np.float32)
    subprocess.run(["ffmpeg","-v","error","-y","-f","f32le","-ar",str(SR),"-ac","1","-i","-",dst],input=a.tobytes(),check=True)
