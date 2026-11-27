#!/usr/bin/env python3
"""« Les Mots Gentils » ép. 1 — bande-son v1 : voix (voix/voix_off_v2.wav) + musique du Monstre (désormais commune à toutes les vidéos :
bunker/musique, x1,2, en boucle, +10 % par rapport aux Dessins) + bruitages calés sur les mots. Hiérarchie voix > bruitages > musique. -14 LUFS.
  python3 sound_v2.py   ->  v2_mix.wav, v2_sfx.wav, v2_music.wav (v2 : charabia TTS coupé, voir voix/coupes_v2.json)"""
import json, os, re, subprocess, sys, unicodedata, pathlib
import numpy as np
ROOT = pathlib.Path(__file__).resolve().parents[3]; sys.path.insert(0, str(ROOT / "tools"))
from sound_kit import Kit
D = pathlib.Path(__file__).parent; EP = D.parent; SR = 48000; LIB = ROOT / "productions/sfx_lib"
MUS_GAIN = float(os.environ.get("MUS_GAIN", "1.0"))
words = json.load(open(EP / "voix/words_v2.json", encoding="utf-8"))
dec = lambda p, af=None: np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p)] + (["-af", af] if af else []) + ["-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
v = dec(EP / "voix/voix_off_v2.wav")
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

def shrink(t0, d=0.5, g_db=-24):                       # rapetisser : petit glissando descendant (« bwoup »)
    n = int(d * SR); tt = np.arange(n) / SR; f = 700 * np.exp(-tt * 3.2); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt / 0.3), t0, g_db, 0.02)
def grow(t0, d=0.6, g_db=-26):                         # grandir : glissando montant doux + clochettes
    n = int(d * SR); tt = np.arange(n) / SR; f = 420 * np.exp(tt * 2.0); put(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tt / d), t0, g_db, 0.03); sparkle(t0 + 0.15, 0.8, g_db - 2)
def shopbell(t0, g_db=-22):                           # clochette de boutique
    n = int(1.2 * SR); s = np.arange(n) / SR; x = sum(np.sin(2 * np.pi * f * s) * np.exp(-s / 0.35) for f in (2093, 2637, 3136)); put(x, t0, g_db, 0.005)
def bus(t0, d=2.2, g_db=-20):                         # bus qui arrive : moteur grave qui ralentit + freins pneumatiques
    n = int(d * SR); tt = np.arange(n) / SR; f = 55 - 18 * tt / d; x = np.sin(2 * np.pi * np.cumsum(f) / SR) * (1 + 0.4 * np.sin(2 * np.pi * 9 * tt)) + bp(rng.standard_normal(n), 80, 600) * 0.8
    put(x * np.minimum(1, tt / 0.6), t0, g_db, 0.3); put(noise_bp(0.8, 2500, 9000) * np.exp(-np.arange(int(0.8 * SR)) / SR / 0.3), t0 + d - 0.5, g_db - 4, 0.02)
def water(t0, t1, g_db=-28):                          # arrosoir : filet d'eau
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; put(bp(rng.standard_normal(n), 900, 5000) * (0.8 + 0.2 * np.sin(2 * np.pi * 6 * tt)), t0, g_db, 0.2)
def giant_step(t0, g_db=-14): k.thud(t0, 0.7, 42); cue("boom_low", t0, g_db - 6, 1.0)

# ------------------------------------------------------------------ bruitages
T_SIL = W("Un énorme silence"); T_SUN = W("Chaque dimanche"); T_G0 = W("J'ai senti mes pieds"); T_LAW = W("La loi n'a jamais")
birds(0.0, W("À l'école"), -32); cue("wind_city", 0.0, -36)
k.whoosh(0.05, 0.6, 0.4); steps(0.3, 2.4, 0.42, -26)
grow(W("tu grandis") + 0.55)
shrink(W("tu en perds un") + 0.05, 0.5, -22)
for e in range(3): giant_step(W("Ma grand-mère") + 0.15 + e * 0.75, -20)
shopbell(W("Elle doit se baisser") + 0.5); cue("cloth_rustle", W("pour entrer dans"), -26)
cue("sting_soft", W("soixante centimètres"), -26)
bus(W("Il râle tellement") - 0.3, 1.9, -19); cue("door_push", W("debout sur un tabouret"), -24)
murmur(W("Ici, la taille"), W("À l'école") - 0.2, -30); steps(W("Ici, la taille"), W("plus tu es grand"), 0.35, -27)
murmur(W("À l'école"), W("Et puis, il y a le maire") - 0.3, -32); cue("crowd_shuffle", W("À l'école"), -28)
grow(W("On se lance des") + 0.7); grow(W("pour gagner un centimètre") + 0.4, 0.5, -29)
cue("sting_soft", W("Un mètre dix"), -25); k.tick(W("Un mètre dix") + 0.05, 0.4)
cue("sting_soft", W("Vous êtes beaucoup moins") + 1.6, -26); shrink(W("J'ai perdu deux centimètres") + 0.2, 0.6, -20)
for e in range(4): giant_step(W("Et puis, il y a le maire") + 0.1 + e * 0.6, -15)
k.impact(W("Neuf mètres"), 0.8, 40.0, 1.6)
murmur(T_SUN, T_SIL - 0.2, -24); cue("mic_tap", T_SUN + 0.4, -22); applause(W("il complimente les gens") + 1.2, W("Mais seulement les grands") + 0.4, -24)
grow(W("il complimente les gens") + 0.9, 0.6, -27)
cue("mic_tap", W("Le micro est accroché"), -20)
for e in range(4): cue("footstep_one", W("si tu es trop petit") + e * 0.5, -22)
cue("pa_feedback", W("Un dimanche, le maire") + 0.2, -28, 0.8); cue("sting_hit", W("Les petits sont des gens"), -18)
cue("gasp_teen", W("devront quitter la ville") + 0.4, -20); cue("crowd_breath", W("devront quitter la ville") + 0.6, -22)
cue("heartbeat", W("Mon voisin a baissé"), -22, 3.0)
k.riser(W("Et puis, sans réfléchir"), 1.4, 0.5); cue("run_steps_room", W("j'ai commencé à grimper"), -18)
cue("footstep_one", W("Sur le banc") + 0.1, -18); cue("footstep_one", W("puis sur la fontaine") + 0.15, -18); cue("drip", W("puis sur la fontaine") + 0.3, -24)
cue("cloth_rustle", W("puis sur les épaules"), -22); cue("mic_tap", W("jusqu'au micro") + 0.4, -18)
murmur(W("Le maire a ri"), W("Alors j'ai dit") - 0.3, -27); cue("sting_soft", W("Toi"), -24)
cue("crowd_breath", W("Des milliers de gens"), -24)
birds(W("Le boulanger"), W("Alors j'ai dit") - 0.4, -30); shopbell(W("Le boulanger") + 0.4, -24)
water(W("Mon voisin grognon") + 0.6, W("Alors j'ai dit") - 0.4, -27)
cue("mic_tap", W("Alors j'ai dit") - 0.1, -24)
for e in range(3): sparkle(W("Merci") + 0.1 + e * 0.18, 0.7, -27)
k.riser(W("Mais pour toute la place"), 1.8, 0.5)
for e in range(14): sparkle(W("Mais pour toute la place") + 0.3 + e * 0.32, 0.6, -30 + e * 0.2)
k.impact(W("trois mille personnes"), 1.0, 45.0, 2.0); applause(W("trois mille personnes") + 0.6, T_G0, -26)
k.riser(T_G0, E("Trente mètres") - T_G0 + 0.2, 0.8)
for f in ("Dix mètres", "Vingt mètres", "Trente mètres"): k.impact(W(f), 0.9, 40.0, 1.8)
cue("gasp_teen", W("Dix mètres") + 0.2, -22); cue("crowd_breath", W("Vingt mètres"), -22)
cue("boom_low", W("Plus grand que le maire"), -18); cue("sting_soft", W("Il me regardait"), -24)
cue("cloth_rustle", W("Je me suis penché"), -22); grow(W("Il a grandi d'un centimètre") + 0.6, 0.6, -25)
applause(T_LAW, W("Et depuis ce jour") + 0.4, -15); cue("crowd_breath", T_LAW, -20)
birds(W("Et depuis ce jour"), DUR, -30); murmur(W("Et depuis ce jour"), DUR, -30); cue("mic_tap", W("Et depuis ce jour") + 0.5, -24)

# ------------------------------------------------------------------ musique : musique commune (celle du Monstre : bunker/musique, x1,2, en boucle, +10 %), coupée pendant « Un énorme silence »
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
music = music * (1 - 0.2 * np.clip(env / (env.max() * 0.3), 0, 1)) * 0.1569 * 1.15 * 1.15 * 1.1 * 1.1 * vrms * (1 - 0.85 * np.clip((t - T_SIL + 0.1) / 0.3, 0, 1) * np.clip((W("Et puis, sans réfléchir") - t) / 0.6, 0, 1)) * MUS_GAIN * np.clip(t / 0.8, 0, 1) * np.clip((DUR - t) / 1.5, 0, 1)
sfx = np.tanh(sfx * 1.2) / 1.2; sfx2 = np.stack([sfx, sfx])
mix = sfx2 + music + np.stack([voice, voice]) * 0.95
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95
def wav(a, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(p)], input=a.T.astype(np.float64).tobytes(), check=True)
wav(mix, D / "v2_mix_raw.wav"); wav(sfx2 / peak * 0.95, D / "v2_sfx.wav"); wav(music / peak * 0.95, D / "v2_music.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(D / "v2_mix_raw.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "pcm_s16le", str(D / "v2_mix.wav")], check=True)
print("ok", TOTAL, round(DUR, 2))
