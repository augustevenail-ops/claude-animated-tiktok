# Remplace UNE phrase dans voice.wav sans changer la durée totale : régénère la phrase (ElevenLabs, réglages du rôle),
# resserre ses blancs internes, l'ajuste au même créneau (rubberband, écart ±10 % max), la fond à la place de l'ancienne
# et met à jour words.json. Sauvegarde voice_avant_patch_<n>.wav / words_avant_patch_<n>.json.
# Usage : python tools/voice_patch.py productions/<ep> <index_premier_mot> <index_dernier_mot> "<nouvelle phrase>" [rôle]
import base64, json, os, re, shutil, subprocess, sys, urllib.request
import numpy as np
SR = 48000
ep, i0, i1, text = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
role = sys.argv[5] if len(sys.argv) > 5 else "narrateur"
CFG = json.load(open(os.path.join(ep, "voices.json"), encoding="utf-8")); c = CFG[role]
VD = os.path.join(ep, "voice"); W = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
n = 1
while os.path.exists(os.path.join(VD, f"voice_avant_patch_{n}.wav")): n += 1
shutil.copy(os.path.join(VD, "voice.wav"), os.path.join(VD, f"voice_avant_patch_{n}.wav"))
shutil.copy(os.path.join(VD, "words.json"), os.path.join(VD, f"words_avant_patch_{n}.json"))

body = {"text": c.get("prefix", "") + text + c.get("suffix", ""), "model_id": c["model"], "language_code": "fr", "voice_settings": c.get("settings")}
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{c['voice']}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("XI_API_KEY", "proxy-injected")})
d = json.load(urllib.request.urlopen(req, timeout=300))
os.makedirs(os.path.join(VD, "_patch"), exist_ok=True); fa = os.path.join(VD, "_patch", f"patch_{n}.mp3")
open(fa, "wb").write(base64.b64decode(d["audio_base64"]))
al = d.get("normalized_alignment") or d["alignment"]; words, cur = [], None
for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
    if ch.isspace():
        if cur: words.append(cur); cur = None
        continue
    if cur is None: cur = {"w": ch, "s": a, "e": b}
    else: cur["w"] += ch; cur["e"] = b
if cur: words.append(cur)
words = [w for w in words if re.search(r"\w", w["w"])]

def dec(p):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
x = dec(fa)
# blancs internes : virgule 0,10 s, entre mots ≤ 0,06 s (règles de docs/VOIX.md)
pieces, seg0, M = [], max(0.0, words[0]["s"] - 0.03), 0.03
for k in range(len(words) - 1):
    w, nx = words[k], words[k + 1]; tgt = 0.10 if re.search(r"[,:;]$", w["w"]) else 0.06
    if nx["s"] - w["e"] > tgt + 2 * M: half = max(0.0, tgt - 2 * M) / 2; pieces.append((seg0, w["e"] + M + half)); seg0 = nx["s"] - M - half
pieces.append((seg0, words[-1]["e"] + 0.04))
out, mp, acc = [], [], 0.0
for a, b in pieces:
    s = x[int(a * SR):int(b * SR)].copy(); F = int(0.01 * SR); s[:F] *= np.linspace(0, 1, F); s[-F:] *= np.linspace(1, 0, F)
    out.append(s); mp.append((a, b, acc)); acc += b - a
rm = lambda t: next((n0 + max(0.0, t - a) for a, b, n0 in mp if t <= b), acc)
y = np.concatenate(out); nw = [{"w": w["w"], "s": rm(w["s"]), "e": rm(w["e"])} for w in words]
# créneau visé : du début du 1er mot à la fin du dernier (ancienne prise)
s0, s1 = W[i0]["s"], W[i1]["e"]; core_new = nw[-1]["e"] - nw[0]["s"]
tempo = core_new / (s1 - s0)   # >1 : accélère
if not 0.9 <= tempo <= 1.1: sys.exit(f"écart de durée trop grand ({tempo:.3f}) : reformuler la phrase")
af = [f"rubberband=tempo={tempo:.5f}:pitch={2 ** (c.get('pitch', 0) / 12):.5f}:pitchq=quality"] + ([c["fx"]] if c.get("fx") else [])
y = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", ",".join(af), "-f", "f32le", "-"],
    input=y.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, np.float32).astype(float)
nw = [{"w": w["w"], "s": w["s"] / tempo, "e": w["e"] / tempo} for w in nw]
V = dec(os.path.join(VD, "voice.wav")); shift = s0 - nw[0]["s"]
# efface l'ancienne phrase (fondus de 15 ms) puis place la nouvelle, alignée sur le début du 1er mot
a, b = int((s0 - 0.03) * SR), int((W[i1]["e"] + 0.12) * SR); F = int(0.015 * SR)
V[a - F:a] *= np.linspace(1, 0, F); V[a:b] = 0; V[b:b + F] *= np.linspace(0, 1, F)
j = int(shift * SR); y[:F] *= np.linspace(0, 1, F); y[-F:] *= np.linspace(1, 0, F)
V[j:j + len(y)] += y[: max(0, len(V) - j)]
# niveau : même RMS que l'ancienne phrase
old = dec(os.path.join(VD, f"voice_avant_patch_{n}.wav"))[int(s0 * SR):int(s1 * SR)]
newseg = V[int(s0 * SR):int(s1 * SR)]
g = np.sqrt(np.mean(old ** 2)) / (np.sqrt(np.mean(newseg ** 2)) + 1e-9); V[j:j + len(y)] = V[j:j + len(y)] - y[: len(V[j:j + len(y)])] + y[: len(V[j:j + len(y)])] * g
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", os.path.join(VD, "voice.wav")], input=V.tobytes(), check=True)
if len(nw) != i1 - i0 + 1: print(f"ATTENTION : {len(nw)} mots nouveaux pour {i1 - i0 + 1} anciens")
neww = [{"w": w["w"], "s": round(w["s"] + shift, 3), "e": round(w["e"] + shift, 3), "role": role} for w in nw]
W = W[:i0] + neww + W[i1 + 1:]
json.dump(W, open(os.path.join(VD, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"phrase remplacée ({s0:.3f}-{s1:.3f} s), tempo d'ajustement {tempo:.3f}, gain {20 * np.log10(g):+.1f} dB :", " ".join(w["w"] for w in neww))
