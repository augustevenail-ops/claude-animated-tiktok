# Bande son de L'Arène ép. 1 (numpy + ffmpeg, tout synthétisé) : drone grave + basse pulsée (REFERENCE_APOKALYPS §5),
# ambiance d'aube, bips du compte à rebours, impacts, drones, haut-parleur ; ducking musique -3 dB sous la voix (words.json) ;
# master -15 LUFS / -1,2 dBTP (ffmpeg loudnorm 2 passes). Sorties : mix.wav (48 kHz stéréo), stems, cues.md.
# Usage : python make_audio.py   (depuis ce dossier ; lit ../voice/voice.wav et ../voice/words.json)
import json, os, subprocess
import numpy as np

SR = 48000
DUR = 70.0
N = int(SR * DUR)
HERE = os.path.dirname(os.path.abspath(__file__))
VOICE = os.path.join(HERE, "..", "voice")
rng = np.random.default_rng(37)
t = np.arange(N) / SR

def sec(a, b): return slice(int(a * SR), min(N, int(b * SR)))
def env(a, b, att=0.5, rel=0.8):
    e = np.zeros(N); i0, i1 = int(a * SR), min(N, int(b * SR)); n = i1 - i0
    if n <= 0: return e
    x = np.arange(n) / SR; e[i0:i1] = np.minimum(1, x / max(att, 1e-3)) * np.minimum(1, (n / SR - x) / max(rel, 1e-3)); return np.clip(e, 0, 1)
def lp(x, fc):  # passe-bas 1 pôle répété (doux)
    a = np.exp(-2 * np.pi * fc / SR); y = x.copy()
    for _ in range(2):
        z = np.empty_like(y); s = 0.0
        # filtre IIR vectorisé par blocs serait plus rapide ; ici scipy-free et suffisant
        z = _iir(y, a); y = z
    return y
def _iir(x, a):
    from itertools import accumulate
    return np.fromiter(accumulate(x * (1 - a), lambda s, v: a * s + v), float, len(x))
def hp(x, fc): return x - lp(x, fc)
def noise(n): return rng.standard_normal(n)
def db(v): return 10 ** (v / 20)
def put(dst, sig, at, gain=1.0):
    i = int(at * SR); j = min(N, i + len(sig))
    if i < N: dst[i:j] += sig[: j - i] * gain
def tone(f, d, a=0.005, r=0.08, wave="sin"):
    x = np.arange(int(d * SR)) / SR; s = np.sin(2 * np.pi * f * x) if wave == "sin" else np.sign(np.sin(2 * np.pi * f * x)) * 0.6
    e = np.minimum(1, x / a) * np.minimum(1, (d - x) / r); return s * np.clip(e, 0, 1)

music = np.zeros(N); sfx = np.zeros(N)
# ---------------- musique : drone ré mineur + basse pulsée ----------------
def drone(f0, a, b, lvl, att=2.0, rel=2.0):
    e = env(a, b, att, rel); x = t
    s = sum(np.sin(2 * np.pi * f0 * k * x + k) / k ** 1.3 for k in (1, 2, 3, 4)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.11 * x))
    return s * e * lvl
music += drone(73.42, 3.0, 61.7, 0.35)                       # ré2
music += drone(110.0, 9.4, 61.7, 0.22)                       # la2
music += drone(174.61, 14.9, 47.7, 0.12, 3.0, 1.5)           # fa3 (ciel bizarre -> fin des paris)
music += drone(155.56, 47.7, 61.7, 0.12, 0.5, 0.3)           # mi bémol3 : dissonance à « soixante »
music += drone(73.42, 65.3, 70.0, 0.4, 0.2, 1.2) + drone(110.0, 65.3, 70.0, 0.25, 0.2, 1.2)
# basse pulsée (battement de cœur) : 66 bpm puis 84, 100 bpm pendant le compte
def pulses(a, b, bpm, lvl):
    out = np.zeros(N); p = a
    while p < b:
        k = tone(41.2, 0.32, 0.004, 0.25); k[: int(0.2 * SR)] += tone(82.4, 0.2, 0.004, 0.15) * 0.4
        put(out, k, p, lvl); put(out, k * 0.6, p + 0.22, lvl)
        p += 60 / bpm
    return out
music += pulses(34.0, 47.7, 66, 0.55) + pulses(47.7, 59.0, 84, 0.65) + pulses(59.0, 61.7, 100, 0.8) + pulses(65.3, 69.6, 84, 0.7)
music = lp(music, 900)
# ---------------- SFX ----------------
wind = lp(noise(N), 500) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * t + 1)) * 6
sfx += wind * (0.35 + 0.25 * env(62.4, 65.4, 0.3, 0.5))
for k in range(26):  # oiseaux jusqu'à « le ciel est bizarre » (14,9 s)
    at = rng.uniform(0.3, 14.6); f = rng.uniform(2600, 4200); d = rng.uniform(0.06, 0.14)
    x = np.arange(int(d * SR)) / SR; ch = np.sin(2 * np.pi * (f + 900 * np.sin(2 * np.pi * 18 * x)) * x) * np.sin(np.pi * x / d)
    put(sfx, ch, at, 0.12)
def hit(at, lvl=1.0):  # impact grave (sub + bruit)
    x = np.arange(int(1.6 * SR)) / SR; f = 55 * np.exp(-x * 1.2) + 30
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 2.2) + lp(noise(len(x)), 300) * np.exp(-x * 9) * 4
    put(sfx, s, at, lvl)
def beep(at, f=1180, lvl=0.35): put(sfx, tone(f, 0.09, 0.002, 0.02) + tone(f * 2, 0.09, 0.002, 0.02) * 0.2, at, lvl)
def whoosh(a, d, lvl=0.5):
    x = np.arange(int(d * SR)) / SR; n = noise(len(x)); e = np.sin(np.pi * x / d) ** 2
    s = np.zeros(len(x)); fc0 = np.linspace(300, 2500, len(x))
    for i in range(0, len(x), 2400): s[i:i + 2400] = hp(n[i:i + 2400], fc0[i] * 0.3)[: len(s[i:i + 2400])]
    put(sfx, s * e * 0.8, a, lvl)
hit(22.2, 0.9); hit(48.6, 0.7); hit(62.4, 1.0); hit(69.0, 0.6)
beep(8.1, 2600, 0.25); beep(8.25, 2600, 0.25)                        # bracelet s'allume (24)
for s_ in range(59, 70): beep(float(s_), 1180, 0.32)                  # compte à rebours
beep(62.38, 2900, 0.4); beep(62.52, 2300, 0.4)                         # 24 -> 23
put(sfx, lp(noise(int(0.25 * SR)), 2500) * 0.6, 20.35, 0.5)            # haut-parleur qui s'allume (crépitement)
put(sfx, tone(60, 5.2, 0.05, 0.3) * 0.25 + tone(120, 5.2, 0.05, 0.3) * 0.12, 20.4, 0.5)  # bourdonnement d'ampli
dr = hp(noise(int(7.2 * SR)), 1800) * (0.5 + 0.5 * np.sin(2 * np.pi * 31 * np.arange(int(7.2 * SR)) / SR))
put(sfx, lp(dr, 4000) * env(0, 7.2, 1, 1.5)[: len(dr)] if False else lp(dr, 4000) * np.sin(np.pi * np.arange(len(dr)) / len(dr)), 26.6, 0.18)  # drones
whoosh(40.9, 3.6, 0.55)                                                 # envolée de la caméra
put(sfx, tone(900, 0.04, 0.001, 0.01), 39.6, 0.25)
put(sfx, lp(noise(int(0.3 * SR)), 1200) * np.exp(-np.arange(int(0.3 * SR)) / SR * 12), 39.6, 0.6)  # bracelet tiré
for k in range(12):  # grésillement de poêle → ici : crépitement électrique de la fente rouge sous l'insert eau
    put(sfx, hp(noise(int(0.02 * SR)), 3000) * 0.4, 56.0 + k * 0.23 + rng.uniform(0, 0.1), 0.25)
# ---------------- voix, ducking, mix ----------------
def read_wav(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(float)
v = read_wav(os.path.join(VOICE, "voice.wav")); voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
words = json.load(open(os.path.join(VOICE, "words.json"), encoding="utf-8"))
duck = np.ones(N)
for w in words: duck[sec(w["s"] - 0.08, w["e"] + 0.12)] = db(-3)
duck = lp(duck, 4)
def rms_db(x): return 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9)
sp = np.zeros(N, bool)
for w in words: sp[sec(w["s"], w["e"])] = True
vref = rms_db(voice[sp])
music *= db(vref - 13 - rms_db(music[music != 0]))   # musique ~10-13 dB sous la voix (+3 dB du standard)
sfx *= db(vref - 15 - rms_db(sfx[sfx != 0]))         # SFX -6 dB
music *= duck
L = voice + music * 0.9 + sfx * 1.0; R = voice + music * 1.0 + sfx * 0.9
mix = np.stack([L, R], 1)
pre = os.path.join(HERE, "_premix.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.astype(np.float64).tobytes(), check=True)
for name, x in (("stem_music", music), ("stem_sfx", sfx)):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", os.path.join(HERE, name + ".wav")], input=x.astype(np.float64).tobytes())
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = (f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
      f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(HERE, "mix.wav")], check=True)
os.remove(pre)
e = subprocess.run(["ffmpeg", "-i", os.path.join(HERE, "mix.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
summ = [l.strip() for l in e[e.rfind("Summary:"):].splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))]
open(os.path.join(HERE, "cues.md"), "w", encoding="utf-8").write("# Cues L'Arène ép. 1\n\nMaster : " + " | ".join(summ) +
  "\n\nMusique : drone ré-la (3-61,7 s), fa (14,9-47,7), mi♭ dissonant (47,7-61,7), silence 61,7-65,3, reprise 65,3-70 ; basse pulsée 66→84→100 bpm (34-61,7 s), 84 bpm (65,3-69,6).\n"
  "SFX : oiseaux jusqu'à 14,6 s, vent permanent, bips bracelet 8,1 s, haut-parleur 20,35 s, impacts 22,2 / 48,6 / 62,4 / 69 s, drones 26,6-33,8 s, "
  "envolée 40,9 s, bracelet tiré 39,6 s, compte à rebours 59-69 s, 24→23 62,4 s.\n")
print("mix.wav", " | ".join(summ))
