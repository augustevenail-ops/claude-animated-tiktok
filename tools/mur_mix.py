# Mix de « Le Mur » ép. 1 (mêmes règles que series_mix.py : voix perso, musique douce -1/4, couche de tension, accroche D, -15 LUFS).
# Indices de mots = words.json de productions/mur-ep01/voix_ia (ou voix_perso) (même découpage que le script). Usage : python3 tools/mur_mix.py
import json, os, shutil, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sound_kit import Kit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
EP = os.path.join(ROOT, "productions", "mur-ep01"); VD = os.path.join(EP, os.environ.get("MUR_VOIX", "voix_ia"))   # voix IA Fish Audio (2026-11-14) ; MUR_VOIX=voix_perso pour l'ancienne
SR = 48000; OFF = 0.15; TITLE = 2.8          # voix dès 0,15 s (retour utilisateur)
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
DUR = round(words[-1]["e"] + OFF + 0.35 + TITLE, 2); N = int(DUR * SR); TITLE_AT = DUR - TITLE
W = lambda i: words[i]["s"] + OFF
E = lambda i: words[i]["e"] + OFF
db = lambda v: 10 ** (v / 20)
dec = lambda p: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
v = dec(os.path.join(VD, "voice.wav")); voice = np.zeros(N); i0 = int(OFF * SR); voice[i0:i0 + len(v)] = v[: N - i0]
sp = np.zeros(N, bool)
for w in words: sp[int((w["s"] + OFF) * SR):min(N, int((w["e"] + OFF) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])
def lvl(x, target): a = np.abs(x) > 1e-5; return x * db(target - rms(x[a])) if a.any() else x
k = Kit(N, SR, seed=21); sfx = np.zeros(N); SFX_DB = -1.5; LIB = os.path.join(ROOT, "productions", "sfx_lib"); _c = {}   # SFX_DB : bruitages 4 dB plus bas (retour utilisateur)
def cue(name, t0, g=-10.0, dur=None):
    if name not in _c: _c[name] = dec(os.path.join(LIB, name + ".mp3"))
    x = _c[name] if dur is None else _c[name][: int(dur * SR)]
    a = np.abs(x) > 1e-3
    if not a.any(): return
    x = x * db(vref + g + SFX_DB - rms(x[a])); i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: sfx[i:j] += x[: j - i]
# ---- accroche D (validée) : note qui monte jusqu'à « Imagine », chute grave ; + coup sourd sur « ne bouge pas »
T1 = W(4) - 2 / 30
cue("sting_soft", 0.0, -5); k.riser(T1, T1, 0.9); k.sub_drop(T1, 1.0); k.impact(W(2), 0.7, 44.0, 2.0); cue("breath_nervous", W(1) - 0.2, -14)
# ---- monde
cue("wind_city", W(4), -20); cue("wind_city", W(13), -22)
cue("light_off", W(40) - 0.07, 3); k.impact(W(40) - 0.03, 1.1, 40.0, 2.4)                # TAC : la nuit tombe d'un coup (coupe noire)
cue("tower_groan", W(42) - 0.1, -3); cue("metal_creak_far", W(43) + 0.2, -8)                 # les murs glissent
for e in range(5): k.thud(W(47) + e * 0.9, 0.55, 48)                                    # pas lourds des Longs
cue("crowd_breath", W(66), -18); cue("cloth_rustle", W(70), -16)                        # la clairière, le feu
cue("sting_hit", W(82) - 0.05, -10); cue("sting_hit", W(95) - 0.05, -10)                 # règle 1 / règle 2
cue("heartbeat", W(100), -10, 3.0)                                                       # « ne bouge plus »
cue("whisper_voice", W(113), -18)                                                        # les noms gravés
cue("footstep_one", W(129), -14); cue("footstep_one", W(131), -15); cue("wind_city", W(134), -18)
cue("siren_far", W(138) - 0.1, -7)                                                       # la sirène hurle
cue("run_steps_room", W(141), -8)
srng = np.random.default_rng(31)
def steps(t0, t1, dt, g_db):                                                              # pas synthétisés (retour v3 : la course ne s'arrête plus au bout d'1 s)
    t = t0; e = 0
    while t < t1:
        if "footstep_one" not in _c: _c["footstep_one"] = dec(os.path.join(LIB, "footstep_one.mp3"))
        x = _c["footstep_one"]; r = 0.9 + 0.2 * srng.random(); x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
        a = np.abs(x) > 1e-3; x = x * db(vref + g_db + SFX_DB - rms(x[a]) + (1.5 if e % 2 else 0) - 2 * srng.random())
        i = int(t * SR); j = min(N, i + len(x)); sfx[i:j] += x[: j - i]; t += dt * (0.92 + 0.16 * srng.random()); e += 1
steps(W(141) + 1.1, W(152), 0.29, -11)                                                    # tu cours dans le couloir
steps(W(152), W(157) - 0.2, 0.5, -15)                                                     # puis tu marches, essoufflé
cue("heart_fast", W(143), -9)
cue("tower_groan", W(152), -6); cue("steel_door", W(155), -10)                           # l'entrée se referme
cue("metal_creak_far", W(162), -8); k.impact(W(163), 0.7, 42.0, 2.0)                     # un Long se déplie
cue("breath_nervous", W(167), -10); cue("sting_hit", W(170), -8)                          # il tourne la tête
cue("heartbeat", W(179), -9, 6.0); cue("tower_groan", W(183), -10)
HISS = np.zeros((2, N))                                                                  # signature des Longs à chaque apparition
for a, b in [(0.0, W(4) - 0.1), (W(45), W(66) - 0.3), (W(157) - 0.5, TITLE_AT - 0.2)]: HISS += Kit(N, SR).long_hiss(a, b, seed=int(a * 10) + 1)
act = np.abs(HISS[0]) > 1e-5
if act.any(): HISS *= db(vref - 10 + SFX_DB - rms(HISS[0][act]))   # +5 dB (retour utilisateur)
rng = np.random.default_rng(13)
def crack(t0, g=1.0):                                                                    # craquement d'os (v4, « crac » bien audible) : claquement sec + grain + résonance boisée
    n = int(0.11 * SR); t = np.arange(n) / SR; f0 = 600 + 500 * rng.random()
    snap = rng.standard_normal(n) * np.exp(-t / 0.004); snap = snap - np.convolve(snap, np.ones(6) / 6, "same")
    grain = np.zeros(n)
    for _ in range(int(4 + rng.integers(0, 5))):                                        # éclats secondaires (l'os qui cède)
        j = int(rng.random() * 0.05 * SR); m = int(0.006 * SR); grain[j:j + m] += rng.standard_normal(m) * np.exp(-np.arange(m) / (0.0015 * SR)) * (0.3 + 0.5 * rng.random())
    body = (np.sin(2 * np.pi * f0 * t) + 0.6 * np.sin(2 * np.pi * 2.3 * f0 * t)) * np.exp(-t / 0.018) + 0.8 * np.sin(2 * np.pi * 170 * t) * np.exp(-t / 0.03)
    x = snap + grain + 0.5 * body; x *= db(vref - 9 + SFX_DB - rms(x[: int(0.05 * SR)])) * g * (0.8 + 0.4 * rng.random())
    i = int(t0 * SR)
    if 0 <= i < N - n: sfx[i:i + n] += x
def crac3(t0, g=1.0, k=3):                                                                # « crac, crac, crac »
    for e in range(k): crack(t0 + e * (0.17 + 0.06 * rng.random()), g * (1.0 - 0.1 * e))
for e in range(16): crack(W(162) + e * 0.19 + 0.05 * rng.random(), 1.0 + 0.4 * rng.random())   # le Long se déplie : longue salve de craquements d'os
crac3(W(168), 1.0)                                         # sa tête pivote
crac3(0.3, 0.8); crac3(W(1) - 0.15, 0.9)                                            # plan 1 : la tête se penche, puis la bouche s'ouvre sur « bouge »
k.stinger(TITLE_AT, 0.5)
FLIP = TITLE_AT + 0.9                                                                     # le 1 devient 2 sur le carton (FLIP_AFTER, overlay.tsx)
k.reverse(FLIP, 0.35, 0.5); cue("lock_click", FLIP - 0.01, -6); cue("sting_hit", FLIP, -12)
# ---- bruitages de détail, discrets, calés sur les plans (retour utilisateur 2026-11-14 : « qu'on entend mais pas beaucoup »)
ANCH = [0, 4, 5, 13, 22, 31, 37, 40, 42, 45, 49, 57, 66, 70, 82, 95, 107, 120, 126, 138, 141, 152, 157, 167, 173, 179, 195]   # = story.ts
S = lambda k: max(0.0, W(ANCH[k - 1]) - 2 / 30); Se = lambda k: S(k + 1) if k < 27 else TITLE_AT
drng = np.random.default_rng(77)
def bp(x, lo, hi): a = np.convolve(x, np.ones(max(1, int(SR / hi))) / max(1, int(SR / hi)), "same"); return a - np.convolve(a, np.ones(int(SR / lo)) / int(SR / lo), "same")
def put(x, t0, g_db, fade=0.25):
    a = np.abs(x) > 1e-6
    if not a.any(): return
    x = x * db(vref + g_db + SFX_DB - rms(x[a])); f = min(len(x) // 2, int(fade * SR))
    if f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: sfx[i:j] += x[: j - i]
def fire(t0, t1, g_db):                                      # feu de camp : souffle grave + petits crépitements
    n = int((t1 - t0) * SR); x = bp(drng.standard_normal(n), 60, 900) * (0.7 + 0.3 * np.sin(np.arange(n) / SR * 2.1))
    for _ in range(int((t1 - t0) * 9)):
        m = int(0.004 * SR); c = drng.standard_normal(m) * np.exp(-np.arange(m) / (0.0008 * SR)); i = drng.integers(0, max(1, n - m))
        x[i:i + m] += c * (2.5 + 4 * drng.random())
    put(x, t0, g_db, 0.4)
def sand(t0, t1, g_db, dens=60):                             # poussière / sable qui tombe : grains fins aigus
    n = int((t1 - t0) * SR); x = np.zeros(n)
    for _ in range(int((t1 - t0) * dens)):
        m = int(0.002 * SR); i = drng.integers(0, max(1, n - m)); x[i:i + m] += drng.standard_normal(m) * drng.random()
    put(bp(x, 1500, 9000), t0, g_db, 0.3)
def wings(t0, t1, g_db, rate=5.5):                           # nuée d'oiseaux : battements d'ailes
    n = int((t1 - t0) * SR); x = np.zeros(n); t = 0.0
    while t < t1 - t0 - 0.1:
        m = int(0.07 * SR); i = int(t * SR); x[i:i + m] += bp(drng.standard_normal(m), 300, 3000) * np.hanning(m) * (0.5 + drng.random())
        t += 1 / rate * (0.6 + 0.8 * drng.random()) / 3
    put(x, t0, g_db, 0.5)
def puff(t0, g_db):                                          # bougie soufflée : petit « fff »
    m = int(0.35 * SR); put(bp(drng.standard_normal(m), 400, 4000) * np.exp(-np.arange(m) / (0.09 * SR)), t0, g_db, 0.02)
sand(S(3), Se(3), -26)                                       # 3 : poussière qui tombe du mur
wings(S(4) + 0.3, Se(4) - 0.2, -24)                          # 4 : nuée d'oiseaux
sand(S(6), Se(6), -30, 25)                                   # 6 : poussière dorée en suspension (à peine)
cue("vent_air", S(7), -26, Se(7) - S(7))                     # 7 : la lumière baisse, souffle d'air
cue("breath_nervous", S(11) + 0.3, -22)                      # 11 : le jeune tremble
fire(S(13), Se(14), -24)                                     # 13-14 : feu de camp (léger)
sand(S(14) + 0.2, Se(14), -30, 30)                           # 14 : étincelles qui crépitent
fire(S(16), Se(16), -30)                                     # 16 : la nuit, le feu presque éteint
cue("breath_nervous", S(16) + 0.4, -24)                      # 16 : un jeune tremble puis se fige
puff(S(17) + 0.47 * (Se(17) - S(17)), -20)                   # 17 : la bougie s'éteint
for e in range(int((Se(19) - S(19)) / 0.55)): cue("footstep_one", S(19) + 0.2 + e * 0.55, -26)   # 19 : tes pas, loin
sand(S(22), Se(22), -24, 80)                                 # 22 : poussière soulevée par l'entrée
cue("breath_nervous", S(26) + 0.2, -18)
for e in range(4): cue("finger_skin", 0.15 + e * 0.38, -24, 0.25)                    # plan 1 : les 7 doigts tapotent l'arête du mur
crac3(S(11) + 0.3 * (Se(11) - S(11)), 0.9)                                              # 11 : le Long penche la tête
crac3(S(12) + 0.15, 0.85); crac3(S(12) + 0.6 * (Se(12) - S(12)), 0.9)                   # 12 : la tête pivote, la bouche s'ouvre
for e in range(3): cue("finger_skin", S(12) + 0.3 + e * 0.45, -26, 0.25)              # 12 : doigts qui tapotent
crac3(S(24) + 0.55 * (Se(24) - S(24)), 1.0)                                             # 24 : la fente s'ouvre
crac3(S(27) + 0.5, 0.85)                                                                 # 27 : le Long derrière toi bouge                      # 26 : l'ombre monte sur toi, ta respiration
cue("footstep_one", S(27) + 0.25 * (Se(27) - S(27)), -20)    # 27 : un pas, puis tu te retiens
# ---- montage rapide (59 sous-plans) : souffles sur les coupes, sursaut d'ouverture, pas des Longs, pulsation qui accélère
CUTW = {3: [9], 5: [26], 6: [34], 11: [55], 12: [61], 14: [72, 75], 15: [85, 88], 16: [100, 103], 17: [110, 115], 19: [129, 135, 136], 20: [140],
        21: [143, 150], 22: [155], 23: [162, 165], 24: [170], 25: [176], 26: [183, 187, 190], 27: [198, 200, 202, 204, 207]}   # = CUTS de story.ts
SNAP = {55, 85, 140, 170}                                                                 # zooms éclair : souffle plus fort
WG = 2 / 3                                                                                # souffles des coupes : -1/3 (retour utilisateur v2)
for k_ in range(2, 28): k.whoosh(S(k_), 0.35, 0.35 * WG)                                       # chaque changement de scène
for ws in CUTW.values():
    for w in ws: k.whoosh(W(w) - 2 / 30, 0.4 if w in SNAP else 0.3, (0.9 if w in SNAP else 0.45) * WG)
k.impact(0.02, 1.3, 46.0, 1.6); cue("sting_hit", 0.0, -2)                                 # sursaut à la première image
k.whoosh(0.32, 0.3, 0.9); k.reverse(0.75, 0.35, 0.6)                                       # zoom sur ta tête, puis dézoom
k.impact(W(140) - 0.03, 1.0, 44.0, 1.8); k.impact(W(168) - 0.03, 0.9, 38.0, 2.0)           # flash blanc « hurle », noir « tourne »
for sc in (10, 12):                                                                       # drones : pas lourds des Longs + air qui défile
    for e in range(int((Se(sc) - S(sc)) / 0.42)): k.thud(S(sc) + 0.1 + e * 0.42, 0.5, 46)
    cue("vent_air", S(sc), -12, Se(sc) - S(sc)); crac3(S(sc) + 0.25, 0.8); crac3(S(sc) + 0.6 * (Se(sc) - S(sc)), 0.75)
wings(S(15) + 0.2, Se(15) - 0.4, -18)                                                      # 15 : les oiseaux s'envolent du pylône
cue("tower_groan", S(9), -6)                                                               # 9 : le bloc qui glisse
sand(S(9), Se(9), -20, 90)
def pulse(t0, t1, r0, r1, g_db):                                                           # pulsation grave qui accélère (r0 -> r1 coups/s)
    t = t0; x = np.zeros(int((t1 - t0) * SR) + SR)
    while t < t1:
        m = int(0.22 * SR); tt = np.arange(m) / SR; i = int((t - t0) * SR)
        x[i:i + m] += np.sin(2 * np.pi * (52 - 18 * tt) * tt) * np.exp(-tt / 0.06)
        r = r0 + (r1 - r0) * (t - t0) / max(1e-3, t1 - t0); t += 1 / r
    put(x, t0, g_db, 0.05)
pulse(S(10), Se(12), 1.5, 2.0, -10)                                                        # les Longs sortent
pulse(W(138), W(157), 1.6, 2.6, -9)                                                        # la sirène, la course : accélération
pulse(W(157), TITLE_AT - 0.4, 1.3, 3.0, -8)                                                # le Long se déplie -> le choix : accélération jusqu'au bout
# ---- musique douce (-1/4) + tension qui suit l'histoire
REVEAL = [2, 41, 47, 102, 119, 140, 163, 172, 194]
mus = k.music4(DUR, dips=[W(i) - 0.25 for i in REVEAL], transpose=12)
mus = lvl(mus, vref - 7.0)                                                                 # musique un peu plus présente, sous les bruitages
ten, _ = Kit(N, SR, seed=5).tension_layer(DUR, [W(i) for i in REVEAL], W(len(words) - 1) - 14, TITLE_AT)
a = np.abs(ten) > 1e-4
if a.any(): mus = mus + ten * db(vref - 6 - rms(ten[a]))
duck = np.ones(N)
for i in range(len(words)): duck[int(max(0, W(i) - 0.08) * SR):int(min(DUR, E(i) + 0.12) * SR)] = db(-3.0)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
def tiin(t0, d=2.6, g_db=-15, f=1568.0):                                                 # note aiguë tenue qui fait peur (« tiiin », retour v4) : sous la voix
    n = int(d * SR); t = np.arange(n) / SR
    env = np.minimum(t / 0.04, 1) * np.exp(-t / (d * 0.45)) * np.minimum(1, (d - t) / 0.4)
    x = np.sin(2 * np.pi * f * t) + 0.7 * np.sin(2 * np.pi * f * 1.0595 * t + 1) + 0.25 * np.sin(2 * np.pi * f * 2.01 * t)   # demi-ton frottant
    x *= env * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t))                                  # léger trémolo
    x *= db(vref + g_db + SFX_DB - rms(x[: int(0.8 * SR)])); i = int(t0 * SR); j = min(N, i + n)
    if 0 <= i < N: sfx[i:j] += x[: j - i]
for t_ in [W(4) - 0.05, S(10) + 0.2, S(12) + 0.15, W(140) - 0.05, W(162), S(24) + 0.55 * (Se(24) - S(24)), S(27) + 0.5]:
    tiin(t_)                                                                              # Long qui apparaît, sirène, fente, Long derrière toi
hs = k.hit + 0.8 * k.air; hit = lvl(hs, vref - 13)
o = dec(os.path.join(VD, "outro.wav")); j0 = int((TITLE_AT + 0.05) * SR); voice[j0:j0 + len(o)] += o[: max(0, N - j0)] * db(vref - rms(o[np.abs(o) > 1e-3]))
mix = np.stack([voice + mus + hit + sfx + HISS[0], voice + mus * 0.97 + hit + sfx * 0.92 + HISS[1]], 1)
pre = os.path.join(VD, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(VD, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(VD, "mix.wav"), "-b:a", "192k", os.path.join(VD, "mix_ecoute.mp3")])
pub = os.path.join(ROOT, "studio", "public", "mur"); os.makedirs(pub, exist_ok=True); shutil.copy(os.path.join(VD, "mix.wav"), os.path.join(pub, "mix.wav"))
print(f"Le Mur ép. 1 : durée {DUR} s")
