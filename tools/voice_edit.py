# Pauses choisies + voix plus grave/lente, à partir de voice_raw.mp3 + words_raw.json (tools/tts_episode.py).
# Usage : python tools/voice_edit.py <dossier voice> [--end 0.27] [--comma 0.10] [--inner 0.06]
#           [--tension "mot1,mot2"] [--tpause 0.55] [--pitch -1.5] [--tempo 0.975]
# Règle des pauses : fin de phrase (. ? ! … ») = --end ; virgule / deux-points = --comma ; entre deux mots = --inner max ;
# avant les mots listés dans --tension (début du mot) = --tpause. Les blancs plus courts que la cible ne sont pas allongés.
# Puis ffmpeg rubberband : --pitch demi-tons (négatif = plus grave), --tempo (< 1 = plus lent).
# Sorties : voice.wav (48 kHz), words.json recalé, voice_ecoute.mp3.
import json, os, re, subprocess, sys
import numpy as np

d = sys.argv[1]
o = {"--end": "0.27", "--comma": "0.10", "--inner": "0.06", "--tension": "", "--tpause": "0.55", "--pitch": "-1.5", "--tempo": "0.975"}  # validated defaults (docs/VOIX.md)
a = sys.argv[2:]
for i, k in enumerate(a):
    if k in o: o[k] = a[i + 1]
END, COMMA, INNER, TP = (float(o[k]) for k in ("--end", "--comma", "--inner", "--tpause"))
PITCH, TEMPO = float(o["--pitch"]), float(o["--tempo"])
tension = [t.strip().lower() for t in o["--tension"].split(",") if t.strip()]
SR = 44100
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(d, "voice_raw.mp3"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
x = np.frombuffer(raw, np.float32).copy()
W = json.load(open(os.path.join(d, "words_raw.json"), encoding="utf-8"))
M = 0.03  # safety margin kept around every word edge (s)
fade = int(0.012 * SR)
pieces, words, t_new, cursor = [], [], 0.0, 0.0
def take(a_s, b_s):
    seg = x[int(a_s * SR):int(b_s * SR)].copy()
    if len(seg) > 2 * fade:
        seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
    return seg
start = max(0.0, W[0]["s"] - 0.05)
seg_start = start
for i, w in enumerate(W):
    words.append({"w": w["w"], "s": w["s"], "e": w["e"]})
    if i == len(W) - 1: break
    nxt = W[i + 1]
    gap = nxt["s"] - w["e"]
    if nxt["w"].strip("«»…. ").lower().startswith(tuple(tension)) if tension else False: target = TP
    elif re.search(r"[.?!…»]$", w["w"]): target = END
    elif re.search(r"[,:;]$", w["w"]): target = COMMA
    else: target = INNER
    if gap > target + 2 * M:
        cut_a = w["e"] + M + (target - 2 * M) / 2 if target > 2 * M else w["e"] + M
        cut_b = nxt["s"] - M - (target - 2 * M) / 2 if target > 2 * M else nxt["s"] - M
        pieces.append((seg_start, cut_a)); seg_start = cut_b
pieces.append((seg_start, W[-1]["e"] + 0.25))
# rebuild + time map
out, mp, acc = [], [], 0.0
for a_s, b_s in pieces:
    out.append(take(a_s, b_s)); mp.append((a_s, b_s, acc)); acc += b_s - a_s
def remap(t):
    for a_s, b_s, n0 in mp:
        if t <= b_s: return n0 + max(0.0, t - a_s)
    return acc
y = np.concatenate(out)
tmp = os.path.join(d, "_edit.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", tmp], input=y.astype(np.float32).tobytes())
ratio = 2 ** (PITCH / 12)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-af", f"rubberband=pitch={ratio:.5f}:tempo={TEMPO}:pitchq=quality", "-ar", "48000", os.path.join(d, "voice.wav")], check=True)
os.remove(tmp)
k = 1 / TEMPO
for w in words: w["s"], w["e"] = round(remap(w["s"]) * k, 3), round(remap(w["e"]) * k, 3)
json.dump(words, open(os.path.join(d, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(d, "voice.wav"), "-b:a", "160k", os.path.join(d, "voice_ecoute.mp3")])
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(d, "voice.wav")], capture_output=True, text=True).stdout)
print(f"durée {dur:.2f} s ; {len(words)} mots ; {len(words) / words[-1]['e']:.2f} mots/s")
