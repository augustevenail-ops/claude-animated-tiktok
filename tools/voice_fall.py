# Fait FINIR les phrases vers le grave (une fin aiguë sonne comme une question). Aucun crédit ElevenLabs : on mesure la hauteur (f0) du
# dernier mot de chaque AFFIRMATION par rapport au reste de sa phrase, puis on l'abaisse (rubberband, durée inchangée) par un glissando
# doux jusqu'à « DROP » demi-tons sous le niveau de la phrase. Les questions (« ? ») ne sont pas touchées. Le timing (words.json) ne change pas.
# Usage : python tools/voice_fall.py productions/<ep> [drop_demi-tons=2.2] [--brut]   (--brut : repart de voice_brut.wav, sans double application)
import json, os, re, shutil, subprocess, sys
import numpy as np
EP = sys.argv[1]; DROP = float(next((a for a in sys.argv[2:] if not a.startswith("--")), 2.2)); BRUT = "--brut" in sys.argv
V = os.path.join(EP, "voice"); SR = 48000
words = json.load(open(os.path.join(V, "words.json"), encoding="utf-8"))
src = os.path.join(V, "voice_brut.wav") if BRUT and os.path.exists(os.path.join(V, "voice_brut.wav")) else os.path.join(V, "voice.wav")
if not BRUT or not os.path.exists(os.path.join(V, "voice_brut.wav")): shutil.copy(os.path.join(V, "voice.wav"), os.path.join(V, "voice_brut.wav"))
def dec(p): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
x = dec(src)

# questions : mot suivi d'un « ? » dans text.txt
toks = re.sub(r"\{\w+\}", "", open(os.path.join(V, "text.txt"), encoding="utf-8").read()).split(); keep = [(i, t) for i, t in enumerate(toks) if re.search(r"\w", t)]
quest = [(i + 1 < len(toks) and toks[i + 1].strip("»") == "?") or t.endswith("?") for i, t in keep]
assert len(keep) == len(words), (len(keep), len(words))

# f0 par autocorrélation (fenêtres 40 ms, pas 10 ms, 70-300 Hz)
H, Wn = 480, 1920; lmin, lmax = int(SR / 300), int(SR / 70); T0, F0 = [], []
for a in range(0, len(x) - Wn, H):
    fr = x[a:a + Wn] * np.hanning(Wn)
    if np.sqrt(np.mean(fr ** 2)) < 0.01: continue
    r = np.fft.irfft(np.abs(np.fft.rfft(fr, 4096)) ** 2)[:lmax + 1]; r /= r[0] + 1e-12
    lag = lmin + int(np.argmax(r[lmin:lmax])); 
    if r[lag] > 0.4: T0.append(a / SR + Wn / 2 / SR); F0.append(SR / lag)
T0, F0 = np.array(T0), np.array(F0)
def f0_in(a, b):
    m = (T0 >= a) & (T0 <= b); return float(np.median(F0[m])) if m.sum() >= 3 else None
glob = float(np.median(F0))

ends = [i for i, w in enumerate(words) if re.search(r"[.…!]$|\.\.\.$", w["w"]) or quest[i]]
ops, rep, st = [], [], 0
for e in ends:
    ws = list(range(st, e + 1)); st = e + 1
    if quest[e]: continue
    ref = f0_in(words[ws[0]]["s"], words[ws[-2]]["e"]) if len(ws) > 1 else None
    ref = ref or glob; last = f0_in(words[e]["s"], words[e]["e"])
    if not last: continue
    delta = 12 * np.log2(last / ref); shift = -DROP - delta
    if shift > -0.5: rep.append((words[e]["w"], round(delta, 1), 0)); continue
    shift = max(shift, -5.0); rep.append((words[e]["w"], round(delta, 1), round(shift, 1)))
    ws0, we0 = words[e]["s"], words[e]["e"] + 0.12; n = 3; step = (we0 - ws0) / n
    if e > 0: ops.append((max(0.0, words[e - 1]["s"]), words[e]["s"], 0.25 * shift))
    for k, g in enumerate((0.5, 0.8, 1.0)): ops.append((ws0 + k * step, ws0 + (k + 1) * step, g * shift))
print("fin de phrase (mot, écart vs phrase en demi-tons, abaissement appliqué) :", rep)

def shifted(seg, st):
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", f"rubberband=pitch={2 ** (st / 12):.5f}:tempo=1:pitchq=quality", "-f", "f32le", "-"],
                       input=seg.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    y = np.frombuffer(r, np.float32).astype(float); out = np.zeros(len(seg)); n = min(len(seg), len(y)); out[:n] = y[:n]; return out
acc, wsum = np.zeros(len(x)), np.zeros(len(x)); F = int(0.012 * SR); ctx = int(0.08 * SR)
for a, b, st_ in ops:
    i0, i1 = int(a * SR), min(len(x), int(b * SR) + F)
    if i1 - i0 < 400: continue
    c0, c1 = max(0, i0 - ctx), min(len(x), i1 + ctx); y = shifted(x[c0:c1], st_)[i0 - c0:i0 - c0 + (i1 - i0)]
    w = np.ones(len(y)); w[:F] = np.linspace(0, 1, F); w[-F:] = np.linspace(1, 0, F)
    acc[i0:i0 + len(y)] += y * w; wsum[i0:i0 + len(y)] += w
wc = np.minimum(wsum, 1.0); out = x * (1 - wc) + acc / np.maximum(wsum, 1e-9) * wc
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", os.path.join(V, "voice.wav")], input=out.astype(np.float32).tobytes(), check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(V, "voice.wav"), "-b:a", "160k", os.path.join(V, "voice_ecoute.mp3")])
print("voice.wav mise à jour (original : voice_brut.wav)")
