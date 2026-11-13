# Allonge un blanc dans la voix d'un épisode : insère SEC secondes de silence au milieu du blanc qui suit le mot n° I,
# puis décale tous les mots suivants (words.json). La copie studio de words.json doit être mise à jour ensuite.
# Usage : python tools/voice_gap.py productions/<ep> <index_mot> <secondes>
import json, os, subprocess, sys
import numpy as np
EP, I, SEC = sys.argv[1], int(sys.argv[2]), float(sys.argv[3]); SR = 48000
V = os.path.join(EP, "voice"); wj = os.path.join(V, "words.json"); words = json.load(open(wj, encoding="utf-8"))
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(V, "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
cut = (words[I]["e"] + words[I + 1]["s"]) / 2; k = int(cut * SR)
y = np.concatenate([x[:k], np.zeros(int(SEC * SR), np.float32), x[k:]])
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", os.path.join(V, "voice.wav")], input=y.tobytes(), check=True)
for w in words[I + 1:]: w["s"] = round(w["s"] + SEC, 3); w["e"] = round(w["e"] + SEC, 3)
json.dump(words, open(wj, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"+{SEC}s après « {words[I]['w']} » (avant « {words[I + 1]['w']} »)")
