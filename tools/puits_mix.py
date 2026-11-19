# Mix de « Le Puits » ép. 1 (modèle : tools/mur_mix.py ; docs/audio.md) : voix > bruitages > musique, -15 LUFS.
# Demande utilisateur du 2026-11-19 : musique d'ambiance très légère, frottements / bruit de fond, souffles de vent sur les règles,
# petit son quand une règle s'annonce, la musique du tirage (cor) composée ici, le « toc… toc », transitions rapides.
# Indices de mots = productions/puits-ep01/voix_ia/words.json (211 mots). Usage : python3 tools/puits_mix.py
import json, os, shutil, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sound_kit import Kit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
EP = os.path.join(ROOT, "productions", "puits-ep01"); VD = os.path.join(EP, "voix_ia")
SR = 48000; OFF = 0.15; TITLE = 2.8; FPS = 30
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
DUR = round(words[-1]["e"] + OFF + 0.35 + TITLE, 2); N = int(DUR * SR); TITLE_AT = DUR - TITLE
W = lambda i: words[i]["s"] + OFF
E = lambda i: words[i]["e"] + OFF
db = lambda v: 10 ** (v / 20)
dec = lambda p: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
# v2 (2026-11-19) : nouvelle voix d'enfant au niveau du narrateur, « Toc… toc » parlé retiré
v = dec(os.path.join(VD, "voice_v2.wav")); voice = np.zeros(N); i0 = int(OFF * SR); voice[i0:i0 + len(v)] = v[: N - i0]
sp = np.zeros(N, bool)
for w in words: sp[int((w["s"] + OFF) * SR):min(N, int((w["e"] + OFF) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])
def lvl(x, target): a = np.abs(x) > 1e-5; return x * db(target - rms(x[a])) if a.any() else x
k = Kit(N, SR, seed=23); sfx = np.zeros(N); SFX_DB = -1.5; LIB = os.path.join(ROOT, "productions", "sfx_lib"); _c = {}
rng = np.random.default_rng(91)
def bp(x, lo, hi): a = np.convolve(x, np.ones(max(1, int(SR / hi))) / max(1, int(SR / hi)), "same"); return a - np.convolve(a, np.ones(int(SR / lo)) / int(SR / lo), "same")
def lowp(x, hz): n = max(1, int(SR / hz)); return np.convolve(x, np.ones(n) / n, "same")
def put(x, t0, g_db, fade=0.25, ref_len=None):
    a = np.abs(x) > 1e-6
    if not a.any(): return
    r = x[: ref_len] if ref_len else x[a]
    x = x * db(vref + g_db + SFX_DB - rms(r)); f = min(len(x) // 2, int(fade * SR))
    if f: x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: sfx[i:j] += x[: j - i]
def cue(name, t0, g=-10.0, dur=None, fade=0.05):
    if name not in _c: _c[name] = dec(os.path.join(LIB, name + ".mp3"))
    x = _c[name] if dur is None else _c[name][: int(dur * SR)]
    put(x.copy(), t0, g, fade)

# ---------------- temps des plans (= story.ts : ANCH, CUTS, FPV) ----------------
ANCH = [0, 1, 15, 23, 36, 45, 58, 67, 81, 89, 105, 114, 130, 134, 143, 168, 178, 179, 181, 192]
S = lambda sc: 0.0 if sc == 1 else W(ANCH[sc - 1]) - 2 / FPS
Se = lambda sc: S(sc + 1) if sc < 20 else TITLE_AT
CUTW = [10, 19, 26, 29, 33, 40, 48, 51, 73, 76, 85, 94, 99, 110, 119, 137, 140, 149, 156, 173, 184, 189, 208]   # sous-plans internes
FPV_END = W(10) - 2 / FPS

# ---------------- fond : vent du désert + frottements de sable, toujours là, très bas ----------------
def wind(t0, t1, g_db, lo=80, hi=900, sway=0.13, seed=1):
    r = np.random.default_rng(seed); n = int((t1 - t0) * SR); t = np.arange(n) / SR
    x = bp(r.standard_normal(n), lo, hi) * (0.55 + 0.45 * np.sin(2 * np.pi * sway * t + seed) ** 2) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.71 * t))
    put(x, t0, g_db, 0.8)
def sand(t0, t1, g_db, dens=60, seed=2):
    r = np.random.default_rng(seed); n = int((t1 - t0) * SR); x = np.zeros(n)
    for _ in range(int((t1 - t0) * dens)):
        m = int(0.002 * SR); i = r.integers(0, max(1, n - m)); x[i:i + m] += r.standard_normal(m) * r.random()
    put(bp(x, 1500, 9000), t0, g_db, 0.3)
wind(FPV_END, TITLE_AT, -27, seed=3)                                 # vent de fond continu
sand(FPV_END, S(12), -36, 30, 4)                                     # sable qui frotte (jour)
def crickets(t0, t1, g_db):
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    gate = (np.sin(2 * np.pi * 14 * t) > 0.3) * (np.sin(2 * np.pi * 0.9 * t + 1) > -0.2)
    x = np.sin(2 * np.pi * 4300 * t) * gate + 0.6 * np.sin(2 * np.pi * 4800 * t + 2) * (np.sin(2 * np.pi * 11 * t + 0.5) > 0.4) * (np.sin(2 * np.pi * 0.6 * t) > 0)
    put(np.convolve(x, np.ones(40) / 40, "same"), t0, g_db, 0.6)
crickets(S(12), TITLE_AT, -34)                                       # nuit sur la grande place
cue("crowd_breath", S(4) + 0.2, -26); cue("crowd_shuffle", S(6) + 0.3, -27)
cue("crowd_shuffle", S(12) + 0.4, -24); cue("crowd_breath", S(12) + 2.0, -25); cue("crowd_breath", S(17), -27); cue("crowd_shuffle", S(19) + 0.2, -26)

# ---------------- ouverture FPV : air qui défile, accélération, plongée dans le puits -> noir ----------------
n = int(FPV_END * SR); t = np.arange(n) / SR
rush = bp(rng.standard_normal(n), 200, 5000) * np.minimum(1, t / 0.15) * (0.7 + 0.3 * t / FPV_END)
put(rush, 0.0, -17, 0.02)
k.whoosh(FPV_END - 0.55, 0.7, 0.5)                                   # piqué vers le puits (seul souffle gardé : retour utilisateur, souffles trop forts)
dn = int(0.9 * SR); tt = np.arange(dn) / SR                          # descente : souffle qui devient grave et caverneux
put(lowp(rng.standard_normal(dn), 500) * np.exp(-tt / 0.5), FPV_END - 0.45, -12, 0.05)
k.impact(FPV_END - 0.02, 0.9, 40.0, 1.8)                             # noir : coup sourd
cue("sting_soft", 0.0, -14)

# ---------------- la musique du tirage (cor du désert) : composée ici ----------------
def horn_note(f0, d, g=1.0, vib=5.2):
    t = np.arange(int(d * SR)) / SR
    f = f0 * (1 + 0.012 * np.sin(2 * np.pi * vib * t) * np.minimum(1, t / 0.25)) * (1 - 0.03 * np.exp(-t / 0.05))   # attaque un peu basse, vibrato
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = sum((0.9 ** h) / h * np.sin(h * ph) for h in range(1, 9))                     # timbre cuivré (harmoniques riches)
    x = lowp(x, 2600) + 0.06 * bp(rng.standard_normal(len(t)), 300, 3000)           # souffle dans le tube
    env = np.minimum(1, t / 0.07) * np.minimum(1, (d - t) / 0.18) * (0.85 + 0.15 * np.exp(-t / 0.3))
    return x * env * g
def horn_call(t0, g_db, scale=1.0):
    # mode « hijaz » sur ré : ré - mi♭ - fa♯ - sol - la ; appel solennel : la tenu, descente, retour sur ré grave
    D = 146.83 * scale
    notes = [(D * 1.5, 0.62), (D * 1.333, 0.22), (D * 1.265, 0.22), (D * 1.0667, 0.26), (D, 0.9)]
    out = np.zeros(int(sum(d for _, d in notes) * SR + SR)); p = 0
    for f, d in notes: x = horn_note(f, d + 0.12); out[p:p + len(x)] += x; p += int(d * SR)
    rv = np.zeros_like(out)                                                         # réverbération du désert (échos espacés)
    for dly, gg in [(0.11, 0.35), (0.23, 0.25), (0.41, 0.16), (0.67, 0.1)]: s = int(dly * SR); rv[s:] += out[: len(out) - s] * gg
    put(out + rv, t0, g_db, 0.02, ref_len=int(1.0 * SR))
    return len(out) / SR
def drone(t0, t1, g_db, f=73.4):
    t = np.arange(int((t1 - t0) * SR)) / SR
    x = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * f * 1.5 * t + 1) + 0.3 * np.sin(2 * np.pi * f * 2 * t) * (1 + 0.3 * np.sin(2 * np.pi * 0.2 * t))
    x *= np.minimum(1, t / 0.6) * np.minimum(1, (t1 - t0 - t) / 1.2)
    put(x, t0, g_db, 0.3)
def frame_drum(t0, g_db):                                                           # tambour sur cadre (darbouka grave)
    m = int(0.4 * SR); tt = np.arange(m) / SR
    x = np.sin(2 * np.pi * (95 - 30 * tt) * tt) * np.exp(-tt / 0.09) + 0.3 * bp(rng.standard_normal(m), 400, 3000) * np.exp(-tt / 0.02)
    put(x, t0, g_db, 0.005, ref_len=int(0.08 * SR))
HORN = W(14) + 0.05                                                                 # sur « retentit… » : l'appel occupe le silence de 1 s
horn_call(HORN, -1)
for e, g in enumerate([-8, -12, -10, -13]): frame_drum(HORN + 0.02 + e * 0.48, g)
drone(HORN, W(36), -17)                                                             # la note tenue reste sous « tout le monde arrête de respirer »
cue("sting_hit", HORN - 0.02, -16)                                                  # petit son « quand la musique » démarre
# reprise du cor, plus loin et plus bas, quand le tirage commence (crépuscule, grande place)
horn_call(S(12) + 0.1, -15, 1.0); drone(S(12) + 0.1, S(15), -21, 73.4)
for e in range(int((S(15) - S(12)) / 0.62)): frame_drum(S(12) + 0.1 + e * 0.62, -20 if e % 2 else -17)   # pulsation lente du tirage

# ---------------- règles : petit son à l'annonce + souffle de vent ----------------
def rule(t0):
    cue("sting_hit", t0 - 0.04, -14); k.impact(t0 - 0.02, 0.5, 44.0, 1.4)
    wind(t0 - 0.1, t0 + 2.6, -15, 120, 2500, 0.35, int(t0 * 10))                    # rafale de vent
rule(W(67))      # « Les Anciens disent qu'il y vit Celui d'en bas » (le monde, la croyance)
rule(W(81))      # « quand l'eau baisse… c'est qu'il a faim »
rule(W(89))      # la règle : personne ne regarde au fond
cue("whisper_voice", W(99), -24)                              # « celui qui regarde descend le prochain »
rule(W(130))     # « Une seule est noire »

# ---------------- détails calés sur les plans ----------------
cue("cloth_rustle", W(29), -22)                                                     # ton petit frère s'arrête de jouer
def top_spin(t0, t1, g_db):                                                         # la toupie qui tourne puis tombe
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2000, 7000) * (0.6 + 0.4 * np.sin(2 * np.pi * (14 - 8 * t / (t1 - t0)) * t))
    put(x, t0, g_db, 0.1); k.click(t1, 0.4, 1800.0); k.click(t1 + 0.12, 0.25, 1500.0)
top_spin(W(33) - 0.4, W(35) + 0.3, -26)
wind(S(7), Se(7), -14, 60, 600, 0.5, 7);              # plongée verticale dans le puits
drone(S(7), Se(8), -24, 55.0)                                                       # le fond : grave sourd
cue("drip", S(9) + 0.6, -22); cue("drip", W(85) + 0.3, -24)                         # margelle sèche, une goutte au fond
cue("breath_nervous", W(94), -22); sand(W(99), W(102), -26, 90, 9)                  # l'enfant s'approche, ses pieds reculent
cue("metal_creak_far", S(11) + 0.1, -12)                                            # la poulie
for e in range(5): k.click(S(11) + 0.3 + e * 0.36, 0.22, 900.0)                     # cliquetis de la corde
sand(W(110), Se(11) - 0.1, -17, 220, 11)                                            # le sable coule du seau
def stones(t0, t1, g_db, rate=11):                                                  # pierres qui s'entrechoquent dans le sac
    n = int((t1 - t0) * SR); x = np.zeros(n); t = 0.05
    while t < t1 - t0 - 0.05:
        m = int(0.025 * SR); i = int(t * SR); tt = np.arange(m) / SR; f = 1900 + 1400 * rng.random()
        x[i:i + m] += (np.sin(2 * np.pi * f * tt) + 0.5 * bp(rng.standard_normal(m), 1500, 8000)) * np.exp(-tt / 0.005) * (0.4 + rng.random())
        t += rng.exponential(1 / rate)
    put(x, t0, g_db, 0.05)
stones(W(124), W(130), -20); stones(S(13), Se(13), -17, 15); stones(W(137), W(140), -15, 18)
cue("heartbeat", W(140) - 0.1, -12, 3.2); k.impact(W(141) - 0.03, 0.8, 42.0, 2.0)  # « elle est noire »
cue("gasp_boy", W(142) + 0.3, -20)
cue("cloth_rustle", W(149), -20); cue("whisper_voice", W(155), -30)                 # il se penche, chuchote
cue("metal_creak_far", W(168), -13)                                                 # il descend : la poulie grince
for e in range(6): k.click(W(168) + 0.2 + e * 0.3, 0.2, 800.0)
def snap_rope(t0):                                                                  # le couteau tranche la corde : claquement + fouet
    m = int(0.25 * SR); tt = np.arange(m) / SR
    x = bp(rng.standard_normal(m), 800, 9000) * np.exp(-tt / 0.02) + 0.5 * np.sin(2 * np.pi * (300 - 900 * tt) * tt) * np.exp(-tt / 0.06)
    put(x, t0, -8, 0.003, ref_len=int(0.05 * SR))
snap_rope(W(175) + 0.15)
fall = int(1.4 * SR); tt = np.arange(fall) / SR                                     # la corde file dans le noir
put(bp(rng.standard_normal(fall), 300, 3000) * np.exp(-tt / 0.5), W(176) + 0.1, -22, 0.05)

# ---------------- « Silence. »  puis toc… toc : coups étouffés qui montent du fond du puits ----------------
sil = np.ones(N); sil[int((W(178) + 0.4) * SR):int((W(181) - 0.2) * SR)] = db(-20)    # le « Silence. » vaut aussi pour les fonds
sfx *= np.convolve(sil, np.ones(6000) / 6000, "same")
def knock(t0, g_db):
    m = int(1.6 * SR); tt = np.arange(m) / SR
    hit = (np.sin(2 * np.pi * 120 * tt) * np.exp(-tt / 0.035) + 0.6 * np.sin(2 * np.pi * 240 * tt) * np.exp(-tt / 0.02)
           + 0.4 * lowp(rng.standard_normal(m), 900) * np.exp(-tt / 0.012)
           + 0.7 * np.sin(2 * np.pi * 820 * tt) * np.exp(-tt / 0.008)
           + 0.9 * np.sin(2 * np.pi * 180 * tt) * np.exp(-tt / 0.07))                                      # corps du coup : toc FORT (retour utilisateur)                                     # attaque boisée : on entend « toc »
    x = hit.copy()
    for dly, gg in [(0.07, 0.5), (0.15, 0.36), (0.26, 0.24), (0.4, 0.15), (0.58, 0.09), (0.8, 0.05)]:   # écho dans le conduit de pierre
        s = int(dly * SR); x[s:] += lowp(hit[: m - s], 600) * gg
    put(x, t0, g_db, 0.002, ref_len=int(0.06 * SR))
knock(W(179) - 0.03, 9); knock(W(180) - 0.03, 9)                  # vrais coups (le narrateur ne les dit plus)

# ---------------- coupes rapides : petit souffle à chaque changement de plan ----------------
# souffles de transition retirés (retour utilisateur : trop forts, entendus tout le temps) -> notes tenues de tension (« tiiin »)
def tiin(t0, d=2.8, g_db=-17, f=1568.0):
    n = int(d * SR); t = np.arange(n) / SR
    env = np.minimum(t / 0.25, 1) * np.exp(-t / (d * 0.5)) * np.minimum(1, (d - t) / 0.5)
    x = np.sin(2 * np.pi * f * t) + 0.6 * np.sin(2 * np.pi * f * 1.0595 * t + 1) + 0.2 * np.sin(2 * np.pi * f * 2.01 * t)   # demi-ton qui frotte
    x *= env * (1 + 0.2 * np.sin(2 * np.pi * 5.0 * t))
    put(x, t0, g_db, 0.02, ref_len=int(0.8 * SR))
for t_, f_, g_ in [(W(23) - 0.1, 1318.5, -18), (W(58), 1568.0, -19), (W(73) - 0.05, 1174.7, -17), (W(89) - 0.05, 1568.0, -18), (W(130) - 0.05, 1396.9, -17),
                   (W(141) - 0.05, 1760.0, -16), (W(168), 1174.7, -18), (W(184), 1568.0, -18), (W(192), 1318.5, -17)]:
    tiin(t_, 2.8, g_, f_)

# ---------------- musique d'ambiance très légère + tension finale ----------------
REVEAL = [0, 23, 67, 89, 130, 141, 168, 179, 192]
mus = k.music4(DUR, dips=[W(i) - 0.25 for i in REVEAL], transpose=0)
mus = lvl(mus, vref - 15.0)                                                         # très légère
gate = np.ones(N); a_ = int(W(178) * SR); b_ = int((W(181) - 0.1) * SR); gate[a_:b_] = db(-30)   # vrai silence autour du toc toc
gate[int(HORN * SR):int((HORN + 1.6) * SR)] = db(-12)                               # le cor passe devant
mus *= np.convolve(gate, np.ones(4000) / 4000, "same")
ten, _ = Kit(N, SR, seed=7).tension_layer(DUR, [W(i) for i in REVEAL], W(181), TITLE_AT)
act = np.abs(ten) > 1e-4
if act.any(): mus = mus + ten * db(vref - 12 - rms(ten[act]))
duck = np.ones(N)
for i in range(len(words)): duck[int(max(0, W(i) - 0.08) * SR):int(min(DUR, E(i) + 0.12) * SR)] = db(-3.0)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
k.stinger(TITLE_AT, 0.5); cue("sting_hit", TITLE_AT, -12)
hit = lvl(k.hit + 0.8 * k.air, vref - 13)
o = dec(os.path.join(VD, "outro.wav")); j0 = int((TITLE_AT + 0.05) * SR); voice[j0:j0 + len(o)] += o[: max(0, N - j0)] * db(vref - rms(o[np.abs(o) > 1e-3]))
sfx_l = sfx; mix = np.stack([voice + mus + hit + sfx_l, voice + mus * 0.97 + hit + sfx_l * 0.93], 1)
pre = os.path.join(VD, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(VD, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(VD, "mix.wav"), "-b:a", "192k", os.path.join(VD, "mix_ecoute.mp3")])
pub = os.path.join(ROOT, "studio", "public", "puits"); os.makedirs(pub, exist_ok=True); shutil.copy(os.path.join(VD, "mix.wav"), os.path.join(pub, "mix.wav"))
print(f"Le Puits ép. 1 : durée {DUR} s ({round(DUR * FPS)} images)")
