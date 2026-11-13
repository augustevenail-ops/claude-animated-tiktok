# Planche d'écoute : plusieurs traitements « narrateur » sur un extrait de la voix perso (sans changer la hauteur),
# chaque variante ramenée au même volume (-22,5 LUFS) pour comparer honnêtement.
# Usage : python tools/voix_variantes.py productions/<ep>/<voix_dir>   -> <voix_dir>/variantes/variante_<X>.mp3
import json, os, re, subprocess, sys
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

D = sys.argv[1]; SR = 48000; OUT = os.path.join(D, "variantes"); os.makedirs(OUT, exist_ok=True)
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", os.path.join(D, "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True).stdout, np.float32).astype(np.float64)
W = json.load(open(os.path.join(D, "words.json"), encoding="utf-8"))
# extrait narrateur seul : du début à la 1re réplique d'un autre rôle, puis ~10 s après elle
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
def room(y, rt, wet_db, pre=0.012, lp=5000, seed=3):
    """réverbération synthétique douce (bruit à décroissance exponentielle, filtré) mélangée en parallèle"""
    n = int(rt * SR); t = np.arange(n) / SR; rng = np.random.default_rng(seed)
    ir = rng.standard_normal(n) * np.exp(-6.9 * t / rt); ir = sosfilt(butter(2, lp, "lowpass", fs=SR, output="sos"), ir)
    ir = np.concatenate([np.zeros(int(pre * SR)), ir / np.sqrt((ir ** 2).sum())])
    wet = fftconvolve(y, ir)[:len(y)]
    return y + wet * 10 ** (wet_db / 20)

WARM = "equalizer=f=110:t=q:w=0.9:g=3,equalizer=f=260:t=q:w=1.0:g=-1.5,equalizer=f=2800:t=q:w=1.2:g=1.2,highshelf=f=9000:g=-1.5,acompressor=threshold=-26dB:ratio=3.5:attack=5:release=120:makeup=2"
DARK = "lowshelf=f=160:g=4,highshelf=f=6000:g=-3,acompressor=threshold=-28dB:ratio=4:attack=4:release=140:makeup=3,volume=4dB,asoftclip=type=tanh,volume=-4dB"
V = {
    "A": ("naturel (version actuelle)", lambda y: y),
    "B": ("chaud et proche : plus de corps dans le grave, voix « collée au micro »", lambda y: ff(y, WARM)),
    "C": ("chaud + profondeur : B dans une petite pièce feutrée", lambda y: room(ff(y, WARM), 0.35, -19)),
    "D": ("sombre et dense : grave appuyé, aigus adoucis, légère saturation à lampe", lambda y: ff(y, DARK)),
    "E": ("grand narrateur : D + réverbération de grande salle discrète", lambda y: room(ff(y, DARK), 1.3, -23, pre=0.03, lp=3500)),
}
for k, (lab, f) in V.items():
    y = f(ex); y *= 10 ** ((-22.5 - lufs(y)) / 20); y *= min(1.0, 0.95 / np.abs(y).max())
    p = os.path.join(OUT, f"variante_{k}.wav")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", p[:-4] + ".mp3"], input=y.astype(np.float32).tobytes(), check=True)
    print(k, lab)
