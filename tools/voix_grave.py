# Planche d'écoute « voix plus grave, naturelle » : extrait narrateur d'une voix perso, plusieurs réglages, même volume (-22,5 LUFS).
# Abaissement par PSOLA (Praat, « Change gender ») : découpe la voix période par période, sans vocodeur -> pas d'effet robot ni de grésillement.
# Deux leviers séparés : la hauteur (notes plus basses) et les formants (timbre plus « grand », poitrine plus large).
# Usage : python tools/voix_grave.py productions/<ep>/<voix_dir> -> <voix_dir>/grave/grave_<X>.mp3
import json, os, re, subprocess, sys
import numpy as np, parselmouth
from parselmouth.praat import call

D = sys.argv[1]; SR = 48000; OUT = os.path.join(D, "grave"); os.makedirs(OUT, exist_ok=True)
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", os.path.join(D, "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True).stdout, np.float32).astype(np.float64)
W = json.load(open(os.path.join(D, "words.json"), encoding="utf-8"))
q = [i for i, w in enumerate(W) if w["role"] != "narrateur"]
a_end = W[q[0]]["s"] - 0.1; j = next(i for i in range(q[0], len(W)) if W[i]["role"] == "narrateur")
b0 = W[j]["s"] - 0.05; b1 = next((W[i]["e"] + 0.3 for i in range(j, len(W)) if W[i]["s"] > b0 + 9 and W[i]["w"][-1] in ".?!…"), b0 + 10)
ex = np.concatenate([x[:int(a_end * SR)], np.zeros(int(0.5 * SR)), x[int(b0 * SR):int(b1 * SR)]])

snd = parselmouth.Sound(ex, SR)
f0 = call(snd.to_pitch(time_step=0.01, pitch_floor=60, pitch_ceiling=400), "Get quantile", 0, 0, 0.5, "Hertz")
print(f"hauteur médiane de la voix : {f0:.0f} Hz")
def psola(st=0.0, formant=1.0):
    """st : demi-tons (négatif = plus grave) ; formant : < 1 = timbre plus grand/sombre"""
    if st == 0 and formant == 1: return ex.copy()
    out = call(snd, "Change gender", 60, 400, formant, f0 * 2 ** (st / 12), 1.0, 1.0)
    return out.values[0].astype(np.float64)
def ff(y, af):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", af, "-f", "f32le", "-"],
                                        input=y.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, np.float32).astype(np.float64)
def lufs(y):
    r = subprocess.run(["ffmpeg", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=y.astype(np.float32).tobytes(), capture_output=True).stderr.decode()
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])
BODY = "lowshelf=f=130:g=2,equalizer=f=320:t=q:w=1.2:g=-1"          # un peu plus de poitrine, sans gonfler
V = {
    "A": ("actuelle (B + D, sans changement de hauteur)", lambda: psola()),
    "B": ("un peu plus grave : -0,7 demi-ton", lambda: psola(-0.7)),
    "C": ("plus grave : -1,2 demi-ton", lambda: psola(-1.2)),
    "D": ("même hauteur, timbre plus grand (formants -4 %)", lambda: psola(0, 0.96)),
    "E": ("un peu plus grave + timbre plus grand (-0,7 demi-ton, formants -3 %)", lambda: psola(-0.7, 0.97)),
    "F": ("E + un peu plus de poitrine dans le grave", lambda: ff(psola(-0.7, 0.97), BODY)),
}
for k, (lab, f) in V.items():
    y = f(); y *= 10 ** ((-22.5 - lufs(y)) / 20); y *= min(1.0, 0.95 / np.abs(y).max())
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", os.path.join(OUT, f"grave_{k}.mp3")],
                   input=y.astype(np.float32).tobytes(), check=True)
    print(k, lab)
