# Remplace les mots n° A..B de la voix d'un épisode par une réplique déjà générée (mp3 + json d'alignement du cache _seg),
# avec l'effet du rôle (voices.json), puis décale les mots suivants (words.json). Aucune nouvelle génération ElevenLabs.
# Usage : python tools/voice_splice.py productions/<ep> <A> <B> <role> <segment_mp3>
import json, os, subprocess, sys
import numpy as np
EP, A, B, ROLE, SEG = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]; SR = 48000
V = os.path.join(EP, "voice"); wj = os.path.join(V, "words.json"); words = json.load(open(wj, encoding="utf-8"))
cfg = json.load(open(os.path.join(EP, "voices.json"), encoding="utf-8"))[ROLE]
dec = lambda p, af="anull": np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-af", af, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
x = dec(os.path.join(V, "voice.wav"))
seg = dec(SEG, f"atempo={cfg.get('tempo', 1.0)},{cfg.get('fx', 'anull')}")
al = json.load(open(SEG[:-4] + ".json", encoding="utf-8"))["words"]
nz = np.where(np.abs(seg) > 0.01)[0]; s0, s1 = (nz[0], nz[-1]) if len(nz) else (0, len(seg)); seg = seg[max(0, s0 - 480): s1 + 2400]
lead = (s0 - max(0, s0 - 480)) / SR - al[0]["s"] / cfg.get("tempo", 1.0)
a = int((words[A]["s"] - 0.05) * SR); b = int((words[B]["e"] + 0.05) * SR)
ref = np.sqrt(np.mean(x[a:b] ** 2)) + 1e-9; seg = seg * (ref / (np.sqrt(np.mean(seg[np.abs(seg) > 0.005] ** 2)) + 1e-9)) * 0.9
gap = 0.15; ins = np.concatenate([np.zeros(int(gap * SR), np.float32), seg.astype(np.float32), np.zeros(int(gap * SR), np.float32)])
y = np.concatenate([x[:a], ins, x[b:]]); delta = len(ins) / SR - (b - a) / SR
t0 = a / SR + gap + lead
new = [{"w": w["w"], "s": round(t0 + w["s"] / cfg.get("tempo", 1.0), 3), "e": round(t0 + w["e"] / cfg.get("tempo", 1.0), 3), "role": ROLE} for w in al]
assert len(new) == B - A + 1, (len(new), B - A + 1)
for w in words[B + 1:]: w["s"] = round(w["s"] + delta, 3); w["e"] = round(w["e"] + delta, 3)
words[A:B + 1] = new
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", os.path.join(V, "voice.wav")], input=y.tobytes(), check=True)
json.dump(words, open(wj, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"mots {A}-{B} remplacés par la réplique « {' '.join(w['w'] for w in al)} » ({ROLE}), décalage {delta:+.2f} s")
