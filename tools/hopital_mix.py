# Mix de « L'hôpital » ép. 1 (modèle : tools/mur_mix.py ; sound design : episodes/hopital-ep01-decoupage.md, section SOUND DESIGN).
# Hiérarchie : voix > bruitages (−9 à −15 dB) > ambiances de lieu (−18 à −24 dB) > musique (−20 dB, −3 dB de plus sous la voix). −15 LUFS.
# Usage : python3 tools/hopital_mix.py  ->  productions/hopital-ep01/voix_ia/mix.wav (+ mix_ecoute.mp3) et studio/public/hopital/mix.wav
import json, os, shutil, subprocess, sys
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sound_kit import Kit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
VD = os.path.join(ROOT, "productions", "hopital-ep01", "voix_ia"); LIB = os.path.join(ROOT, "productions", "sfx_lib")
SR = 48000; OFF = 0.15
words = json.load(open(os.path.join(VD, "words.json"), encoding="utf-8"))
W = lambda i: words[i]["s"] + OFF
E = lambda i: words[i]["e"] + OFF
# plans = story.ts (PLANS) : nom -> indice du premier mot
PLANS = [("01", 0), ("02", 6), ("03", 8), ("04a", 13), ("04b", 17), ("05", 18), ("06", 23), ("07", 31), ("08", 34), ("09", 39), ("10", 45), ("11a", 49), ("11b", 54),
         ("12", 58), ("13", 63), ("14", 69), ("15", 76), ("16a", 86), ("16b", 90), ("17", 98), ("18", 106), ("19", 111), ("20", 119), ("21", 134), ("22", 140), ("23", 150),
         ("24", 153), ("25", 161), ("26", 173), ("27", 177), ("28", 191), ("29", 194), ("30", 203), ("31a", 208), ("31b", 215), ("31c", 223), ("31d", 232), ("32", 235)]
TITLE_AT = W(235) - 0.15
DUR = round(max(E(len(words) - 1) + 0.9, TITLE_AT + 2.8), 3); N = int(DUR * SR)
ST = {n: (0.0 if k == 0 else W(w) - 2 / 30) for k, (n, w) in enumerate(PLANS)}
NX = {n: (ST[PLANS[k + 1][0]] if k + 1 < len(PLANS) else DUR) for k, (n, _) in enumerate(PLANS)}
S = lambda n: ST[n]; Se = lambda n: NX[n]; At = lambda n, u: ST[n] + (NX[n] - ST[n]) * u
db = lambda v: 10 ** (v / 20)
dec = lambda p: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
v = dec(os.path.join(VD, "voice.wav")); voice = np.zeros(N); i0 = int(OFF * SR); voice[i0:i0 + len(v)] = v[: N - i0]
sp = np.zeros(N, bool)
for w in words: sp[int((w["s"] + OFF) * SR):min(N, int((w["e"] + OFF) * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9); vref = rms(voice[sp])
k = Kit(N, SR, seed=31); sfx = np.zeros(N); amb = np.zeros(N); _c = {}
rng = np.random.default_rng(47)
def lib(name):
    if name not in _c: _c[name] = dec(os.path.join(LIB, name + ".mp3"))
    return _c[name]
def put(dst, x, t0, g_db, fade=0.02):
    a = np.abs(x) > 1e-5
    if not a.any(): return
    x = x * db(vref + g_db - rms(x[a])); f = min(len(x) // 2, int(fade * SR))
    if f: x = x.copy(); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f)
    i = int(t0 * SR); j = min(N, i + len(x))
    if 0 <= i < N: dst[i:j] += x[: j - i]
def cue(name, t0, g=-12.0, dur=None, fade=0.02):                       # bruitage synchronisé
    x = lib(name); x = x if dur is None else x[: int(dur * SR)]; put(sfx, x, t0, g, fade)
def loop(name, t0, t1, g, fade=0.45):                                 # ambiance continue de lieu (échantillon bouclé, fondus)
    x = lib(name); n = int((t1 - t0) * SR)
    if n <= 0: return
    reps = int(np.ceil(n / len(x))) + 1; y = np.tile(x, reps)[:n]; put(amb, y, t0, g, fade)
def bp(x, lo, hi):
    a = np.convolve(x, np.ones(max(1, int(SR / hi))) / max(1, int(SR / hi)), "same"); return a - np.convolve(a, np.ones(int(SR / lo)) / int(SR / lo), "same")
# ---------------- synthèses spécifiques ----------------
def gunshot(t0, g=-6.0, far=1.0):                                     # tir : claquement + corps grave + écho sur la façade
    n = int(1.2 * SR); t = np.arange(n) / SR
    x = rng.standard_normal(n) * np.exp(-t / 0.012) + 0.9 * np.sin(2 * np.pi * (90 - 40 * t) * t) * np.exp(-t / 0.05)
    for d, a in ((0.21, 0.35), (0.43, 0.18), (0.7, 0.08)): j = int(d * SR); x[j:] += a * x[: n - j] * far
    x = bp(x, 80, 6000 if far > 0.5 else 2500); put(sfx, x, t0, g)
def growl(t0, d, g=-16.0, f=70.0):                                    # grognement rauque d'infecté
    n = int(d * SR); t = np.arange(n) / SR; am = 0.55 + 0.45 * np.sin(2 * np.pi * (23 + 6 * rng.random()) * t)
    x = bp(rng.standard_normal(n), f, 900) * am * np.minimum(1, t / 0.08) * np.minimum(1, (d - t) / 0.25)
    x += 0.4 * np.sin(2 * np.pi * f * t + 3 * np.sin(2 * np.pi * 7 * t)) * am; put(sfx, x, t0, g)
def glass(t0, g=-8.0):                                                # vitre qui éclate : impact + éclats aigus
    k.impact(t0, 0.6, 60.0, 1.0); cue("glass_rattle", t0 + 0.02, g + 2)
    n = int(1.4 * SR); x = np.zeros(n)
    for _ in range(70):
        m = int(0.012 * SR); i = int(rng.random() ** 2 * (n - m)); x[i:i + m] += np.sin(2 * np.pi * (3000 + 5000 * rng.random()) * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.003 * SR)) * rng.random()
    put(sfx, x, t0, g)
def tiin(t0, d=2.6, g=-15.0, f=1568.0):                               # note aiguë « tiiin » (signature des apparitions qui font peur)
    n = int(d * SR); t = np.arange(n) / SR; env = np.minimum(t / 0.04, 1) * np.exp(-t / (d * 0.45)) * np.minimum(1, (d - t) / 0.4)
    x = (np.sin(2 * np.pi * f * t) + 0.7 * np.sin(2 * np.pi * f * 1.0595 * t + 1) + 0.25 * np.sin(2 * np.pi * f * 2.01 * t)) * env * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t))
    put(sfx, x, t0, g)
def crack(t0, g=-12.0):                                               # craquement organique (veines)
    n = int(0.09 * SR); t = np.arange(n) / SR; x = rng.standard_normal(n) * np.exp(-t / 0.004); x = x - np.convolve(x, np.ones(6) / 6, "same")
    x += 0.4 * np.sin(2 * np.pi * (500 + 400 * rng.random()) * t) * np.exp(-t / 0.02); put(sfx, x, t0, g)
def steps(t0, t1, dt, g, name="footstep_one"):                        # pas continus (jamais un seul échantillon)
    t = t0; e = 0
    while t < t1:
        x = lib(name); r = 0.9 + 0.2 * rng.random(); x = np.interp(np.arange(0, len(x) - 1, r), np.arange(len(x)), x)
        put(sfx, x, t, g + (1.5 if e % 2 else 0) - 2 * rng.random()); t += dt * (0.92 + 0.16 * rng.random()); e += 1
def heartbeat(t0, t1, bpm, g):
    t = t0
    while t < t1:
        for d, a in ((0, 1.0), (0.18, 0.7)):
            m = int(0.16 * SR); tt = np.arange(m) / SR; put(sfx, a * np.sin(2 * np.pi * (55 - 20 * tt) * tt) * np.exp(-tt / 0.05), t + d, g)
        t += 60 / bpm
def rotor(t0, t1, g):                                                 # hélicoptère lointain
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; x = bp(rng.standard_normal(n), 60, 500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 11 * t))); put(amb, x, t0, g, 0.6)
def gyro(t0, t1, g):                                                  # rotation des gyrophares : « wouf » cyclique très bas
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; x = bp(rng.standard_normal(n), 150, 1200) * (0.5 + 0.5 * np.sin(2 * np.pi * 1.4 * t)) ** 3; put(amb, x, t0, g, 0.4)
def silence_room(t0, t1, g): loop("elec_hum", t0, t1, g)
def buzz(t0, t1, g, f=100.0):                                         # bourdonnement électrique des néons puissants
    n = int((t1 - t0) * SR); t = np.arange(n) / SR
    x = sum(np.sin(2 * np.pi * f * h * t) / h for h in (1, 2, 3, 5, 7)) * (1 + 0.15 * np.sin(2 * np.pi * 0.7 * t)); put(amb, x, t0, g, 0.3)
def click(t0, g=-20.0, f=2600.0): m = int(0.03 * SR); tt = np.arange(m) / SR; put(sfx, np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.006), t0, g)

# ================= AMBIANCES (lieux) =================
silence_room(S("01"), Se("03"), -24); loop("siren_far", S("01"), Se("03"), -30)                       # chambre : bourdonnement + sirènes étouffées
loop("siren_far", S("04a"), Se("04a"), -24); loop("crowd_shuffle", S("04a"), Se("04a"), -26)          # dehors à travers la vitre
loop("hall_ambience", S("04b"), Se("04b"), -24)
loop("wind_city", S("05"), Se("06"), -22); loop("siren_far", S("05"), Se("06"), -20); loop("crowd_shuffle", S("05"), Se("05"), -28); gyro(S("05"), Se("06"), -28)
silence_room(S("07"), Se("10"), -26)                                                                   # chambre : silence lourd
for a, b in (("11a", "19"),):                                                                          # couloir : néons, ventilation, alarme lointaine
    loop("neon_flicker", S(a), Se(b), -27); loop("vent_air", S(a), Se(b), -28); loop("hall_ambience", S(a), Se(b), -27)
loop("wind_city", S("20"), Se("20"), -20); loop("siren_far", S("20"), Se("20"), -20); rotor(At("20", 0.35), Se("20"), -27); gyro(At("20", 0.4), Se("20"), -27)
loop("hall_ambience", S("21"), Se("26"), -26)                                                          # cage d'escalier : réverbération
buzz(S("22"), Se("26"), -27, 100); buzz(S("24"), Se("24"), -22, 120)                                   # néons de secours puissants
loop("drip", S("27"), Se("28"), -26); loop("vent_air", S("27"), Se("28"), -32)                         # couloir noir : goutte, presque rien
buzz(S("29"), Se("30"), -21, 120)                                                                      # couloir blanc : bourdonnement intense
loop("drip", S("31a"), Se("31d"), -30); buzz(S("31a"), Se("31d"), -28, 120)
loop("wind_city", S("32"), DUR, -24); loop("siren_far", S("32"), DUR, -30)

# ================= BRUITAGES (actions) =================
cue("breath_nervous", 0.25, -16); cue("beep_ok", 0.35, -22); click(At("01", 0.16), -18)                # 01 : respiration, HUD, tag PATIENT 047
cue("bed_creak", S("02") + 0.05, -14); cue("cloth_rustle", At("02", 0.25), -13); k.thud(At("02", 0.8), 0.25, 80)   # 02 : lit, drap qui glisse puis tombe
click(S("03") + 0.04, -14, 1800); k.whoosh(S("03"), 0.3, 0.35)                                         # 03 : la tête pivote d'un bloc
steps(S("04a") + 0.1, Se("04a"), 0.24, -24)                                                            # 04a : course étouffée dehors
steps(S("04b"), Se("04b"), 0.22, -18); cue("door_slam_far", At("04b", 0.5), -16)                       # 04b : couloir, porte battante
click(At("05", 0.25), -19)                                                                             # 05 : tag ZONE CONFINÉE
for q, tt in enumerate((At("06", 0.15), At("06", 0.2), At("06", 0.5), At("06", 0.54), At("06", 0.58), At("06", 0.85))): gunshot(tt, -7 - 2 * (q % 2))   # 06 : 3 salves
growl(At("06", 0.1), 1.6, -26); click(At("06", 0.1), -19)
cue("pa_static", S("07"), -13, Se("07") - S("07"), 0.03); cue("mic_tap", At("07", 0.4), -16); click(At("07", 0.3), -18)   # 07 : radio qui grésille, coupure
cue("breath_nervous", S("08") + 0.2, -17)                                                               # 08 : respiration retenue
steps(S("09") + 0.15, S("09") + 0.6, 0.22, -13)                                                        # 09 : pieds au sol
cue("door_push", S("10") + 0.05, -11); steps(S("10") + 0.3, Se("10"), 0.26, -16)                        # 10 : porte poussée, pas rapides
steps(S("11a"), Se("11a"), 0.45, -19); growl(At("11a", 0.4), 1.0, -22, 90)                              # 11a : pas, râle du soignant
cue("struggle", At("11b", 0.25), -14); k.thud(At("11b", 0.7), 0.6, 55)                                  # 11b : chute lourde
for e in range(5): heartbeat(S("12") + e * 0.32, S("12") + e * 0.32 + 0.1, 200, -16)                   # 12 : pulsations du sang
tiin(S("13") + 0.15, 2.4, -15); [crack(At("13", 0.15 + 0.11 * e), -16) for e in range(7)]; click(At("13", 0.4), -17, 900)   # 13 : veines, « tiiin », tag INFECTÉ
growl(S("14"), 1.4, -11, 75); k.whoosh(S("14") + 0.1, 0.4, 0.6); cue("struggle", At("14", 0.45), -12); cue("glass_rattle", At("14", 0.6), -15)   # 14 : bond, fuyard au sol
cue("lights_cascade", At("15", 0.1), -17); [cue("light_on", At("15", 0.12 + 0.12 * e), -17) for e in range(3)]   # 15 : la règle 1 s'allume
steps(S("16a"), Se("16a"), 0.6, -21)                                                                   # 16a : pas prudents
cue("gasp_teen", At("16b", 0.2), -20); click(At("16b", 0.25), -20, 2000)                                # 16b : fillette, tag SURVIVANTE
cue("cloth_rustle", S("17") + 0.2, -18); cue("finger_skin", At("17", 0.25), -18, 0.3); steps(At("17", 0.6), Se("17"), 0.32, -18)   # 17 : main dans la main, ils repartent
growl(S("18") + 0.1, 1.4, -15, 65); tiin(S("18") + 0.05, 2.0, -16, 1661.0)                             # 18 : yeux blancs
cue("run_steps_room", S("19"), -12); steps(S("19") + 0.2, Se("19"), 0.17, -15)                          # 19 : la horde (4)
for q in range(4): growl(S("19") + 0.15 + q * 0.35, 1.2, -15 - q, 60 + 12 * q)
cue("beep_ok", At("19", 0.1), -16); click(At("19", 0.1), -17)
glass(S("20") + 0.25, -9); k.whoosh(At("20", 0.15), 1.2, 0.8); k.whoosh(At("20", 0.45), 0.9, 0.5)     # 20 : vitre, vitesse sur la façade
cue("pa_static", At("20", 0.6), -17, 1.4); cue("mic_tap", At("20", 0.62), -16); click(At("20", 0.52), -19)   # talkie, tag POLICE
cue("steps_stairs", S("21"), -13, Se("21") - S("21")); steps(S("21") + 0.1, Se("21"), 0.18, -17)      # 21 : on dévale l'escalier
for e in range(3): k.whoosh(At("21", 0.15 + 0.3 * e), 0.35, 0.3)
k.thud(S("22") + 0.06, 0.55, 60); cue("breath_nervous", S("22") + 0.2, -11); heartbeat(S("22"), Se("23"), 120, -18)   # 22 : dos contre le béton, souffle
cue("gasp_teen", S("23") + 0.1, -21)                                                                    # 23 : la fillette
steps(S("24"), Se("24"), 0.38, -20, "footstep_one"); [growl(At("24", 0.1 + 0.22 * q), 1.0, -19 - q, 70 + 9 * q) for q in range(4)]   # 24 : ils piétinent
k.whoosh(S("25") + 0.1, 0.8, 0.3); cue("light_on", W(161) - 0.05, -15); cue("neon_flicker", W(161), -20, 1.6)   # 25 : la règle 2 s'imprime
cue("breath_nervous", S("26") + 0.3, -19)                                                               # 26 : respiration retenue
steps(S("27") + 0.2, Se("27"), 0.7, -27)                                                               # 27 : travelling feutré
cue("neon_flicker", S("28"), -12, Se("28") - S("28")); click(At("28", 0.1), -17, 2200)                 # 28 : panneau vert qui grésille et claque
k.whoosh(S("29") + 0.05, 0.9, 0.35)                                                                    # 29 : travelling dans la lumière
cue("glass_rattle", S("30") + 0.2, -24); steps(S("30"), S("30") + 0.6, 0.3, -18)                       # 30 : vitres, pas qui s'arrêtent net
cue("breath_nervous", S("31a") + 0.15, -19); heartbeat(S("31a"), Se("31d"), 64, -21)                   # 31 : respiration, cœur lent
click(W(221) - 0.05 if False else S("31b") + 0.5, -16, 900); click(At("31c", 0.6), -16, 3000)         # cartes A (grave) / B (aiguë)
growl(S("31d"), 1.6, -27); cue("gasp_teen", At("31d", 0.5), -24)
FLIP = TITLE_AT + 0.9 + 0.4                                                                            # 32 : « ÉPISODE 1 » -> « 2 » (Hopital.tsx)
k.stinger(TITLE_AT, 0.45); k.reverse(FLIP, 0.35, 0.5); cue("lock_click", FLIP - 0.01, -8); cue("sting_hit", FLIP, -10)
# souffles discrets aux coupes (sauf les inserts très courts)
for n, _ in PLANS[1:]: k.whoosh(S(n), 0.3, 0.22)

# ================= MUSIQUE DE FOND (très discrète) =================
SECT = [("01", 0.45, 0.0), ("05", 0.6, 1.0), ("07", 0.15, 0.0), ("08", 0.5, 1.15), ("11a", 0.7, 1.4), ("15", 0.45, 0.0), ("16a", 0.4, 0.0),
        ("18", 0.95, 1.9), ("22", 0.35, 0.0), ("24", 0.6, 1.1), ("25", 0.45, 0.0), ("26", 0.6, 1.0), ("32", 1.0, 0.0)]   # (début, intensité, pulsation coups/s)
lev = np.zeros(N); pr = np.zeros(N)
for q, (n, a, r) in enumerate(SECT):
    i = int(S(n) * SR); j = int(S(SECT[q + 1][0]) * SR) if q + 1 < len(SECT) else N; lev[i:j] = a; pr[i:j] = r
lev[int(At("26", 0) * SR):int(TITLE_AT * SR)] = np.linspace(0.6, 0.85, int(TITLE_AT * SR) - int(At("26", 0) * SR))   # suspense qui monte avant le choix
lev[int(TITLE_AT * SR):] = np.linspace(0.85, 1.25, N - int(TITLE_AT * SR))                                                # montée dramatique du carton
lev = np.convolve(lev, np.ones(int(0.6 * SR)) / int(0.6 * SR), "same")                                                    # transitions fluides
REVEAL = [63, 106, 161, 177, 194]
mus = k.music4(DUR, dips=[W(i) - 0.25 for i in REVEAL], transpose=0)
ten, _ = Kit(N, SR, seed=7).tension_layer(DUR, [W(i) for i in REVEAL], W(208), TITLE_AT)
a = np.abs(mus) > 1e-4; mus = mus * db(vref - 20 - rms(mus[a]))
a = np.abs(ten) > 1e-4
if a.any(): mus = mus + ten * db(vref - 21 - rms(ten[a]))
pulse = np.zeros(N); t = 0.0                                                                                              # pulsation grave qui accélère avec le stress
while t < DUR - 0.3:
    r = pr[int(t * SR)]
    if r > 0:
        m = int(0.22 * SR); tt = np.arange(m) / SR; i = int(t * SR); pulse[i:i + m] += (np.sin(2 * np.pi * (52 - 18 * tt) * tt) * np.exp(-tt / 0.06))[: N - i]; t += 1 / r
    else: t += 0.05
a = np.abs(pulse) > 1e-4
if a.any(): mus = mus + pulse * db(vref - 15 - rms(pulse[a]))
mus *= lev
duck = np.ones(N)
for i in range(len(words)): duck[int(max(0, W(i) - 0.08) * SR):int(min(DUR, E(i) + 0.12) * SR)] = db(-3.0)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
hit = k.hit + 0.8 * k.air; a = np.abs(hit) > 1e-5; hit = hit * db(vref - 14 - rms(hit[a])) if a.any() else hit

mix = np.stack([voice + mus + amb + hit + sfx, voice + mus * 0.97 + amb * 0.95 + hit + sfx * 0.93], 1)
pre = os.path.join(VD, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", os.path.join(VD, "mix.wav")], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(VD, "mix.wav"), "-b:a", "192k", os.path.join(VD, "mix_ecoute.mp3")])
# stems d'écoute (pour régler les niveaux) : musique seule, bruitages + ambiances seuls
for name, x in (("stem_musique", mus), ("stem_bruitages", amb + hit + sfx)):
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "160k", os.path.join(VD, name + ".mp3")], input=x.tobytes(), check=True)
pub = os.path.join(ROOT, "studio", "public", "hopital"); os.makedirs(pub, exist_ok=True); shutil.copy(os.path.join(VD, "mix.wav"), os.path.join(pub, "mix.wav"))
print(f"L'hôpital ép. 1 : durée {DUR} s ; voix {vref:.1f} dB ; musique {rms(mus[np.abs(mus) > 1e-4]):.1f} ; bruitages {rms((amb + sfx)[np.abs(amb + sfx) > 1e-4]):.1f}")
