# Bande son v3 de L'Arène ép. 1 : bandes son originales au choix (bandes.py : A Pulsation, B Horloge, C Cinéma) ou aucune musique discrète sous la voix + bruitages essentiels
# seulement, calés sur les mots de voice/words.json (plus aucun temps codé en dur) :
#   vent léger (tout du long) ; bip du bracelet sur « vingt-quatre » ; grésillement + bourdonnement du haut-parleur sur ses
#   répliques ; impacts sur « Bienvenue » et « vingt-trois » ; bips du compte à rebours chaque seconde après « démarre » ;
#   double bip 24 -> 23. Musique : ducking -3 dB sous la voix, creux -12 dB autour de « vingt-trois ». Master -15 LUFS / -1,2 dBTP.
# Usage : python make_audio_v7.py [durée_s] [A..K|none]  -> mix_<X>.wav + mix_<X>_ecoute.mp3
import json, os, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from bandes import bande, SR
from bandes2 import BANDES2
from bandes3 import BANDES3
BANDES2 = {**BANDES2, **BANDES3}

HERE = os.path.dirname(os.path.abspath(__file__)); VOICE = os.path.join(HERE, "..", "voice")
words = json.load(open(os.path.join(VOICE, "words.json"), encoding="utf-8"))
DUR = float(sys.argv[1]) if len(sys.argv) > 1 else round(words[-1]["e"] + 0.45, 2)
N = int(DUR * SR); t = np.arange(N) / SR; rng = np.random.default_rng(11)
def at(word, nth=0, key="s"):
    hits = [w for w in words if w["w"].lower().strip(".,:;!?…«»").startswith(word)]
    return hits[nth][key]
def put(dst, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: dst[i:j] += sig[: j - i] * g
def tone(f, d, a=0.004, r=0.03):
    x = np.arange(int(d * SR)) / SR; return np.sin(2 * np.pi * f * x) * np.clip(np.minimum(x / a, (d - x) / r), 0, 1)
def smooth(x, n):
    k = np.ones(n) / n; return np.convolve(x, k, "same")
db = lambda v: 10 ** (v / 20)

sfx = np.zeros(N)
wind = smooth(rng.standard_normal(N), 90) * (0.55 + 0.45 * np.sin(2 * np.pi * 0.06 * t + 1))
sfx += wind * 0.35
v24, v23 = at("vingt-quatre"), at("vingt-trois")
for d0 in (0.0, 0.15): put(sfx, tone(2600, 0.08) + 0.2 * tone(5200, 0.08), v24 - 0.05 + d0, 0.25)       # bracelet s'allume
hp = [w for w in words if w.get("role") == "hp"]
for blk in [hp[:9], hp[9:]]:                                                                                  # haut-parleur
    if not blk: continue
    a, b = blk[0]["s"], blk[-1]["e"]
    put(sfx, smooth(rng.standard_normal(int(0.22 * SR)), 3) * np.linspace(1, 0, int(0.22 * SR)), a - 0.3, 0.35)
    put(sfx, (tone(60, b - a + 0.6, 0.08, 0.3) * 0.5 + tone(120, b - a + 0.6, 0.08, 0.3) * 0.25), a - 0.3, 0.25)
def hit(t0, g):
    x = np.arange(int(1.8 * SR)) / SR; f = 55 * np.exp(-x * 1.2) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.0) + smooth(rng.standard_normal(len(x)), 40) * np.exp(-x * 8) * 3
    put(sfx, s, t0, g)
hit(hp[0]["s"] - 0.02, 0.9); hit(v23 - 0.02, 1.0)
start = at("démarre", key="e")
k = 0
while start + k + 0.2 < DUR - 0.3:                                                                            # compte à rebours
    put(sfx, tone(1180, 0.08) + 0.2 * tone(2360, 0.08), start + 0.15 + k, 0.3); k += 1
put(sfx, tone(2900, 0.09), v23 - 0.04, 0.35); put(sfx, tone(2300, 0.09), v23 + 0.1, 0.35)                     # 24 -> 23

MUS = sys.argv[2] if len(sys.argv) > 2 else "A"          # A | B | C | none
_cues = {"welcome": hp[0]["s"], "sixty": at("soixante"), "dip": v23, "end": DUR, "start": 2.0 if MUS in ("J2", "J3") else 0.0}
music = BANDES2[MUS](DUR, _cues) if MUS in BANDES2 else bande(MUS, DUR, {"welcome": hp[0]["s"], "sixty": at("soixante"), "dip": v23, "end": DUR}) if MUS != "none" else np.zeros(N)
duck = np.ones(N)
for w in words: duck[int(max(0, w["s"] - 0.08) * SR):int(min(DUR, w["e"] + 0.12) * SR)] = db(-3)
dip = 1 - (1 - db(-12)) * np.clip(np.minimum((t - (v23 - 1.2)) / 0.3, ((v23 + 1.6) - t) / 0.6), 0, 1)
music *= smooth(duck, 2000) * dip

def read(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)
v = read(os.path.join(VOICE, "voice.wav")); voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
sp = np.zeros(N, bool)
for w in words: sp[int(w["s"] * SR):int(w["e"] * SR)] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
vref = rms(voice[sp])
music *= db(vref - 6 - rms(music)) if MUS != "none" else 0             # musique de fond (~6 dB sous la voix, relevée trois fois à la demande)
sfx *= db(vref - 13 - rms(sfx[np.abs(sfx) > 1e-4]))
mix = np.stack([voice + 0.95 * music + sfx, voice + music + 0.95 * sfx], 1)
pre = os.path.join(HERE, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = (f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(HERE, f"mix_{MUS}.wav")], check=True)
os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(HERE, f"mix_{MUS}.wav"), "-b:a", "192k", os.path.join(HERE, f"mix_{MUS}_ecoute.mp3")])
e = subprocess.run(["ffmpeg", "-i", os.path.join(HERE, f"mix_{MUS}.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print(f"durée {DUR} s |", " | ".join(l.strip() for l in e[e.rfind('Summary:'):].splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))))
