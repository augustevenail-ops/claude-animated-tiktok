#!/usr/bin/env python3
"""« Le Dernier Appel » ép. 1 — bande-son v1 : voix (voix/voix_off_v1.wav) + musique originale synthétisée + bruitages calés sur les mots.
Hiérarchie voix > bruitages > musique (docs/audio.md). Musique : piano doux en la mineur sur nappes tenues, tension (cœur + nappe
dissonante) pendant l'incendie et l'attente, silence avant la révélation, puis montée en majeur sur la fin. -14 LUFS.
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
def bp(x, lo, hi): a = np.convolve(x, np.ones(max(1, int(SR / hi))) / max(1, int(SR / hi)), "same"); return a - np.convolve(a, np.ones(int(SR / lo)) / int(SR / lo), "same")
def put(x, t0, g_db, fade=0.25, dst=None):
    dst = sfx if dst is None else dst; a = np.abs(x) > 1e-6
    if not a.any(): return
    x = x * db(vref + g_db - rms(x[a])); f = min(len(x) // 2, int(fade * SR))
    if f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: dst[i:j] += x[: j - i]
def fire(t0, t1, g_db, dens=14):                     # incendie : grondement grave + crépitements serrés
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 40, 700) * (0.75 + 0.25 * np.sin(t * 1.7) * np.sin(t * 0.63 + 1)) * 1.6
    for _ in range(int((t1 - t0) * dens)):
        m = int(0.005 * SR); c = rng.standard_normal(m) * np.exp(-np.arange(m) / (0.0009 * SR)); i = rng.integers(0, max(1, n - m)); x[i:i + m] += c * (2 + 5 * rng.random())
    put(x, t0, g_db, 0.5)
def wind(t0, t1, g_db):                              # vent d'hiver : souffle filtré qui ondule
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; x = bp(rng.standard_normal(n), 150, 1400) * (0.6 + 0.4 * np.sin(t * 0.9 + rng.random() * 6) ** 2)
    put(x, t0, g_db, 1.0)
def tick(t0, g_db=-24, f=3200.0):                    # tic d'horloge (boisé)
    m = int(0.03 * SR); t = np.arange(m) / SR; x = (np.sin(2 * np.pi * f * t) + 0.5 * rng.standard_normal(m)) * np.exp(-t / 0.004) + 0.6 * np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.01)
    put(x, t0, g_db, 0.0)
def chime(t0, g_db=-20, f=392.0):                    # coup de pendule (cloche grave, longue)
    m = int(3.2 * SR); t = np.arange(m) / SR
    x = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / d) for a, r, d in ((1, 1, 1.4), (0.5, 2.0, 0.9), (0.35, 2.76, 0.6), (0.2, 5.4, 0.3)))
    put(x * np.minimum(1, t / 0.004), t0, g_db, 0.0)
def phone_bell(t0, d=1.2, g_db=-14):                 # sonnerie mécanique (deux timbres martelés à 20 Hz)
    m = int(d * SR); t = np.arange(m) / SR; ham = (np.sin(2 * np.pi * 20 * t) > 0).astype(float)
    x = (np.sin(2 * np.pi * 1350 * t) + 0.7 * np.sin(2 * np.pi * 1610 * t) + 0.3 * np.sin(2 * np.pi * 3100 * t)) * (0.55 + 0.45 * ham) * np.minimum(1, t / 0.01) * np.minimum(1, (d - t) / 0.08)
    put(x, t0, g_db, 0.0)
def static(t0, t1, g_db):                            # grésillement radio / ligne
    n = int((t1 - t0) * SR); x = bp(rng.standard_normal(n), 900, 6000) * (0.5 + 0.5 * (rng.random(n) < 0.02).astype(float).cumsum() % 2)
    put(x, t0, g_db, 0.15)
def steps(t0, t1, dt, g_db, name="footstep_one"):
    t = t0; e = 0
    while t < t1:
        cue(name, t, g_db + (1.5 if e % 2 else 0) - 2 * rng.random(), None, 0.9 + 0.2 * rng.random()); t += dt * (0.92 + 0.16 * rng.random()); e += 1

# ------------------------------------------------------------------ bruitages (calés sur les mots ; plans = mots, story.ts)
T_FIRE0, T_FIRE1 = W("Une nuit d'hiver"), W("Le lendemain")
cue("sting_soft", 0.0, -9); k.impact(0.05, 0.6, 42.0, 2.2)                             # ouverture
wind(0.0, W("Après un enterrement") - 0.2, -30)                                       # nuit d'hiver sur le quartier
for e in range(6): tick(W("dans les vingt-quatre heures") + e * 0.5, -24)            # l'horloge des 24 h
chime(W("Il ne sonne que pour ça") + 0.15, -24, 523.3)                               # le téléphone : un tintement lointain, jamais une sonnerie
wind(W("Après un enterrement"), W("Lucas a huit ans") - 0.1, -26); cue("crowd_breath", W("toute la famille"), -26)
cue("bed_creak", W("Chaque soir") + 0.2, -22); cue("cloth_rustle", W("je viendrai te chercher") - 0.3, -24)
cue("light_off", E("je viendrai te chercher") + 0.25, -12)                           # il éteint la lumière
wind(T_FIRE0 - 0.3, W("la maison brûle") + 0.2, -22)
k.impact(W("la maison brûle") - 0.03, 1.2, 40.0, 2.6); cue("glass_rattle", W("la maison brûle") + 0.1, -12)
fire(W("la maison brûle"), T_FIRE1 - 0.3, -15)
cue("siren_far", W("Son père fonce") - 0.6, -16)
steps(W("Son père fonce") + 0.1, W("pour le trouver") + 0.5, 0.27, -15)
cue("breath_nervous", W("dans la fumée"), -20)
cue("door_push", W("Les pompiers sortent"), -14); cue("gasp_boy", W("de sa chambre") + 0.2, -20)
k.impact(W("ne ressort jamais") - 0.03, 1.0, 36.0, 3.0)
for e in range(int((W("Vingt-trois heures") - W("Le lendemain")) / 0.5)): tick(W("Le lendemain") + 0.25 + e * 0.5, -27)   # l'attente
for e in range(14): tick(W("Les heures passent") + e * 0.11, -25)                       # les aiguilles filent
chime(W("Vingt-trois heures") - 0.05, -18, 392.0); chime(W("minuit") - 0.05, -16, 349.2); chime(W("minuit") + 1.05, -19, 349.2)
for e in range(5): tick(W("Le téléphone ne sonne pas") + e * 0.5, -23)
cue("whisper_voice", W("on chuchote") - 0.2, -17); cue("whisper_voice", W("Il n'aimait personne") - 0.1, -21)
wind(W("Dans le quartier"), W("À l'école") - 0.2, -28)
cue("crowd_shuffle", W("À l'école"), -24); cue("crowd_breath", W("on le répète"), -24)
cue("heartbeat", W("Alors il arrête de pleurer"), -18, 2.6)
k.whoosh(W("Dix ans plus tard") - 0.07, 0.5, 0.35)
cue("cloth_rustle", W("décroche la photo"), -20); k.thud(W("à la poubelle") + 0.45, 0.6, 80); cue("glass_rattle", W("à la poubelle") + 0.5, -18)
wind(W("Le soir même"), W("Il faut que tu saches"), -28)
cue("knock3", W("frappe à sa porte") - 0.1, -9); cue("door_open_creak", E("frappe à sa porte") + 0.25, -18)
fire(W("la nuit de l'incendie"), W("la caserne") - 0.1, -24)                           # souvenir de l'incendie
phone_bell(W("la caserne") + 0.1, 0.9, -20); static(W("a reçu un appel"), E("depuis ta maison") + 0.4, -30)   # le standard de la caserne
static(W("Ton père était déjà mort"), E("sa voix était calme") + 0.3, -32)
fire(W("Il a dit"), W("Son père ne l'avait pas oublié") - 0.3, -27)
static(W("Mon fils est"), E("venez le chercher") + 0.2, -33)
cue("door_close_soft", W("a remis la photo") + 0.6, -24)
wind(W("et dépose des fleurs"), DUR, -30)

# ------------------------------------------------------------------ musique originale
t = np.arange(N) / SR; nt = lambda m: 440 * 2 ** ((m - 69) / 12)
def piano(m, d=3.0, g=1.0):                          # note de piano feutré : partiels inharmoniques, attaque douce, extinction lente
    n = int((d + 1.5) * SR); x = np.arange(n) / SR; f = nt(m); B = 0.0004
    s = sum(a * np.sin(2 * np.pi * f * h * np.sqrt(1 + B * h * h) * x) * np.exp(-x * (0.9 + 0.55 * h)) for h, a in ((1, 1.0), (2, 0.42), (3, 0.2), (4, 0.09), (5, 0.05)))
    return s * np.minimum(1, x / 0.006) * np.clip((d + 1.5 - x) / 1.2, 0, 1) * g
def pad(m, d, a=2.0, r=2.5):                         # nappe tenue (deux voix désaccordées)
    n = int((d + r) * SR); x = np.arange(n) / SR; f = nt(m)
    s = np.sin(2 * np.pi * f * x) * 0.6 + np.sin(2 * np.pi * f * 1.003 * x + 1) * 0.4 + 0.18 * np.sin(2 * np.pi * f * 2 * x)
    return s * np.clip(np.minimum(x / a, (d + r - x) / r), 0, 1)
def add(dst, sig, t0, g=1.0):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if 0 <= i < N and j > i: dst[i:j] += sig[: j - i] * g
PIA = np.zeros(N); PAD = np.zeros(N)
MIN = [(57, [45, 52, 57, 60, 64]), (53, [41, 48, 53, 57, 60]), (48, [48, 55, 60, 64, 67]), (55, [43, 50, 55, 59, 62])]     # la m, fa, do, sol
MAJ = [(53, [41, 48, 53, 57, 65]), (48, [48, 55, 60, 64, 72]), (55, [43, 50, 55, 59, 67]), (57, [45, 52, 57, 60, 69])]     # fa, do, sol, la m -> fin en do
def section(t0, t1, prog, beat=0.82, arp=(1, 2, 3, 4, 3, 2), g=1.0, padg=1.0, melody=None):
    tt, q = t0, 0
    while tt < t1 - 0.5:
        root, ch = prog[q % len(prog)]; bar = beat * len(arp)
        add(PAD, pad(ch[0] - 12, bar, 1.5, 2.2), tt, 0.5 * padg); add(PAD, pad(ch[2], bar, 1.8, 2.2), tt, 0.25 * padg)
        add(PIA, piano(ch[0], bar, 0.8), tt, g)
        for e, n_ in enumerate(arp):
            if tt + e * beat < t1 - 0.3: add(PIA, piano(ch[n_], 2.2, 0.55 - 0.04 * e), tt + e * beat, g)
        if melody and q < len(melody) and melody[q]: add(PIA, piano(melody[q], bar * 0.9, 0.5), tt + beat * 2, g)
        tt += bar; q += 1
T_TWIST = W("Il faut que tu saches"); T_REVEAL = W("Il a dit"); T_END = W("Son père ne l'avait pas oublié")
section(0.4, T_FIRE0 - 0.2, MIN, g=0.9, melody=[None, 72, 69, None, 76, 72, 71, None])                      # le monde, le père, la promesse
section(W("Le lendemain") + 0.3, W("Dix ans plus tard") - 0.1, MIN[:2] + MIN[:2], beat=1.05, arp=(1, 3, 2), g=0.65, padg=0.8)   # l'attente, le silence
section(W("Dix ans plus tard"), T_REVEAL - 0.5, [MIN[0], MIN[3], MIN[1], MIN[3]], beat=0.9, arp=(1, 2, 3, 2), g=0.7)
section(T_END - 0.15, DUR, MAJ, beat=0.8, arp=(1, 2, 3, 4, 3, 2), g=1.0, padg=1.3, melody=[72, 76, 74, 76, 77, 79, 76, None])        # la promesse tenue
kt = Kit(N, SR, seed=5)
TEN, cur = kt.tension_layer(DUR, reveals=[W("la maison brûle"), W("ne ressort jamais"), T_REVEAL], final_from=DUR + 10, final_to=DUR + 20, transpose=-2)
tens = np.zeros(N); a0, a1 = int((T_FIRE0 - 0.5) * SR), int((T_FIRE1 + 1.0) * SR); tens[a0:a1] = 1
b0, b1 = int((T_TWIST) * SR), int((T_END - 0.2) * SR); tens[b0:b1] = 1
tens = np.convolve(tens, np.ones(int(0.8 * SR)) / int(0.8 * SR), "same")
music = PIA / (np.abs(PIA).max() + 1e-9) * 0.9 + PAD / (np.abs(PAD).max() + 1e-9) * 0.55 + TEN / (np.abs(TEN).max() + 1e-9) * 0.75 * tens
gap = np.ones(N)
for c in (W("ne ressort jamais"), T_REVEAL, T_END): gap *= 1 - 0.85 * np.clip(1 - np.abs(t - (c - 0.25)) / 0.35, 0, 1)   # respiration avant les révélations
music *= gap * np.clip(t / 1.2, 0, 1) * np.clip((DUR - t) / 1.4, 0, 1)
duck = 1 - 0.3 * np.convolve(sp.astype(float), np.ones(int(0.25 * SR)) / int(0.25 * SR), "same")
music = np.stack([music * duck * 1.0, np.roll(music * duck, int(0.011 * SR)) * 0.97])   # léger élargissement stéréo
ma = np.abs(music[0]) > 1e-5; music *= db(vref - 8.0 - rms(music[0][ma])) * MUS_GAIN
sfx = np.tanh(sfx * 1.2) / 1.2; sfx2 = np.stack([sfx, sfx])
mix = sfx2 + music + np.stack([voice, voice]) * 0.95
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95
def wav(a, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(p)], input=a.T.astype(np.float64).tobytes(), check=True)
wav(mix, D / "v1_mix_raw.wav"); wav(sfx2 / peak * 0.95, D / "v1_sfx.wav"); wav(music / peak * 0.95, D / "v1_music.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(D / "v1_mix_raw.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "pcm_s16le", str(D / "v1_mix.wav")], check=True)
print("ok", TOTAL, round(DUR, 2))
