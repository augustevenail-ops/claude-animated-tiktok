# Bande son de « L'appel » (essai audio avant image) : voix (narrateur George + haut-parleur Daniel filtré) décalée de OFF,
# musique synthétisée légère et sombre (nappe grave + basse pulsée lente qui accélère quand le vert se rapproche, coupée sur « Rien »,
# suspendue à la fin ; aucune note de piano), bruitages calés sur voice/words.json : sursaut « hann », vent de ville morte, néon,
# grésillements du haut-parleur, coups sourds sur les règles, déclics des fenêtres qui s'allument, buzzer rouge, cœur. -15 LUFS.
# Usage : python audio/make_audio.py   ->  audio/mix.wav, audio/mix_ecoute.mp3
import json, os, subprocess
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.join(HERE, "..")
SR = 48000; OFF = 0.35
words = json.load(open(os.path.join(EP, "voice", "words.json"), encoding="utf-8"))
DUR = round(words[-1]["e"] + OFF + 1.6, 2); N = int(DUR * SR); t = np.arange(N) / SR; rng = np.random.default_rng(7)
W = lambda i: words[i]["s"] + OFF
E = lambda i: words[i]["e"] + OFF
db = lambda v: 10 ** (v / 20)
def put(dst, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: dst[i:j] += sig[: j - i] * g
def smooth(x, n): return np.convolve(x, np.ones(n) / n, "same")
def env(d, a, r): x = np.arange(int(d * SR)) / SR; return x, np.clip(np.minimum(x / a, (d - x) / r), 0, 1)
def tone(f, d, a=0.003, r=0.03): x, e = env(d, a, r); return np.sin(2 * np.pi * f * x) * e
def boom(g=1.0): x = np.arange(int(2.2 * SR)) / SR; return (np.sin(2 * np.pi * np.cumsum(55 - 20 * np.minimum(x, 1)) / SR) * np.exp(-x * 2.2) + smooth(rng.standard_normal(len(x)), 60) * 3 * np.exp(-x * 5)) * g
def thump(f0=60.0): x = np.arange(int(0.25 * SR)) / SR; return np.sin(2 * np.pi * np.cumsum(f0 - 30 * x / 0.25) / SR) * np.exp(-x * 22)
def click(): x = np.arange(int(0.05 * SR)) / SR; return (smooth(rng.standard_normal(len(x)), 3) * 1.5 + np.sin(2 * np.pi * 900 * x)) * np.exp(-x * 120)
def static(d): x, e = env(d, 0.02, 0.08); n = rng.standard_normal(len(x)); n = n - smooth(n, 6); crack = (rng.random(len(x)) < 0.004) * rng.standard_normal(len(x)) * 6; return (n * 0.6 + smooth(crack, 3)) * e
def gasp():  # sursaut « hann » : souffle aspiré bref, filtré, discret
    x, e = env(0.42, 0.06, 0.25); n = rng.standard_normal(len(x)); b = smooth(n, 4) - smooth(n, 30)
    return b * e * (0.6 + 0.4 * np.sin(np.pi * x / 0.42)) * 2.5 + np.sin(2 * np.pi * np.cumsum(180 + 120 * x) / SR) * e * 0.15

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(EP, "voice", "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
v = np.frombuffer(raw, np.float32).astype(float); voice = np.zeros(N); put(voice, v, OFF)
sp = np.zeros(N, bool)
for w in words: sp[int(W(words.index(w)) * SR):min(N, int(E(words.index(w)) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])

RIEN, VERT, NOE2 = 129, 149, 210
# ---------- bruitages
sfx = np.zeros(N)
wind = smooth(rng.standard_normal(N), 400) * 30; wind *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t) ** 2; sfx += wind * 0.12   # vent sourd, ville morte
neon = (np.sin(2 * np.pi * 100 * t) + 0.4 * np.sin(2 * np.pi * 200 * t)) * (1 - 0.7 * (np.sin(2 * np.pi * 0.31 * t) > 0.97)); sfx += neon * 0.012
put(sfx, gasp(), 0.0, 0.5)                                                                     # sursaut au début, sous « Imagine… »
put(sfx, static(1.1), W(13) - 0.1, 0.35)                                                       # « grésille »
for i in (42, 197, 206): put(sfx, static(0.5), W(i) - 0.55, 0.4); put(sfx, click(), W(i) - 0.08, 0.5)   # haut-parleur avant chaque annonce
for i in (53, 133, 170): put(sfx, boom(), W(i) - 0.05, 0.55)                                    # « Règle numéro … »
put(sfx, thump(48.0), W(71), 0.35); put(sfx, thump(45.0), W(187), 0.35)                          # hommes en blanc
k0, k1 = W(VERT), W(169)                                                                       # fenêtres qui s'allument : déclics de plus en plus proches
n = 22
for q in range(n):
    u = q / (n - 1); put(sfx, click(), k0 + (k1 - k0) * (u ** 0.8), 0.08 + 0.45 * u)
bz = tone(110, 0.55, 0.01, 0.1) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 30 * np.arange(int(0.55 * SR)) / SR))); put(sfx, bz, W(163) - 0.05, 0.22)   # « rouge »
put(sfx, tone(880, 0.12, 0.005, 0.08), E(205) + 0.05, 0.12)                                       # ta fenêtre validée (petit bip)
tt = W(RIEN) + 0.4                                                                              # cœur : de « Rien » à la fin, accélère jusqu'au 2e numéro
while tt < DUR - 0.8:
    k = np.clip((tt - W(RIEN)) / (W(NOE2) - W(RIEN)), 0, 1); per = 1.15 - 0.45 * k if tt < E(NOE2) else 0.9
    put(sfx, thump(), tt, 0.55); put(sfx, thump(52.0), tt + 0.26, 0.35); tt += per
sfx *= db(vref - 12 - rms(sfx[np.abs(sfx) > 1e-4]))

# ---------- musique : petite musique d'ambiance (v2) — accords mineurs lents en nappe + motif de clochettes douces en écho
# (pas de piano), basse pulsée qui accélère quand le vert se rapproche ; coupée sur « Rien », suspendue après le 2e numéro.
nt = lambda m: 440 * 2 ** ((m - 69) / 12)
CH = [(57, 60, 64), (53, 57, 60), (50, 53, 57), (52, 56, 59)]          # Lam, Fa, Rém, Mi  (4 s chacun)
SEG = 4.0
pad = np.zeros(N); bell = np.zeros(N)
def saw(f, x): return 2 * ((x * f) % 1) - 1
for c in range(int(DUR / SEG) + 1):
    t0 = c * SEG; ch = CH[c % 4]; x, e = env(SEG + 1.0, 1.2, 1.2)
    sig = sum(saw(nt(m), x) + saw(nt(m) * 1.004, x) for m in ch) + saw(nt(ch[0] - 12), x) * 1.2
    put(pad, smooth(smooth(sig, 40), 40) * e, t0)
    arp = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 12, ch[0] + 24, ch[2] + 12, ch[1] + 12, ch[2]]
    for q, m in enumerate(arp):                                         # croches lentes (2 / s), timbre de clochette douce
        if q % 2 and c % 2: continue
        xb = np.arange(int(1.6 * SR)) / SR; f = nt(m)
        b = (np.sin(2 * np.pi * f * xb) + 0.3 * np.sin(2 * np.pi * 2.76 * f * xb) * np.exp(-xb * 6)) * np.exp(-xb * 2.6) * np.minimum(xb / 0.004, 1)
        put(bell, b, t0 + q * 0.5)
dl = int(0.375 * SR); echo = bell.copy()
for k in (1, 2, 3): echo[dl * k:] += bell[:-dl * k] * 0.45 ** k                # écho
bpm = np.interp(t, [0, W(VERT), W(NOE2), DUR], [60, 64, 86, 60]); ph = np.cumsum(bpm / 60 / SR)
pulse = np.sin(2 * np.pi * 41.2 * t) * np.exp(-((ph % 1) * 6)) * 1.6
lvl = np.interp(t, [0, 1.0, W(RIEN) - 0.2, W(RIEN), W(RIEN) + 2.0, W(VERT), W(NOE2), E(NOE2) + 0.3, W(226), DUR - 1, DUR], [0.35, 0.8, 0.85, 0.08, 0.7, 0.85, 1.0, 0.3, 0.6, 0.45, 0])
pl = np.interp(t, [0, W(RIEN), W(RIEN) + 0.01, W(VERT), W(NOE2), E(NOE2), DUR], [0.3, 0.45, 0, 0.6, 1.0, 0.0, 0.0])
pad *= 1 / (np.sqrt(np.mean(pad ** 2)) + 1e-9); echo *= 1 / (np.sqrt(np.mean(echo ** 2)) + 1e-9)
mus = (pad * 0.8 + echo * 0.55) * lvl + pulse * pl * lvl
duck = np.ones(N)
for i in range(len(words)): duck[int(max(0, W(i) - 0.08) * SR):int(min(DUR, E(i) + 0.12) * SR)] = db(-3)
mus *= smooth(duck, 2000); mus *= db(vref - 13.5 - rms(mus[mus != 0]))

mix = np.stack([voice + mus + sfx, voice + mus * 0.97 + sfx * 0.95], 1)
pre = os.path.join(HERE, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(HERE, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(HERE, "mix.wav"), "-b:a", "192k", os.path.join(HERE, "mix_ecoute.mp3")])
e = subprocess.run(["ffmpeg", "-i", os.path.join(HERE, "mix.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print(f"durée {DUR} s |", " | ".join(l.strip() for l in e[e.rfind('Summary:'):].splitlines() if l.strip().startswith(("I:", "LRA:", "Peak:"))))
