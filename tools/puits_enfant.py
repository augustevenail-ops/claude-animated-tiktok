# Le Puits ép. 1 : insère la réplique de l'enfant dans la voix off -> voix_ia/voice_v2.wav (utilisé par tools/puits_mix.py).
# Voix : « Auguste Chuchoteur Créatif » (clone de l'utilisateur), prise essais_enfant2/4866bf_aug_brut1.mp3.
# Traitement (retour utilisateur 2026-11-19 : « trop forte, trop appuyée, rends-la plus légère ») :
#   hauteur +2 demi-tons (timbre plus jeune et léger), passe-haut 220 Hz (moins de poids), compression douce (attaques
#   moins appuyées), niveau = narrateur -3 dB. Créneau : après « chuchote », fin entière avant « Il descend ».
# « Toc… toc » dit par le narrateur retiré (vrais coups dans le mix). Usage : python3 tools/puits_enfant.py
import json, os, subprocess
import numpy as np
D = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "productions", "puits-ep01", "voix_ia"); SR = 48000
dec = lambda p, af=None: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p] + (["-af", af] if af else []) + ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                                     capture_output=True).stdout, np.float32).astype(float)
v = dec(os.path.join(D, "voice.wav")); w = json.load(open(os.path.join(D, "words.json")))
k = dec(os.path.join(D, "essais_enfant2", "4866bf_aug_brut1.mp3"),
        "rubberband=pitch=1.1225:formant=shifted,highpass=f=220,acompressor=threshold=0.1:ratio=3:attack=5:release=80:makeup=1")
env = np.convolve(np.abs(k), np.ones(960) / 960, "same"); on = np.where(env > 0.01 * env.max())[0]
k = k[max(0, on[0] - 960):min(len(k), on[-1] + int(0.2 * SR))]; f = int(0.1 * SR); k[-f:] *= np.linspace(1, 0, f)
slot0, slot1 = 44.98, w[168]["s"] - 0.03; L = slot1 - slot0
if len(k) / SR > L:
    r = (len(k) / SR) / L
    k = np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", f"atempo={r:.4f}", "-f", "f32le", "-"],
                                     input=k.tobytes(), capture_output=True).stdout, np.float32).astype(float)
else: slot0 += (L - len(k) / SR) / 2
rms = lambda x: np.sqrt(np.mean(x ** 2)); sp = np.zeros(len(v), bool)
for x in w: sp[int(x["s"] * SR):int(x["e"] * SR)] = True
kon = k[np.abs(k) > 0.01 * np.abs(k).max()]; k = k * rms(v[sp]) / rms(kon) * 10 ** (-3 / 20)
out = v.copy(); out[int(44.95 * SR):int(slot1 * SR)] = 0; i = int(slot0 * SR); out[i:i + len(k)] = k
out[int((w[179]["s"] - 0.06) * SR):int((w[180]["e"] + 0.12) * SR)] = 0
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s16le", os.path.join(D, "voice_v2.wav")], input=out.tobytes(), check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(D, "voice_v2.wav"), "-b:a", "192k", os.path.join(D, "voice_v2.mp3")], check=True)
print(f"enfant {len(k) / SR:.2f} s placé {slot0:.2f} -> {slot0 + len(k) / SR:.2f} s")
