# Bande son de « Ne le regarde pas » : voix (décalée de VOICE_AT = 1,8 s, accroche muette avant) + musique inquiétante mélodique (« Berceuse brisée » :
# berceuse au carillon dont la 2e phrase pose une note de trop, cordes sourdes, trémolo aigu ; silence net sur « glacée », fragment suspendu) + bruitages calés sur
# voice/words.json : pluie continue, tonnerre (accroche, éclair sur le vrai père), vibration/bips du téléphone, cliquetis de clés,
# battement de cœur qui s'accélère jusqu'à « glacée », froissement de tissu, coups sur la vitre. Master -15 LUFS / -1,2 dBTP.
# Usage : python make_audio.py <durée_s>   ->  mix.wav, mix_ecoute.mp3
import json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.join(HERE, "..")
sys.path.insert(0, os.path.join(HERE, "..", "..", "arene-ep01", "audio"))
from bandes4 import band_L
SR = 48000; OFF = 1.8
words = json.load(open(os.path.join(EP, "voice", "words.json"), encoding="utf-8"))
anch = json.load(open(os.path.join(EP, "..", "..", "studio", "src", "videos", "droite", "anchors.json")))["anchors"]
DUR = float(sys.argv[1]); N = int(DUR * SR); t = np.arange(N) / SR; rng = np.random.default_rng(13)
W = lambda i: words[i]["s"] + OFF
db = lambda v: 10 ** (v / 20)
def put(dst, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: dst[i:j] += sig[: j - i] * g
def smooth(x, n): return np.convolve(x, np.ones(n) / n, "same")
def tone(f, d, a=0.003, r=0.03): x = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * x) * np.clip(np.minimum(x / a, (d - x) / r), 0, 1)
def thunder(g): x = np.arange(int(4.5 * SR)) / SR; return (smooth(rng.standard_normal(len(x)), 140) * 9 * np.exp(-x * 1.1) + smooth(rng.standard_normal(len(x)), 8) * np.exp(-x * 14) * 2.2) * g
def thump(x0=60.0): x = np.arange(int(0.25 * SR)) / SR; return np.sin(2 * np.pi * np.cumsum(x0 - 30 * x / 0.25) / SR) * np.exp(-x * 22)
def knock(): x = np.arange(int(0.25 * SR)) / SR; return smooth(rng.standard_normal(len(x)), 14) * np.exp(-x * 38) * 5 + np.sin(2 * np.pi * 190 * x) * np.exp(-x * 24)

voice_raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(EP, "voice", "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
v = np.frombuffer(voice_raw, np.float32).astype(float); voice = np.zeros(N); put(voice, v, OFF)
sp = np.zeros(N, bool)
for w in words: sp[int((w["s"] + OFF) * SR):min(N, int((w["e"] + OFF) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])

# bruitages
sfx = np.zeros(N)
sfx += smooth(rng.standard_normal(N), 5) * (0.5 + 0.35 * np.sin(2 * np.pi * 0.05 * t + 1)) * 0.22                      # pluie
s20 = W(anch["20"]); s33 = W(anch["33"]); dip = W(139)                                                                 # éclair sur « ton vrai père » ; « Elle est glacée »
put(sfx, thunder(1.0), 0.0, 0.8); put(sfx, thunder(1.4), s20 - 0.05)                                                    # tonnerre : accroche, éclair
for k, d in enumerate((0.0, 0.18, 0.36)): put(sfx, tone(3400 + 400 * k, 0.025), W(0) + 0.15 + d, 0.28); put(sfx, tone(5200, 0.02), W(0) + 0.15 + d, 0.14)     # clés / verrou
put(sfx, tone(95, 0.9, 0.01, 0.4), 0.9, 0.8); put(sfx, tone(190, 0.9, 0.01, 0.4), 0.9, 0.27)                                    # coup grave : le reflet de l'accroche
buzz = tone(172, 0.6, 0.01, 0.05) * (np.sign(np.sin(2 * np.pi * 22 * np.arange(int(0.6 * SR)) / SR)) * 0.5 + 0.5)
for wi in (34, 62): put(sfx, buzz, W(wi), 0.5); put(sfx, tone(1500, 0.07), W(wi) + 0.62, 0.3); put(sfx, tone(2250, 0.07), W(wi) + 0.62, 0.12)         # vibration + bip (message 1, message 2)
tt = W(40)                                                                                                           # cœur : de « Ce n'est pas moi » jusqu'à « glacée », de plus en plus vite
while tt < dip - 0.3:
    k = (tt - W(40)) / (dip - W(40)); per = 1.1 - 0.55 * k; put(sfx, thump(), tt, 0.7); put(sfx, thump(52.0), tt + 0.26, 0.45); tt += per
tt = dip + 1.9
while tt < DUR - 0.6: put(sfx, thump(), tt, 0.4); put(sfx, thump(52.0), tt + 0.28, 0.25); tt += 1.15                    # reprise lente, en suspens
cl = smooth(rng.standard_normal(int(0.6 * SR)), 30) * np.hanning(int(0.6 * SR)) * 3.5; put(sfx, cl, W(132) - 0.1, 0.5)   # tissu : « Sa main se pose »
for q in range(5): put(sfx, knock(), s33 + 0.15 + q * 0.28, 1.2)                                                      # coups sur la vitre (tour de caméra)
sfx *= db(vref - 13 - rms(sfx[np.abs(sfx) > 1e-4]))

# musique inquiétante (même parcours que la vidéo : montée sur le message, éclair, silence sur « glacée », reprise en suspens)
music = band_L(DUR, {"welcome": W(40), "sixty": s20, "dip": dip, "end": DUR})
duck = np.ones(N)
for w in words: duck[int(max(0, w["s"] + OFF - 0.08) * SR):int(min(DUR, w["e"] + OFF + 0.12) * SR)] = db(-3)
music *= smooth(duck, 2000)
music *= db(vref - 6 - rms(music))
mix = np.stack([voice + 0.95 * music + sfx, voice + music + 0.95 * sfx], 1)
pre = os.path.join(HERE, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = (f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(HERE, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(HERE, "mix.wav"), "-b:a", "192k", os.path.join(HERE, "mix_ecoute.mp3")])
e = subprocess.run(["ffmpeg", "-i", os.path.join(HERE, "mix.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print(f"durée {DUR} s |", " | ".join(l.strip() for l in e[e.rfind('Summary:'):].splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))))
