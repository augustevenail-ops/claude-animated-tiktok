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
k = Kit(N, SR, seed=21); sfx = np.zeros(N); SFX_DB = -4.0; LIB = os.path.join(ROOT, "productions", "sfx_lib"); _c = {}   # SFX_DB : bruitages 4 dB plus bas (retour utilisateur)
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
cue("light_off", W(41) - 0.05, -2); k.impact(W(41), 0.8, 40.0, 2.4)                    # TAC : la nuit tombe d'un coup
cue("tower_groan", W(42), -8); cue("metal_creak_far", W(43) + 0.3, -12)                 # les murs glissent
for e in range(5): k.thud(W(47) + e * 0.9, 0.55, 48)                                    # pas lourds des Longs
cue("crowd_breath", W(66), -18); cue("cloth_rustle", W(70), -16)                        # la clairière, le feu
cue("sting_hit", W(82) - 0.05, -10); cue("sting_hit", W(95) - 0.05, -10)                 # règle 1 / règle 2
cue("heartbeat", W(100), -10, 3.0)                                                       # « ne bouge plus »
cue("whisper_voice", W(113), -18)                                                        # les noms gravés
cue("footstep_one", W(129), -14); cue("footstep_one", W(131), -15); cue("wind_city", W(134), -18)
cue("siren_far", W(138) - 0.1, -7)                                                       # la sirène hurle
cue("run_steps_room", W(141), -8); cue("heart_fast", W(143), -9)
cue("tower_groan", W(152), -6); cue("steel_door", W(155), -10)                           # l'entrée se referme
cue("metal_creak_far", W(162), -8); k.impact(W(163), 0.7, 42.0, 2.0)                     # un Long se déplie
cue("breath_nervous", W(167), -10); cue("sting_hit", W(170), -8)                          # il tourne la tête
cue("heartbeat", W(179), -9, 6.0); cue("tower_groan", W(183), -10)
HISS = np.zeros((2, N))                                                                  # signature des Longs à chaque apparition
for a, b in [(0.0, W(4) - 0.1), (W(45), W(66) - 0.3), (W(157) - 0.5, TITLE_AT - 0.2)]: HISS += Kit(N, SR).long_hiss(a, b, seed=int(a * 10) + 1)
act = np.abs(HISS[0]) > 1e-5
if act.any(): HISS *= db(vref - 10 + SFX_DB - rms(HISS[0][act]))   # +5 dB (retour utilisateur)
rng = np.random.default_rng(13)
def crack(t0, g=1.0):                                                                    # craquement d'os : salve de claquements secs filtrés
    for e in range(int(3 + rng.integers(0, 4))):
        n = int(0.012 * SR); x = rng.standard_normal(n) * np.exp(-np.arange(n) / (0.002 * SR)); x = x - np.convolve(x, np.ones(4) / 4, "same")
        i = int((t0 + e * (0.03 + 0.05 * rng.random())) * SR)
        if 0 <= i < N - n: sfx[i:i + n] += x * g * db(vref - 4 + SFX_DB) * (0.5 + rng.random())
for e in range(6): crack(W(163) + e * 0.32, 0.9)                                         # le Long se déplie
for e in range(3): crack(W(168) + e * 0.22, 1.0)                                         # sa tête pivote
crack(W(10), 0.7)                                                                        # tête qui se penche (plan 1)
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
cue("breath_nervous", S(26) + 0.2, -18)                      # 26 : l'ombre monte sur toi, ta respiration
cue("footstep_one", S(27) + 0.25 * (Se(27) - S(27)), -20)    # 27 : un pas, puis tu te retiens
# ---- musique douce (-1/4) + tension qui suit l'histoire
REVEAL = [2, 41, 47, 102, 119, 140, 163, 172, 194]
mus = k.music4(DUR, dips=[W(i) - 0.25 for i in REVEAL], transpose=12)
mus = lvl(mus, vref - 6) * 0.75
ten, _ = Kit(N, SR, seed=5).tension_layer(DUR, [W(i) for i in REVEAL], W(len(words) - 1) - 14, TITLE_AT)
a = np.abs(ten) > 1e-4
if a.any(): mus = mus + ten * db(vref - 5 - rms(ten[a])) * 0.75
duck = np.ones(N)
for i in range(len(words)): duck[int(max(0, W(i) - 0.08) * SR):int(min(DUR, E(i) + 0.12) * SR)] = db(-2.5)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
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
