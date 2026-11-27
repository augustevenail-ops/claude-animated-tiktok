#!/usr/bin/env python3
"""« Tu as tort » ép. 1 — bande-son v1 : voix (voix/voix_off_v1.wav) + musique commune (celle du Monstre : bunker/musique, x1,2)
+ bruitages discrets (rue, mouettes, vagues, boulangerie, studio, classe, foule, cœur, souffle). Fin nette 0,2 s après le dernier mot.
Voix > bruitages > musique. -14 LUFS.
  python3 sound_v1.py   ->  v1_mix.wav, v1_sfx.wav, v1_music.wav"""
import json, os, re, subprocess, sys, unicodedata, pathlib
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parents[3]; sys.path.insert(0, str(ROOT / "tools"))
from sound_kit import Kit
D = pathlib.Path(__file__).parent; EP = D.parent; SR = 48000; LIB = ROOT / "productions/sfx_lib"
MUS_GAIN = float(os.environ.get("MUS_GAIN", "1.0"))
words = json.load(open(EP / "voix/words_v1.json", encoding="utf-8"))
dec = lambda p, af=None: np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p)] + (["-af", af] if af else []) + ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
v = dec(EP / "voix/voix_off_v1.wav")
LAST = [w for w in words if re.search(r"[a-zà-ÿ]", w["w"], re.I)][-1]
FPS = 30; TOTAL = round((LAST["e"] + 0.2) * FPS); DUR = TOTAL / FPS; N = int(DUR * SR)
voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
norm = lambda w: re.sub(r"[^a-z0-9']", "", unicodedata.normalize("NFD", w.lower().replace("’", "'")).encode("ascii", "ignore").decode())
NW = [norm(w["w"]) for w in words]
def WI(frag, after=0):
    """indice du premier mot de la suite de mots frag (cherchée à partir de l'indice after)"""
    f = [norm(x) for x in frag.split()]
    for i in range(after, len(NW) - len(f) + 1):
        if NW[i:i + len(f)] == f: return i
    raise KeyError(frag)
W = lambda frag, after=0: words[WI(frag, after)]["s"]
E = lambda frag, after=0: words[WI(frag, after) + len(frag.split()) - 1]["e"]
db = lambda x: 10 ** (x / 20)
sp = np.zeros(N, bool)
for w in words: sp[int(w["s"] * SR):min(N, int(w["e"] * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])
k = Kit(N, SR, seed=31); sfx = np.zeros(N); _c = {}; rng = np.random.default_rng(7)
def cue(name, t0, g=-10.0, dur=None, rate=1.0):
    if name not in _c: _c[name] = dec(LIB / (name + ".mp3"))
    x = _c[name] if dur is None else _c[name][: int(dur * SR)]
    if rate != 1.0: x = np.interp(np.arange(0, len(x) - 1, rate), np.arange(len(x)), x)
    a = np.abs(x) > 1e-3
    if not a.any(): return
    x = x * db(vref + g - rms(x[a])); i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: sfx[i:j] += x[: j - i]
def mavg(x, k):
    c = np.concatenate([[0.0], np.cumsum(x)]); h = k // 2; i = np.clip(np.arange(len(x)) - h, 0, len(x)); j = np.clip(np.arange(len(x)) + k - h, 0, len(x)); return (c[j] - c[i]) / k
def bp(x, lo, hi): a = mavg(x, max(1, int(SR / hi))); return a - mavg(a, int(SR / lo))
def put(x, t0, g_db, fade=0.25, dst=None):
    dst = sfx if dst is None else dst; a = np.abs(x) > 1e-6
    if not a.any(): return
    x = x * db(vref + g_db - rms(x[a])); f = min(len(x) // 2, int(fade * SR))
    if f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: dst[i:j] += x[: j - i]

def noise_bp(d, lo, hi): return bp(rng.standard_normal(int(d * SR)), lo, hi)
def scribble(t0, t1, g_db=-24):                      # crayon qui gratte : rafales de bruit aigu
    n = int((t1 - t0) * SR); x = np.zeros(n); tt = 0.0
    while tt < (t1 - t0) - 0.08:
        d = 0.06 + 0.14 * rng.random(); m = int(d * SR); i = int(tt * SR); seg = noise_bp(d, 2500, 9000) * np.sin(np.linspace(0, np.pi, m)) ** 0.6
        x[i:i + m] += seg[: max(0, min(m, n - i))]; tt += d + 0.02 + 0.06 * rng.random()
    put(x, t0, g_db, 0.03)
def sparkle(t0, d=1.0, g_db=-27, rev=False):         # apparition (v3 : plus douce, plus discrète) : 4 clochettes graves + léger souffle
    n = int(d * SR); x = np.zeros(n); tt = np.arange(n) / SR
    for e, m in enumerate([79, 84, 88, 91]):
        f = 440 * 2 ** ((m - 69) / 12); i = int(e * d / 4 * 0.6 * SR); s = np.arange(n - i) / SR
        x[i:] += np.sin(2 * np.pi * f * s) * np.exp(-s / 0.45) * np.minimum(1, s / 0.01) * 0.5
    x += noise_bp(d, 3000, 8000) * np.sin(np.pi * tt / d) * 0.06
    if rev: x = x[::-1]
    put(x, t0, g_db, 0.05)
def roar(t0, d=1.6, g_db=-12):                        # rugissement : grondement grave modulé + râle
    n = int(d * SR); tt = np.arange(n) / SR; f = 70 + 60 * np.sin(np.pi * tt / d)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.6 * np.sin(2 * np.pi * 23 * tt)) + bp(rng.standard_normal(n), 150, 1800) * 1.5
    put(x * np.sin(np.pi * np.minimum(1, tt / d)) ** 0.5, t0, g_db, 0.1)
def bell(t0, d=2.2, g_db=-14):                        # sonnerie d'école électrique
    n = int(d * SR); tt = np.arange(n) / SR; ham = (np.sin(2 * np.pi * 28 * tt) > 0).astype(float)
    x = (np.sin(2 * np.pi * 980 * tt) + 0.6 * np.sin(2 * np.pi * 2450 * tt)) * (0.5 + 0.5 * ham)
    put(x * np.minimum(1, (d - tt) / 0.1), t0, g_db, 0.01)
def rub(t0, t1, g_db=-18):                            # frottement de la gomme géante : souffle grave rugueux qui pulse
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = bp(rng.standard_normal(n), 60, 900) * (0.7 + 0.3 * np.sin(2 * np.pi * 2.2 * tt)) + 0.5 * np.sin(2 * np.pi * 38 * tt)
    put(x, t0, g_db, 0.4)
def splash(t0, g_db=-10):                             # peinture lancée : souffle + éclaboussure + gouttes
    d = 1.2; n = int(d * SR); tt = np.arange(n) / SR; x = bp(rng.standard_normal(n), 300, 5000) * np.exp(-tt / 0.18) * 2
    for _ in range(14): i = rng.integers(int(0.15 * SR), n - 2000); m = 1500; x[i:i + m] += np.sin(2 * np.pi * (600 + 900 * rng.random()) * np.arange(m) / SR) * np.exp(-np.arange(m) / 300) * 0.6
    put(x, t0, g_db, 0.01)
def applause(t0, t1, g_db=-16):
    n = int((t1 - t0) * SR); x = np.zeros(n)
    for _ in range(int((t1 - t0) * 70)): m = int(0.012 * SR); i = rng.integers(0, max(1, n - m)); x[i:i + m] += bp(rng.standard_normal(m), 800, 6000) * np.exp(-np.arange(m) / (0.002 * SR)) * (0.5 + rng.random())
    put(x, t0, g_db, 0.4)
def murmur(t0, t1, g_db=-28): n = int((t1 - t0) * SR); tt = np.arange(n) / SR; put(bp(rng.standard_normal(n), 200, 1200) * (0.7 + 0.3 * np.sin(tt * 3.1) * np.sin(tt * 1.7)), t0, g_db, 0.8)
def keys(t0, t1, g_db=-22):
    tt = t0
    while tt < t1: m = int(0.02 * SR); put(bp(rng.standard_normal(m), 1500, 7000) * np.exp(-np.arange(m) / 200), tt, g_db + 3 * rng.random(), 0.0); tt += 0.07 + 0.08 * rng.random()
def birds(t0, t1, g_db=-30):
    tt = t0
    while tt < t1:
        d = 0.12; s = np.arange(int(d * SR)) / SR; f = 3000 + 1500 * np.sin(2 * np.pi * 12 * s) + 2000 * rng.random(); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * s / d), tt, g_db, 0.0); tt += 0.25 + 1.2 * rng.random()
def steps(t0, t1, dt, g_db, name="footstep_one"):
    t_ = t0; e = 0
    while t_ < t1:
        cue(name, t_, g_db + (1.5 if e % 2 else 0) - 2 * rng.random(), None, 0.9 + 0.2 * rng.random()); t_ += dt * (0.92 + 0.16 * rng.random()); e += 1

def shopbell(t0, g_db=-22):                           # clochette de boutique
    n = int(1.2 * SR); s = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * s) * np.exp(-s / 0.35) for f in (2093, 2637, 3136)); put(x, t0, g_db, 0.005)
def bus(t0, d=2.2, g_db=-20):                         # bus qui arrive : moteur grave qui ralentit + freins pneumatiques
    n = int(d * SR); tt = np.arange(n) / SR; f = 55 - 18 * tt / d; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.4 * np.sin(2 * np.pi * 9 * tt)) + bp(rng.standard_normal(n), 80, 600) * 0.8
    put(x * np.minimum(1, tt / 0.6), t0, g_db, 0.3); put(noise_bp(0.8, 2500, 9000) * np.exp(-np.arange(int(0.8 * SR)) / SR / 0.3), t0 + d - 0.5, g_db - 4, 0.02)
def coin(t0, g_db=-31):                               # pièce : « ting » métallique bref
    n = int(0.45 * SR); s = np.arange(n) / SR; f0 = 2600 + 500 * rng.random(); x = sum(a * np.sin(2 * np.pi * f0 * r * s) * np.exp(-s / d) for a, r, d in ((1, 1, 0.12), (0.6, 2.76, 0.06), (0.4, 5.4, 0.03))); put(x, t0, g_db, 0.003)
def coins_rain(t0, t1, rate, g_db=-34):
    tt = t0
    while tt < t1: coin(tt, g_db + 3 * rng.random()); tt += (0.5 + rng.random()) / rate
def choir(t0, t1, g_db=-30):                          # chorale lointaine : accord vocal « a » qui ondule
    n = int((t1 - t0) * SR); s = np.arange(n) / SR; x = np.zeros(n)
    for m in (57, 61, 64, 69):
        f = 440 * 2 ** ((m - 69) / 12) * (1 + 0.004 * np.sin(2 * np.pi * 5.2 * s + m)); ph = 2 * np.pi * np.cumsum(f) / SR
        x += (np.sin(ph) + 0.5 * np.sin(2 * ph) + 0.3 * np.sin(3 * ph)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.9 * s + m))
    put(bp(x, 150, 3000), t0, g_db, 0.6)
def stamp(t0, g_db=-24): k.thud(t0, 0.4, 70); put(noise_bp(0.05, 800, 4000), t0, g_db - 4, 0.002)
def paper(t0, d=0.8, g_db=-28): put(noise_bp(d, 1500, 7000) * np.abs(np.sin(np.linspace(0, 9, int(d * SR)))), t0, g_db, 0.05)

def rain(t0, t1, g_db=-30):                           # pluie : souffle large + gouttes
    n = int((t1 - t0) * SR); x = bp(rng.standard_normal(n), 400, 9000)
    for _ in range(int((t1 - t0) * 40)): m = 600; i = rng.integers(0, max(1, n - m)); x[i:i + m] += noise_bp(m / SR, 2000, 8000) * np.exp(-np.arange(m) / 120) * 2
    put(x, t0, g_db, 0.6)
def thunder(t0, g_db=-20):                            # tonnerre : craquement + grondement grave qui roule
    d = 3.2; n = int(d * SR); tt = np.arange(n) / SR; x = bp(rng.standard_normal(n), 25, 400) * (np.exp(-tt / 1.1) + 0.4 * np.exp(-((tt - 0.9) / 0.5) ** 2)) * (1 + 0.5 * np.sin(2 * np.pi * 3 * tt))
    x[: int(0.15 * SR)] += noise_bp(0.15, 800, 6000) * np.exp(-np.arange(int(0.15 * SR)) / SR / 0.04) * 3; put(x, t0, g_db, 0.01)
def coo(t0, g_db=-30):                                # roucoulement de pigeon
    d = 0.7; n = int(d * SR); s = np.arange(n) / SR; f = 330 + 60 * np.sin(2 * np.pi * 2.6 * s) - 40 * s
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * s)) * np.sin(np.pi * s / d) ** 1.5; put(bp(x + 0.3 * rng.standard_normal(n) * 0.05, 150, 2000), t0, g_db, 0.05)
def flaps(t0, d, rate, g_db=-26):                     # battements d'ailes
    tt = t0
    while tt < t0 + d: m = int(0.05 * SR); put(bp(rng.standard_normal(m), 300, 3000) * np.sin(np.linspace(0, np.pi, m)), tt, g_db + 3 * rng.random(), 0.0); tt += (0.5 + rng.random()) / rate
def blow(t0, g_db=-24):                               # souffle sur les bougies
    d = 0.7; put(noise_bp(d, 300, 3000) * np.sin(np.linspace(0, np.pi, int(d * SR))) ** 0.7, t0, g_db, 0.05)
def purr(t0, t1, g_db=-28):                           # ronronnement : grave pulsé ~25 Hz
    n = int((t1 - t0) * SR); s = np.arange(n) / SR; x = bp(rng.standard_normal(n), 60, 700) * (0.4 + 0.6 * (np.sin(2 * np.pi * 24 * s) > 0)) * (0.7 + 0.3 * np.sin(2 * np.pi * 0.45 * s)); put(x, t0, g_db, 0.4)
def laugh(t0, t1, g_db=-28):                          # rires d'enfants : rafales « ha » aiguës
    tt = t0
    while tt < t1:
        d = 0.1; s = np.arange(int(d * SR)) / SR; f = 420 + 200 * rng.random(); put(bp(np.sin(2 * np.pi * f * s) * (1 + np.sin(2 * np.pi * 3 * f * s)) + 0.4 * rng.standard_normal(len(s)), 300, 4000) * np.sin(np.pi * s / d), tt, g_db + 4 * rng.random(), 0.0); tt += 0.09 + 0.12 * rng.random()
def warm(t0, d=2.5, g_db=-27):                        # le soleil s'allume : nappe chaude montante
    n = int(d * SR); s = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * s) for f in (220, 277.2, 329.6, 440)) * np.minimum(1, s / (d * 0.6)); put(x, t0, g_db, 0.4)

def gulls(t0, t1, g_db=-32):                        # mouettes : cris « kiaa » descendants
    tt = t0
    while tt < t1:
        d = 0.35; s = np.arange(int(d * SR)) / SR; f = 1900 - 900 * s / d + 200 * rng.random(); put(bp(np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.5 * np.sin(2 * np.pi * 40 * s)), 600, 5000) * np.sin(np.pi * s / d), tt, g_db + 3 * rng.random(), 0.0); tt += 0.6 + 1.6 * rng.random()
def waves(t0, t1, g_db=-34):                        # ressac : souffle lent
    n = int((t1 - t0) * SR); s = np.arange(n) / SR; put(bp(rng.standard_normal(n), 150, 2500) * (0.45 + 0.55 * np.sin(2 * np.pi * s / 5.5) ** 2), t0, g_db, 0.8)
def beat(t0, g_db=-22):                             # battement de cœur : « boum-boum »
    for dt in (0, 0.22): k.thud(t0 + dt, 0.35, 55)
def ding(t0, g_db=-28):                              # « ding » de bonne réponse / point marqué
    n = int(0.8 * SR); s = np.arange(n) / SR; put(sum(np.sin(2 * np.pi * f * s) * np.exp(-s / 0.3) for f in (1318, 1976)), t0, g_db, 0.005)
def buzz(t0, g_db=-26):                              # « bzzt » de mauvaise réponse
    n = int(0.45 * SR); s = np.arange(n) / SR; put(np.sign(np.sin(2 * np.pi * 110 * s)) * 0.5 + np.sign(np.sin(2 * np.pi * 116 * s)) * 0.5, t0, g_db, 0.01)
def inhale(t0, d=1.0, g_db=-24): put(noise_bp(d, 400, 4000) * np.linspace(0.2, 1, int(d * SR)), t0, g_db, 0.1)
def gasp(t0, g_db=-26): put(noise_bp(0.35, 500, 5000) * np.exp(-np.arange(int(0.35 * SR)) / SR / 0.12), t0, g_db, 0.01)
def cheer(t0, t1, g_db=-20):                         # clameur de foule
    n = int((t1 - t0) * SR); s = np.arange(n) / SR; x = bp(rng.standard_normal(n), 300, 3500) * np.minimum(1, s / 0.3); put(x, t0, g_db, 0.6); applause(t0 + 0.2, t1, g_db + 2)
def chime(t0, g_db=-26):                             # jingle météo
    for i, m in enumerate((72, 76, 79, 84)): n = int(0.5 * SR); s = np.arange(n) / SR; put(np.sin(2 * np.pi * 440 * 2 ** ((m - 69) / 12) * s) * np.exp(-s / 0.25), t0 + i * 0.12, g_db, 0.005)
def tick(t0, t1, g_db=-30):
    tt = t0
    while tt < t1: m = int(0.015 * SR); put(bp(rng.standard_normal(m), 2000, 8000) * np.exp(-np.arange(m) / 120), tt, g_db, 0.0); tt += 0.5
def crunch(t0, t1, g_db=-28):                        # chips croquées
    tt = t0
    while tt < t1: m = int(0.08 * SR); put(bp(rng.standard_normal(m), 1500, 8000) * np.exp(-np.arange(m) / 900), tt, g_db + 3 * rng.random(), 0.0); tt += 0.35 + 0.4 * rng.random()

# ------------------------------------------------------------------ bruitages (discrets)
W1 = W("Le matin, j'ai dit"); gulls(0.0, W1, -32); waves(0.0, W1, -34); murmur(0.0, W1, -36); k.whoosh(0.05, 0.6, 0.3)
buzz(W("tout le monde joue") + 0.9, -30); steps(W("La règle est simple"), W("quelqu'un dit une phrase"), 0.45, -34)
ding(W("et toi, tu dois lui prouver") + 0.8, -32); buzz(W("qu'elle est fausse") + 0.2, -28)
for f in ("Par tous", "les moyens"): k.whoosh(W(f) - 0.05, 0.25, 0.2)
k.whoosh(W("moyens") + 0.25, 0.25, 0.2); k.thud(W("moyens") + 0.4, 0.4, 90)
cue("cloth_rustle", W1 + 0.2, -34); inhale(W("Quand tu as dit ça") + 0.9, 0.8, -30)
shopbell(W("Le boulanger te tend") - 0.1, -30); paper(W("Le boulanger te tend") + 0.8, 0.6, -32)
chime(W("Et le présentateur météo") + 0.1, -30); buzz(W("Tu as tort Quand") + 0.05, -30)
cue("wind_city", W("Moi, c'est Joël"), -38); gulls(W("Moi, c'est Joël"), W("J'ai dit Je m'appelle"), -36); laugh(W("Et je suis le pire joueur") + 0.4, W("Je n'ai jamais gagné"), -32); cue("sting_soft", W("Je n'ai jamais gagné") + 0.3, -34)
murmur(W("J'ai dit Je m'appelle"), W("Et puis, il y a Madame"), -38); buzz(W("Tu as tort. Sur ton cahier") + 0.05, -32); buzz(W("Tu as dix ans, trois mois") - 0.4, -32)
scribble(W("Tu as dix ans, trois mois"), W("J'ai dit Mon cœur"), -30)
beat(W("Mon cœur bat") + 0.5); beat(W("Là, il était entre") + 0.1); beat(W("deux battements") + 0.5)
laugh(W("À l'école, on m'appelle"), W("Et puis, il y a Madame") - 0.2, -28)
cue("door_open_creak", W("Et puis, il y a Madame") - 0.1, -32); cue("sting_soft", W("Championne de la ville"), -32); sparkle(W("Championne de la ville") + 0.3, 1.0, -32)
steps(W("Un jour, le facteur"), W("Un jour, le facteur") + 1.2, 0.42, -32); ding(W("Il est midi deux") + 0.1, -32)
steps(W("Le facteur a déménagé"), W("Chaque année, sous le phare"), 0.5, -32)
C0 = W("Chaque année, sous le phare"); waves(C0, W("Depuis, on m'appelle"), -36); gulls(C0, W("Il me restait"), -36); murmur(C0, W("Il me restait"), -28); cheer(C0, C0 + 2.0, -26)
paper(W("au tirage au sort"), 0.8, -30); gasp(W("j'ai pioché son nom") + 0.4, -28); cheer(W("Toute la ville est venue voir"), W("Elle a commencé"), -24)
for f in ("Elle a tout gagné", "Mes chaussures", "mon nom", "ma date de naissance", "même la couleur du ciel"): ding(W(f) + 0.2, -30)
inhale(W("J'ai pris une grande respiration") + 0.2, 1.3, -24)
cue("sting_soft", W("Et j'ai dit Tu vas me dire") + 1.2, -30); gasp(W("Madame Contraire a ouvert") + 0.5, -30)
tick(W("Elle a cherché"), W("Le soleil s'est couché"), -32); cue("wind_city", W("Une minute"), -36)
warm(W("Le soleil s'est couché"), 2.6, -30); cue("light_on", W("derrière le phare"), -32)
cheer(W("Toute la place a hurlé"), W("Depuis, on m'appelle"), -18); flaps(W("Les mouettes se sont envolées"), 2.0, 26, -26); gulls(W("Les mouettes se sont envolées"), W("Depuis, on m'appelle"), -30)
cue("cloth_rustle", W("Depuis, on m'appelle"), -32); crunch(W("Depuis, on m'appelle") + 0.6, DUR, -30); murmur(W("Et on me laisse"), DUR, -40)

# ------------------------------------------------------------------ musique : musique commune (celle du Monstre : bunker/musique, x1,2, en boucle), même réglage que « Les Mots Gentils »
t = np.arange(N) / SR
mus = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(ROOT / "productions/bunker/musique/musique.wav"), "-af", "atempo=1.2", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64).reshape(-1, 2).T
xf = int(0.4 * SR); Lm = mus.shape[1]; step = Lm - xf; music = np.zeros((2, N + Lm)); ramp = np.linspace(0, 1, xf)
for q, i in enumerate(range(0, N, step)):
    seg = mus.copy()
    if q > 0: seg[:, :xf] *= ramp
    seg[:, Lm - xf:] *= ramp[::-1]; music[:, i:i + Lm] += seg
music = music[:, :N]; music /= (np.sqrt(np.mean(music ** 2)) + 1e-9)
vrms = np.sqrt(np.mean(voice[np.abs(voice) > 0.02 * np.abs(voice).max()] ** 2)) * 0.95
env = mavg(np.abs(voice), int(0.3 * SR))
music = music * (1 - 0.2 * np.clip(env / (env.max() * 0.3), 0, 1)) * 0.1569 * 1.15 * 1.15 * 1.1 * 1.1 * vrms * MUS_GAIN * np.clip(t / 0.8, 0, 1) * np.clip((DUR - t) / 0.25, 0, 1)
sfx = np.tanh(sfx * 1.2) / 1.2; sfx2 = np.stack([sfx, sfx])
mix = sfx2 + music + np.stack([voice, voice]) * 0.95
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95
def wav(a, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(p)], input=a.T.astype(np.float64).tobytes(), check=True)
wav(mix, D / "v1_mix_raw.wav"); wav(sfx2 / peak * 0.95, D / "v1_sfx.wav"); wav(music / peak * 0.95, D / "v1_music.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(D / "v1_mix_raw.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "pcm_s16le", str(D / "v1_mix.wav")], check=True)
print("ok", TOTAL, round(DUR, 2))
