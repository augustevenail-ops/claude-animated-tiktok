# Bande son d'un épisode de « L'appel » avec le kit son des séries (tools/sound_kit.py) : voix inchangée, souffle à chaque coupe,
# impacts graves (~19/min), montées de tension avant chaque révélation (musique coupée net), déclics/gestes, bruitages propres
# à l'épisode, nouvelle musique très grave en si (43 bpm), coup final sur le carton du titre. -15 LUFS / -1,2 dBTP.
# Usage : python tools/series_mix.py <1|2|3>   ->  productions/appel-ep0N/audio/mix.wav (+ mix_ecoute.mp3), copié dans studio/public/<dossier>/
import json, os, re, subprocess, sys, shutil
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sound_kit import Kit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
EPN = int(sys.argv[1]); EP = os.path.join(ROOT, "productions", f"appel-ep0{EPN}"); SDIR = ["appel", "appel2", "appel3"][EPN - 1]
SR = 48000; OFF = 0.35; TITLE = 2.0
words = json.load(open(os.path.join(EP, "voice", "words.json"), encoding="utf-8"))
DUR = round(words[-1]["e"] + OFF + 1.6 + TITLE, 2); N = int(DUR * SR); t = np.arange(N) / SR
W = lambda i: words[i]["s"] + OFF
E = lambda i: words[i]["e"] + OFF
db = lambda v: 10 ** (v / 20)
story = open(os.path.join(ROOT, "studio", "src", "videos", SDIR, "story.ts"), encoding="utf-8").read()
m = re.search(r"const PLAN: \[number, number\]\[\] = \[(.*?)\];", story, re.S)
if m: ANCH = [int(a) for a in re.findall(r"\[(\d+), \d+\]", m.group(1))]
else:
    old = [int(x) for x in re.search(r"const OLD_ANCH = \[(.*?)\]", story).group(1).split(",")]
    ANCH = [a for i, a in enumerate(old) if i + 1 not in (13, 26, 31)]
CUTS = [W(a) - 2 / 30 for a in ANCH[1:]]
TITLE_AT = DUR - TITLE

raw = subprocess.run(["ffmpeg", "-v", "error", "-i", os.path.join(EP, "voice", "voice.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
v = np.frombuffer(raw, np.float32).astype(float); voice = np.zeros(N); i0 = int(OFF * SR); voice[i0:i0 + len(v)] = v[: N - i0]
sp = np.zeros(N, bool)
for w in words: sp[int((w["s"] + OFF) * SR):min(N, int((w["e"] + OFF) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])
k = Kit(N, SR, seed=10 + EPN); rng = np.random.default_rng(EPN)

# ---------- bruitages propres à chaque épisode (gestes, objets) ----------
def put(dst, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N: dst[i:j] += sig[: j - i] * g
def xs(d): return np.arange(int(d * SR)) / SR
def static(d):
    x = xs(d); e = np.clip(np.minimum(x / 0.02, (d - x) / 0.08), 0, 1); n = rng.standard_normal(len(x)); n = n - np.convolve(n, np.ones(6) / 6, "same")
    return (n * 0.6 + np.convolve((rng.random(len(x)) < 0.004) * rng.standard_normal(len(x)) * 6, np.ones(3) / 3, "same")) * e
def knock(): x = xs(0.18); return (np.sin(2 * np.pi * np.cumsum(140 - 60 * x / 0.18) / SR) * 1.2 + np.convolve(rng.standard_normal(len(x)), np.ones(8) / 8, "same") * 2) * np.exp(-x * 35)
def creak(d=1.0):
    x = xs(d); f = 180 + 90 * np.sin(2 * np.pi * 0.7 * x) + 40 * rng.standard_normal(len(x)).cumsum() / SR
    return np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-((x - d / 2) / (d / 2.5)) ** 2) * 0.25
def squeak(d=1.6): x = xs(d); f = 700 + 500 * x / d + 80 * np.sin(2 * np.pi * 3 * x); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(np.minimum(x / 0.2, (d - x) / 0.3), 0, 1) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * x) ** 2)
def heart(dst, a, b, per0=1.15, per1=0.75, g=0.28):
    tt = a
    while tt < b: q = np.clip((tt - a) / max(0.1, b - a), 0, 1); k.thud(tt, g, 55); k.thud(tt + 0.26, g * 0.6, 50); tt += per0 + (per1 - per0) * q
def steps(a, b, per=0.58, g=0.5, echo=True):
    tt = a
    while tt < b:
        for e in range(4 if echo else 1): k.thud(tt + e * 0.21, g * 0.45 ** e, 95)
        tt += per
fol = np.zeros(N)                                     # objets (grincements, grésillements) : niveau des souffles
REVEAL: list = []; IMPACT: list = []; QUIET: list = []; SWELL: list = []
if EPN == 1:
    put(fol, static(1.1), W(13) - 0.1, 0.35)
    for i in (42, 197, 206): put(fol, static(0.5), W(i) - 0.55, 0.4); k.click(W(i) - 0.08, 0.8)
    for q in range(22): u = q / 21; k.click(W(149) + (W(169) - W(149)) * u ** 0.8, 0.25 + 0.6 * u)       # fenêtres qui s'allument
    k.tick(E(205) + 0.05, 1.0)
    heart(None, W(129) + 0.4, W(226), 1.15, 0.7)
    REVEAL = [42, 53, 129, 133, 170, 197, 206]
    IMPACT = [1, 20, 37, 45, 66, 78, 83, 95, 121, 149, 157, 163, 164, 181, 183, 202, 211, 213, 226]
    QUIET = [(W(129) - 0.1, W(133) - 0.2), (E(210) + 0.2, W(226))]
elif EPN == 2:
    for i in (62, 81): put(fol, static(0.5), W(i) - 0.55, 0.4); k.click(W(i) - 0.08, 0.8)
    k.tick(E(67) + 0.05, 1.2); k.tick(E(67) + 0.2, 0.9)
    put(fol, static(0.6), W(75) - 0.1, 0.3); k.click(W(80), 0.7)
    for tk in (W(97) - 0.25, W(97) + 0.12, W(98) - 0.05): put(fol, knock(), tk, 1.4); k.thud(tk, 0.5, 120)
    k.thud(W(110), 0.6, 70); k.thud(W(116), 0.7, 60); k.click(W(120) + 0.1, 0.6)
    put(fol, squeak(1.8), W(143) - 0.1, 0.25); k.click(W(148), 0.7)
    k.impact(W(152), 1.0, 55); put(fol, knock(), W(152) + 0.02, 1.0)
    for q in range(3): k.thud(W(159) + q * 0.45, 0.8, 48); put(fol, creak(0.5), W(159) + q * 0.45, 0.3)
    put(fol, creak(1.1), W(164), 0.5); k.impact(W(169), 0.9, 40)
    k.tick(W(176), 1.2); k.tick(W(176) + 0.15, 1.0)
    for q in range(7): put(fol, creak(1.0), W(212) + q * 0.32 + 0.1 * q * q / 7, 0.3 + 0.08 * (q % 2))
    for q in range(16): u = q / 15; k.click(W(217) + (W(221) + 0.5 - W(217)) * u ** 1.2, 0.8 - 0.5 * u)
    heart(None, W(171), W(242), 1.15, 0.72)
    REVEAL = [62, 81, 97, 103, 121, 142, 161, 185, 235]
    IMPACT = [1, 12, 25, 38, 51, 68, 71, 92, 109, 114, 129, 135, 138, 150, 156, 168, 174, 179, 191, 205, 208, 215, 222, 236, 242]
    QUIET = [(W(142) - 0.1, W(150)), (W(168), W(174))]
else:
    put(fol, creak(1.4), W(69), 0.8); put(fol, creak(1.0), W(75) + 0.2, 0.35); put(fol, creak(0.9), W(77) + 0.4, 0.3)
    steps(W(96), W(120) - 0.4)
    for q in range(int((W(161) - W(157)) / 0.16)): put(fol, np.convolve(rng.standard_normal(int(0.12 * SR)), np.ones(20) / 20, "same") * np.hanning(int(0.12 * SR)) * 3, W(157) - 0.1 + q * 0.16, 0.4)
    for i in (165, 176): put(fol, static(0.5), W(i) - 0.4, 0.3)
    put(fol, static(1.0), W(190) - 0.5, 0.3)
    tt = W(207) - 0.1
    while tt < TITLE_AT - 0.3: q = np.clip((tt - W(207)) / (W(244) - W(207)), 0, 1); [k.thud(tt + e * 0.33, (0.15 + 0.7 * q ** 1.4) * 0.55 ** e, 90) for e in range(5)]; tt += 0.62 - 0.12 * q
    air = np.convolve(rng.standard_normal(N), np.ones(30) / 30, "same") * np.clip(np.interp(t, [W(229), W(232), W(234), W(240)], [0, 1, 1, 0.4]), 0, 1); fol += air * 1.2
    heart(None, W(240), TITLE_AT - 0.2, 0.95, 0.65)
    REVEAL = [74, 109, 120, 146, 157, 161, 199, 217]
    IMPACT = [1, 12, 25, 40, 55, 69, 82, 89, 98, 126, 133, 138, 139, 148, 165, 175, 180, 190, 206, 211, 223, 229, 234, 240, 244]
    QUIET = [(W(138) - 0.1, W(139) + 0.3), (W(206), W(211))]
    SWELL = [(W(120), 2.0)]

# ---------- grammaire commune ----------
# souffles : seulement sur les vrais changements de scène (coupe après une fin de phrase), un sur deux, discrets (retour utilisateur :
# le souffle sur chaque coupe sonnait comme un « coup de balai » toutes les 1-2 s)
swo = Kit(N, SR, seed=77); ends = [c for c, a in zip(CUTS, ANCH[1:]) if words[a - 1]["w"].rstrip().endswith((".", "…", "...", "?"))]
for j, c in enumerate(ends):
    if j % 2 == 0: swo.whoosh(c, 0.9, 0.5)
IMPACT = [i for n_, i in enumerate(IMPACT) if n_ % 3 != 2]                                              # ~19/min au total (mesuré)
for i in IMPACT: k.impact(W(i) - 0.02, 0.55 + 0.25 * rng.random(), 44 + 14 * rng.random())          # impacts graves
for i in REVEAL: k.riser(W(i) - 0.05, 1.6 + 0.8 * rng.random(), 0.9); k.impact(W(i) - 0.02, 1.0, 40); k.sub_drop(W(i) - 0.02, 0.6)   # montée + coupure + impact
k.stinger(TITLE_AT, 1.0)
cuts_mus = [W(i) - 0.35 for i in REVEAL]
mus = k.music2(DUR, cuts=cuts_mus, swells=SWELL, quiet=QUIET)

# ---------- niveaux (mesurés sur la référence) ----------
def lvl(x, target):
    act = np.abs(x) > 1e-4
    return x * db(target - rms(x[act])) if act.any() else x
hit = lvl(k.hit, vref - 7); air = lvl(k.air + fol, vref - 8); air += lvl(swo.air, vref - 20); mus = lvl(mus, vref - 9)
ph = (t * 43 / 60) % 1; sub = (np.sin(2 * np.pi * 61.74 * t) * (0.55 + 0.45 * np.exp(-ph * 3)) + 0.7 * np.sin(2 * np.pi * 30.87 * t)) * np.clip(t / 2, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1)
mus += sub * db(vref - 20 - rms(sub))                                                                    # sous-graves continus (mesurés)
duck = np.ones(N)
for w in words: duck[int(max(0, W(words.index(w)) - 0.08) * SR):int(min(DUR, E(words.index(w)) + 0.12) * SR)] = db(-3)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
mix = np.stack([voice + mus + hit + air * 1.0, voice + mus * 0.97 + hit + air * 0.92], 1)
out = os.path.join(EP, "audio"); os.makedirs(out, exist_ok=True); pre = os.path.join(out, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(out, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(out, "mix.wav"), "-b:a", "192k", os.path.join(out, "mix_ecoute.mp3")])
pub = os.path.join(ROOT, "studio", "public", SDIR); os.makedirs(pub, exist_ok=True); shutil.copy(os.path.join(out, "mix.wav"), os.path.join(pub, "mix.wav"))
e = subprocess.run(["ffmpeg", "-i", os.path.join(out, "mix.wav"), "-af", "ebur128=peak=true", "-f", "null", "-"], capture_output=True, text=True).stderr
print(f"ép. {EPN} : durée {DUR} s, {len(CUTS)} coupes, {len(IMPACT) + len(REVEAL)} impacts, {len(REVEAL)} montées |", " | ".join(l.strip() for l in e[e.rfind('Summary:'):].splitlines() if l.strip().startswith(("I:", "Peak:"))))
