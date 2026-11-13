# Planche « voix plus agréable » : effets de finition de narrateur sur un extrait (même volume -22,5 LUFS pour comparer).
#  air : brillance douce au-dessus de 10 kHz (puis sifflantes re-domptées) ; parallèle : copie très compressée mélangée sous la voix
#  (densité, présence, sans écraser les nuances) ; plaque : réverbération courte et filtrée, pré-délai 18 ms (espace, pas d'écho).
# Usage : python tools/voix_effets.py <dossier_voix>  -> <dossier>/effets/effet_<X>.mp3
import json, os, re, subprocess, sys
import numpy as np
from scipy.signal import butter, sosfilt, sosfiltfilt, fftconvolve

D = sys.argv[1]; SR = 48000; OUT = os.path.join(D, "effets"); os.makedirs(OUT, exist_ok=True)
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", os.path.join(D, "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True).stdout, np.float32).astype(np.float64)
W = json.load(open(os.path.join(D, "words.json"), encoding="utf-8"))
q = [i for i, w in enumerate(W) if w["role"] != "narrateur"]
a_end = W[q[0]]["s"] - 0.1; j = next(i for i in range(q[0], len(W)) if W[i]["role"] == "narrateur")
b0 = W[j]["s"] - 0.05; b1 = next((W[i]["e"] + 0.3 for i in range(j, len(W)) if W[i]["s"] > b0 + 9 and W[i]["w"][-1] in ".?!…"), b0 + 10)
ex = np.concatenate([x[:int(a_end * SR)], np.zeros(int(0.5 * SR)), x[int(b0 * SR):int(b1 * SR)]])

def ff(y, af):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", af, "-f", "f32le", "-"],
                                        input=y.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, np.float32).astype(np.float64)
def lufs(y):
    r = subprocess.run(["ffmpeg", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=y.astype(np.float32).tobytes(), capture_output=True).stderr.decode()
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
def desib(y, thr_db=-30.0, ratio=4.0):
    hi = sosfiltfilt(butter(4, 3200, "highpass", fs=SR, output="sos"), y); lo = y - hi; k = int(0.004 * SR)
    e = 20 * np.log10(np.sqrt(np.convolve(hi ** 2, np.ones(k) / k, "same")) + 1e-9)
    g = np.convolve(np.where(e > thr_db, (thr_db - e) * (1 - 1 / ratio), 0.0), np.ones(int(0.006 * SR)) / int(0.006 * SR), "same")
    return lo + hi * 10 ** (g / 20)
def norm(y): return y * 10 ** ((-22.5 - lufs(y)) / 20)
def air(y):                                                     # brillance parallèle à phase nulle (pas d'interférence avec la voix sèche)
    hi = sosfiltfilt(butter(2, 9500, "highpass", fs=SR, output="sos"), y)
    return desib(y + hi * (10 ** (2.5 / 20) - 1))
def parallel(y):                                                # copie écrasée, filtrée 120 Hz-12 kHz, glissée 9 dB sous la voix
    c = ff(norm(y), "highpass=f=120,lowpass=f=12000,acompressor=threshold=-38dB:ratio=10:attack=2:release=80:makeup=8")
    return y + norm(c) * 10 ** (-9 / 20)
def plate(y, rt=0.9, wet_db=-24, pre=0.018):                    # plaque courte, retour filtré 300 Hz-6 kHz
    n = int(rt * SR); t = np.arange(n) / SR; rng = np.random.default_rng(7)
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt) * (1 - np.exp(-t / 0.004))
    ir = sosfilt(butter(2, [300, 6000], "bandpass", fs=SR, output="sos"), ir); ir /= np.sqrt((ir ** 2).sum())
    wet = fftconvolve(y, np.concatenate([np.zeros(int(pre * SR)), ir]))[:len(y)]
    return y + wet * 10 ** (wet_db / 20)
V = {
    "A": ("F3 (actuelle)", lambda y: y),
    "B": ("F3 + air : brillance douce, voix plus nette et « chère »", air),
    "C": ("F3 + compression parallèle : plus dense et présente, nuances gardées", parallel),
    "D": ("F3 + plaque courte : un peu d'espace autour de la voix, sans écho", plate),
    "E": ("chaîne complète : air + parallèle + plaque", lambda y: plate(parallel(air(y)))),
}
for k, (lab, f) in V.items():
    y = norm(f(ex.copy())); y *= min(1.0, 0.95 / np.abs(y).max())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", os.path.join(OUT, f"effet_{k}.mp3")],
                   input=y.astype(np.float32).tobytes(), check=True)
    print(k, lab)
