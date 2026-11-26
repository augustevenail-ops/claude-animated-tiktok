#!/usr/bin/env python3
"""« Les Dessins » ép. 1 — bande-son v2 : voix (voix/voix_off_v1.wav) + musique originale synthétisée + bruitages calés sur les mots.
Hiérarchie voix > bruitages > musique (docs/audio.md). Musique (v2) : celle du Monstre, même niveau. [v1 : boîte à musique / piano pizzicato en do majeur, joueur, tant que
les dessins sont drôles ; bascule en mineur à la sonnerie, tension pendant la gomme, éclaircie aux applaudissements, puis nappe
inquiétante (boîte à musique désaccordée) jusqu'à la fin. Bruitages : scintillement doré à chaque apparition (inversé à la disparition),
crayon qui gratte, rugissement, sonnerie, frottement de la gomme, éclaboussure, applaudissements, porte, murmure de foule. -14 LUFS.
  python3 sound_v1.py   ->  v2_mix.wav, v2_sfx.wav, v2_music.wav"""
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
FPS = 30; TOTAL = round((LAST["e"] + 1.6) * FPS); DUR = TOTAL / FPS; N = int(DUR * SR)
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
def sparkle(t0, d=1.4, g_db=-17, rev=False):         # apparition magique : arpège de clochettes montant + chatoiement
    n = int(d * SR); x = np.zeros(n); tt = np.arange(n) / SR
    notes = [84, 88, 91, 96, 100, 103, 108]
    for e, m in enumerate(notes):
        f = 440 * 2 ** ((m - 69) / 12); i = int(e * d / len(notes) * 0.7 * SR); s = np.arange(n - i) / SR
        x[i:] += (np.sin(2 * np.pi * f * s) + 0.3 * np.sin(2 * np.pi * f * 2.76 * s)) * np.exp(-s / 0.35) * 0.5
    x += noise_bp(d, 5000, 12000) * np.sin(np.pi * tt / d) * 0.25
    if rev: x = x[::-1]
    put(x, t0, g_db, 0.02)
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

# ------------------------------------------------------------------ bruitages
T_BELL = W("la sonnerie"); T_ER = W("Quelqu'un avait dessiné"); T_PAINT = W("je l'ai balancé"); T_STOP = W("et d'un coup"); T_WALL = W("Mais sur le mur"); T_DOOR = W("Je l'ai ouverte")
birds(0.0, W("Le lendemain"), -32); cue("wind_city", 0.0, -34)
k.whoosh(0.05, 0.6, 0.4)
scribble(W("tout ce que tu dessines"), W("prend vie") + 0.1, -26); sparkle(W("prend vie") - 0.05, 1.5, -17)
scribble(W("Je veux dire") + 0.1, W("absolument") + 0.2, -26); sparkle(W("absolument") - 0.3, 1.4, -18); k.thud(W("n'importe quoi"), 0.5, 60)
scribble(W("a dessiné un billet"), W("et soudain") - 0.1, -24); sparkle(W("et soudain") + 0.1, 1.3, -17)
cue("cloth_rustle", W("Alors forcément") + 0.3, -26); scribble(W("J'ai pris un crayon") + 0.4, W("Et boum") - 0.1, -24)
k.impact(W("Et boum") - 0.03, 0.9, 50.0, 1.4); sparkle(W("Et boum"), 2.0, -14)
keys(W("Alors le vrai clavier"), W("Le lendemain") - 0.3, -22); cue("bed_creak", W("lui aussi"), -24)
k.whoosh(W("Le lendemain") - 0.05, 0.5, 0.3); cue("crowd_shuffle", W("Le lendemain") + 0.2, -26); scribble(W("tout le monde dessinait"), W("Un gamin") - 0.1, -26)
sparkle(W("une voiture de sport") - 0.3, 1.4, -17); cue("sting_soft", W("une voiture de sport") + 0.2, -24)
sparkle(W("piscine dans la classe") - 0.4, 1.4, -17); cue("drip", W("piscine dans la classe") + 0.4, -20)
scribble(W("et mon pote Jaden"), W("un dinosaure de compagnie"), -26); sparkle(W("un dinosaure de compagnie") - 0.1, 1.4, -17)
roar(W("Un dinosaure") - 0.1, 1.5, -11); steps(W("Il a poursuivi"), W("Mais là") - 0.2, 0.17, -16, "footstep_one"); roar(W("dans tout le couloir"), 1.0, -16); cue("gasp_teen", W("notre prof"), -18)
birds(W("Mais là"), W("Puis, juste avant"), -32)
scribble(W("J'ai passé toute la pause"), W("Quand j'ai terminé"), -25); sparkle(W("elle est apparue juste") - 0.3, 1.6, -15)
cue("sting_soft", W("ouvre la bouche"), -22); k.thud(W("des dents") + 0.05, 0.5, 55)
scribble(W("J'ai essayé de corriger"), W("rien à faire"), -24)
for e in range(4): k.tick(W("Puis, juste avant") + e * 0.45, 0.5)
bell(T_BELL, 2.0, -15)
sparkle(W("Tous les dessins") + 0.3, 1.6, -16, rev=True); sparkle(W("ont commencé à disparaître") + 0.2, 1.4, -17, rev=True)
sparkle(W("Mon PC"), 1.2, -16, rev=True); sparkle(W("Le dinosaure a disparu"), 1.2, -16, rev=True); sparkle(W("Même ma petite amie") + 0.3, 1.4, -15, rev=True)
steps(W("Tout le monde s'est précipité"), W("et là, on a compris") - 0.1, 0.12, -18, "footstep_one"); cue("gasp_boy", W("on a compris"), -20)
sparkle(T_ER, 1.6, -17); k.impact(W("une gomme géante") - 0.03, 1.0, 38.0, 2.4)
rub(W("une gomme géante") + 0.3, T_STOP + 0.2, -16)
for c in ("les bureaux", "les casiers", "des salles de classe"): sparkle(W(c), 0.9, -20, rev=True)
scribble(W("J'ai dessiné en vitesse"), W("une cage géante") + 0.3, -21); sparkle(W("une cage géante") + 0.2, 0.8, -19); sparkle(W("l'a effacée") - 0.1, 0.8, -19, rev=True)
cue("heartbeat", W("C'est là que j'ai remarqué"), -20, 2.4)
cue("run_steps_room", W("Alors j'ai couru"), -16); cue("glass_rattle", W("j'ai pris un vrai seau") + 0.4, -22); k.whoosh(T_PAINT + 0.3, 0.6, 0.6); splash(T_PAINT + 0.75, -10)
k.thud(T_STOP + 0.4, 0.9, 50); cue("boom_low", T_STOP + 0.4, -18)
applause(W("Tout le monde a applaudi") - 0.1, T_WALL + 0.3, -15); cue("crowd_breath", W("Tout le monde a applaudi"), -24)
cue("hall_ambience", T_WALL, -30); cue("sting_hit", W("Tout ce que vous dessinez"), -16)
cue("wind_city", W("J'ai regardé dehors") + 0.3, -26); cue("wind_city", W("Nous n'avions rien créé"), -27)
sparkle(W("D'abord les fenêtres"), 1.4, -16, rev=True); sparkle(W("puis le toit") - 0.1, 1.6, -15, rev=True); k.impact(W("puis le toit"), 0.5, 40, 1.6)
cue("wind_city", W("Quelqu'un, ailleurs"), -26)
scribble(W("Alors j'ai pris mon crayon") + 0.3, W("une porte") - 0.1, -22); sparkle(W("une porte") - 0.1, 1.8, -14)
cue("door_open_creak", T_DOOR, -14); k.riser(W("des milliers de personnes") - 0.1, 1.8, 0.7); murmur(W("des milliers de personnes"), W("Un petit garçon"), -26)
cue("gasp_teen", W("des milliers de personnes") + 0.3, -24)
cue("sting_soft", W("tu es l'un de nos dessins"), -22); scribble(W("elles se transformaient"), W("Le garçon a ouvert") - 0.2, -27)
cue("cloth_rustle", W("Le garçon a ouvert"), -22); scribble(W("il a effacé un minuscule"), W("Aussitôt") - 0.05, -20)
sparkle(W("Aussitôt"), 1.0, -15, rev=True); k.sub_drop(W("ma main gauche") + 0.1, 0.8)
cue("sting_hit", W("Je corrige juste une erreur") - 0.1, -18)

# ------------------------------------------------------------------ musique : la même que « Le Monstre » (bunker/musique, x1,2, en boucle, même niveau que la version validée v9)
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
music = music * (1 - 0.2 * np.clip(env / (env.max() * 0.3), 0, 1)) * 0.1569 * 1.15 * 1.15 * 1.1 * vrms * MUS_GAIN * np.clip(t / 0.8, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1)
sfx = np.tanh(sfx * 1.2) / 1.2; sfx2 = np.stack([sfx, sfx])
mix = sfx2 + music + np.stack([voice, voice]) * 0.95
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95
def wav(a, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(p)], input=a.T.astype(np.float64).tobytes(), check=True)
wav(mix, D / "v2_mix_raw.wav"); wav(sfx2 / peak * 0.95, D / "v2_sfx.wav"); wav(music / peak * 0.95, D / "v2_music.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(D / "v2_mix_raw.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "pcm_s16le", str(D / "v2_mix.wav")], check=True)
print("ok", TOTAL, round(DUR, 2))
