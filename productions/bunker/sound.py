#!/usr/bin/env python3
"""« Le Nuage » : bruitages (bibliothèque productions/sfx_lib + synthèse numpy), calés plan par plan sur studio/src/videos/bunker/shots.ts,
mixés sous la voix (voix > bruitages > ambiances ; pas de musique : l'utilisateur fournira la sienne).
Sorties : sfx.wav (bruitages seuls, stéréo), mix.wav (voix + bruitages), fiche_audio.md + plans.md (tableaux), cues.json.
  python3 productions/bunker/sound.py
"""
import json, re, subprocess
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[2]; D = Path(__file__).parent
SR = 48000; FPS = 30
W = json.load(open(D / "voix/words.json", encoding="utf-8"))
src = (ROOT / "studio/src/videos/bunker/shots.ts").read_text(encoding="utf-8")
SH = [dict(w=int(m[0]), set=m[1], fr=m[2], mv=m[3], ref=int(m[4]), desc=m[5]) for m in
      re.findall(r'\{ w: (\d+), set: "(\w+)", fr: "(\w+)", mv: "(\w+)", ref: (\d+), desc: "([^"]+)"', src)]
TOTAL = round((W[-1]["e"] + 1.4) * FPS)
START = [0] + [round(W[s["w"]]["s"] * FPS) - 2 for s in SH[1:]]
END = START[1:] + [TOTAL]
N = int(TOTAL / FPS * SR) + SR
rng = np.random.default_rng(7)

def load(name):
    a = subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(ROOT / f"productions/sfx_lib/{name}.mp3"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(a, np.float32).astype(np.float64)
LIB = {}
def lib(name): LIB.setdefault(name, load(name)); return LIB[name]
out = np.zeros((2, N))
CUES = {}   # plan -> liste de libellés (fiche audio)
AMB = {}

def put(sig, t0, g=1.0, pan=0.0, label=None, shot=None):
    i = int(t0 * SR); j = min(N, i + len(sig))
    if i < 0 or j <= i: return
    l, r = np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)
    out[0, i:j] += sig[: j - i] * g * l * 1.414; out[1, i:j] += sig[: j - i] * g * r * 1.414
    if label and shot is not None: CUES.setdefault(shot, []).append(label)
def x_(d): return np.arange(int(d * SR)) / SR
def sm(x, n): n = max(1, int(n)); return np.convolve(x, np.ones(n) / n, "same")
def bp(x, lo, hi): return sm(x, SR / hi / 2) - sm(x, SR / lo / 2)
def noise(n): return rng.standard_normal(n)
def fade(s, a=0.05, r=0.2):
    n = len(s); e = np.ones(n); ia, ir = min(n, int(a * SR)), min(n, int(r * SR))
    if ia: e[:ia] = np.linspace(0, 1, ia)
    if ir: e[n - ir:] = np.linspace(1, 0, ir)
    return s * e
def norm(s, p=0.9): m = np.max(np.abs(s)) + 1e-9; return s / m * p

# ---------------- synthèses ----------------
def rumble(d, lvl=1.0, f=(25, 160)):
    x = x_(d); n = bp(noise(len(x)), *f); lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.13 * x + rng.random() * 6)
    return fade(norm(n) * lfo * lvl, 0.6, 0.8)
def thunder(d=3.0):
    x = x_(d); n = bp(noise(len(x)), 30, 900); env = np.exp(-x * 1.4) * (1 + 0.6 * (sm(noise(len(x)), SR * 0.08) > 0.03))
    return norm(n * env * np.minimum(x / 0.05, 1))
def jet(d):
    x = x_(d); n = bp(noise(len(x)), 300, 3000) * 0.7 + bp(noise(len(x)), 60, 300) * 0.6
    whine = np.sin(2 * np.pi * 2400 * x + 3 * np.sin(2 * np.pi * 0.4 * x)) * 0.08
    return fade(norm(n + whine), 0.4, 0.4)
def crack(n_=8, d=1.6, dens=1.0):
    s = np.zeros(int(d * SR))
    for k in range(int(n_ * dens)):
        i = int(rng.random() * (len(s) - SR * 0.08)); x = x_(0.07 + rng.random() * 0.05)
        b = bp(noise(len(x)), 900, 7000) * np.exp(-x * (60 + rng.random() * 60)) * (0.5 + rng.random())
        s[i:i + len(b)] += b
    g = bp(noise(len(s)), 80, 900) * 0.25 * sm(np.abs(noise(len(s))) > 2.0, SR * 0.03) * 8
    return norm(s + g)
def grind(d):
    x = x_(d); n = bp(noise(len(x)), 150, 2500); am = 0.5 + 0.5 * (sm(noise(len(x)), SR * 0.02) > 0)
    return fade(norm(n * am), 0.2, 0.3)
def flaps(d, rate=9.0, birds=6):
    x = x_(d); s = np.zeros(len(x))
    for b in range(birds):
        ph = rng.random(); r = rate * (0.8 + rng.random() * 0.4); env = np.maximum(0, np.sin(2 * np.pi * (r * x + ph))) ** 6
        s += bp(noise(len(x)), 400, 3500) * env * (0.5 + rng.random() * 0.5)
    return fade(norm(s), 0.2, 0.3)
def chirp(n_=4):
    out_ = np.zeros(int(SR * (0.25 * n_ + 0.3)))
    for k in range(n_):
        x = x_(0.08 + rng.random() * 0.06); f0 = 2600 + rng.random() * 1800
        c = np.sin(2 * np.pi * np.cumsum(f0 + 1400 * np.sin(np.pi * x / x[-1])) / SR) * np.sin(np.pi * x / x[-1]) ** 2
        i = int(k * 0.22 * SR + rng.random() * 0.05 * SR); out_[i:i + len(c)] += c
    return out_ * 0.7
def whistle_fall(d):
    x = x_(d); f = 1800 * np.exp(-x * 0.9) + 300; s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25 + bp(noise(len(x)), 800, 4000) * 0.4
    return fade(s * np.minimum(x / 0.3, 1), 0.1, 0.05)
def thud(f0=70, g=1.0):
    x = x_(0.5); s = np.sin(2 * np.pi * np.cumsum(f0 - 35 * x) / SR) * np.exp(-x * 14) + bp(noise(len(x)), 100, 1500) * np.exp(-x * 40) * 0.8
    return s * g
def impact(f0=48, tail=1.8):
    x = x_(tail); f = f0 * (1.6 - 0.6 * np.minimum(x / 0.12, 1))
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 3.0) * 1.4 + bp(noise(len(x)), 80, 1800) * np.exp(-x * 30) * 2.5 + bp(noise(len(x)), 120, 900) * np.exp(-x * 4) * 0.3)
def whoosh(d=0.6):
    x = x_(d); k = x / d; n = noise(len(x)); env = np.sin(np.pi * k) ** 2
    return norm((bp(n, 300, 2500) * (1 - k) + bp(n, 1500, 7000) * k) * env)
def riser(d=2.0):
    x = x_(d); k = x / d; n = bp(noise(len(x)), 500, 6000) * k ** 2.2; tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2 * k)) / SR) * k ** 2.5 * 0.5
    return norm((n + tone) * (0.75 + 0.25 * np.sin(2 * np.pi * (4 + 10 * k) * x)))
def water(d):
    x = x_(d); n = bp(noise(len(x)), 200, 2500); am = 0.4 + 0.6 * sm(np.abs(noise(len(x))), SR * 0.15) ** 2
    return fade(norm(n * am), 0.4, 0.4)
def splash():
    x = x_(1.2); return norm(bp(noise(len(x)), 300, 6000) * np.exp(-x * 4) * np.minimum(x / 0.01, 1) + bp(noise(len(x)), 100, 800) * np.exp(-x * 8))
def projector(d):
    x = x_(d); clat = (np.sin(2 * np.pi * 24 * x) > 0.7).astype(float); s = bp(noise(len(x)), 1000, 5000) * sm(clat, 40) * 0.6 + np.sin(2 * np.pi * 120 * x) * 0.15
    return fade(norm(s), 0.3, 0.3)
def growl(d=1.8):
    x = x_(d); f = 75 + 25 * np.sin(np.pi * x / d); saw = 2 * ((np.cumsum(f) / SR) % 1) - 1
    am = 0.6 + 0.4 * sm(np.abs(noise(len(x))), SR * 0.03); s = bp(saw * am + noise(len(x)) * 0.3, 60, 1200)
    return fade(norm(s) * np.sin(np.pi * x / d) ** 0.5, 0.15, 0.3)
def ting(f=3200):
    x = x_(0.6); return (np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * f * 2.76 * x)) * np.exp(-x * 9) * 0.5
def hum(d, f=55, buzz=0.3):
    x = x_(d); s = np.sin(2 * np.pi * f * x) + 0.5 * np.sin(2 * np.pi * 2 * f * x) + buzz * np.sign(np.sin(2 * np.pi * f * x)) * 0.3
    return fade(norm(s * (0.85 + 0.15 * np.sin(2 * np.pi * 0.7 * x))), 0.3, 0.3)
def zap():
    x = x_(0.35); return norm(bp(noise(len(x)), 1500, 9000) * (np.sin(2 * np.pi * 50 * x) > 0) * np.exp(-x * 9))
def coins(n_=10, d=1.4):
    s = np.zeros(int(d * SR))
    for k in range(n_):
        t = ting(4200 + rng.random() * 2500) * (0.4 + rng.random() * 0.6); i = int(rng.random() * (len(s) - len(t))); s[i:i + len(t)] += t
    return s
def powerdown(d=1.6):
    x = x_(d); f = 220 * np.exp(-x * 2.2) + 20; return fade(norm(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))) * np.exp(-x * 1.2), 0.01, 0.2)
def cheer(d):
    x = x_(d); s = np.zeros(len(x))
    for v in range(14):
        f = 220 + rng.random() * 400; vib = np.sin(2 * np.pi * (5 + rng.random() * 3) * x) * 12
        ph = np.cumsum(f + vib + 80 * np.sin(2 * np.pi * (0.5 + rng.random()) * x)) / SR
        voice = np.sign(np.sin(2 * np.pi * ph)) * 0.4 + np.sin(2 * np.pi * ph * 2) * 0.3
        env = np.clip(sm(np.abs(noise(len(x))) > 0.6, SR * 0.25), 0, 1)
        s += bp(voice, 300, 3000) * env
    s += bp(noise(len(x)), 500, 5000) * 0.4
    return fade(norm(s), 0.3, 0.6)
def steps(d, rate=2.0, g=1.0):
    st = lib("footstep_one"); s = np.zeros(int(d * SR) + len(st))
    for k in range(int(d * rate)): i = int(k / rate * SR); s[i:i + len(st)] += st * (0.7 + 0.3 * rng.random())
    return s[: int(d * SR)] * g
def loop(name, d):
    a = lib(name); r = np.tile(a, int(np.ceil(d * SR / len(a))) + 1)[: int(d * SR)]; return fade(r, 0.3, 0.4)

# ---------------- feuille de bruitages (plan n° 1-70) ----------------
T = lambda i: START[i - 1] / FPS
DUR = lambda i: (END[i - 1] - START[i - 1]) / FPS
def amb(i, j, sig_fn, g, label, pan=0.0):
    d = T(j + 1) - T(i) if j < len(SH) else TOTAL / FPS - T(i)
    put(sig_fn(d + 0.4), T(i) - 0.2, g, pan)
    for k in range(i, j + 1): AMB.setdefault(k, []).append(label)
def fx(i, off, sig, g, label, pan=0.0): put(sig, T(i) + off, g, pan, label, i)

# ambiances (nappes continues sur des groupes de plans)
amb(1, 8, lambda d: loop("wind_city", d) * 0.8 + rumble(d, 0.5), 0.22, "vent de ville + grondement sourd du nuage")
amb(9, 18, lambda d: rumble(d, 0.5, (30, 200)), 0.18, "vent d'altitude, grondement du nuage")
amb(19, 20, lambda d: rumble(d, 0.4), 0.14, "terre, grondement lointain")
amb(21, 29, lambda d: hum(d, 60, 0.1) * 0.3 + bp(noise(int(d * SR)), 200, 3000) * 0.08, 0.18, "luxe souterrain : air climatisé, ronron discret")
amb(30, 31, lambda d: loop("drip", d) * 0.6 + hum(d, 50, 0.6) * 0.2, 0.22, "cave : goutte, ampoule qui grésille")
amb(32, 41, lambda d: loop("wind_city", d) * 0.7 + rumble(d, 0.8), 0.25, "vent + grondement du nuage, plus proche")
amb(42, 43, lambda d: rumble(d, 1.0, (20, 120)), 0.28, "grondement grave, impulsions")
amb(44, 47, lambda d: loop("hall_ambience", d) * 0.8 + loop("drip", d) * 0.4, 0.3, "tunnel : écho, gouttes")
amb(48, 56, lambda d: hum(d, 48, 0.5) * 0.5 + loop("elec_hum", d) * 0.5, 0.2, "bourdonnement électrique de la machine")
amb(57, 61, lambda d: rumble(d, 0.6, (20, 100)), 0.16, "après l'explosion : grave sourd")
amb(62, 64, lambda d: loop("wind_city", d) * 0.6 + rumble(d, 0.6), 0.2, "vent, nuage immobile")
amb(65, 69, lambda d: loop("wind_city", d) * 0.5, 0.16, "vent léger, ville au soleil")
amb(70, 70, lambda d: water(d) * 0.7, 0.2, "piscine souterraine : eau, échos")

fx(1, 0.2, thunder(4), 0.28, "tonnerre lointain")
fx(2, -0.3, whoosh(0.6), 0.25, "souffle de coupe"); fx(2, 0.2, rumble(1.8, 1, (20, 90)), 0.3, "grondement sous la terre")
fx(3, 0.3, lib("cloth_rustle"), 0.25, "froissement de vêtements")
fx(4, 0.0, hum(1.6, 50, 0.6), 0.12, "ampoule qui grésille"); fx(4, 0.3, lib("drip"), 0.3, "goutte")
fx(5, 0.2, riser(2.0), 0.18, "montée"); fx(5, 1.4, thunder(3.5), 0.42, "coup de tonnerre : le nuage apparaît")
fx(6, 0.0, rumble(3.2, 1, (30, 400)), 0.3, "bouillonnement du nuage"); fx(6, 1.6, crack(6, 1.2), 0.08, "crépitements électriques")
fx(7, 0.2, impact(40, 2.5), 0.3, "descente du nuage (grave)")
fx(8, 0.3, chirp(3), 0.12, "oiseaux, insouciance"); fx(8, 1.0, lib("crowd_breath")[: SR * 2], 0.15, "murmure des voisins")
fx(9, 0.0, jet(DUR(9) + 0.3), 0.32, "réacteurs de l'avion", -0.3)
fx(10, 0.0, jet(DUR(10)), 0.32, "réacteurs qui montent", 0.3); fx(10, DUR(10) - 0.5, whoosh(0.7), 0.35, "l'avion entre dans le nuage")
fx(11, 0.0, crack(16, DUR(11), 1.2), 0.32, "craquements de pierre"); fx(11, 0.0, grind(DUR(11)), 0.15, "roche qui se fige"); fx(11, 0.2, powerdown(1.5), 0.2, "réacteurs qui s'éteignent")
fx(12, 0.0, lib("glass_rattle"), 0.15, "vibration de cabine"); fx(12, 0.1, crack(4, 0.8), 0.15, "petits craquements")
fx(13, 0.0, grind(DUR(13)), 0.25, "la pierre monte sur le passager"); fx(13, 0.4, crack(6, 0.8), 0.22, "craquements")
fx(14, 0.0, flaps(DUR(14) + 0.2), 0.3, "battements d'ailes"); fx(14, 0.2, chirp(4), 0.2, "cris d'oiseaux")
fx(15, 0.0, flaps(DUR(15)), 0.22, "battements d'ailes"); fx(15, 0.5, thunder(2.5), 0.3, "le nuage gronde")
fx(16, 0.1, crack(10, DUR(16)), 0.32, "oiseaux pétrifiés : craquements")
fx(17, 0.0, whistle_fall(DUR(17)), 0.22, "sifflement de chute"); fx(17, DUR(17) - 0.35, thud(60), 0.4, "impacts au sol"); fx(17, DUR(17) - 0.15, thud(80), 0.3, None)
for k in range(5): fx(18, 0.3 + k * 0.7, thud(110, 0.5) + np.pad(ting(1800) * 0.4, (0, 0))[: int(0.5 * SR)], 0.3, "coups de pelle" if k == 0 else None)
fx(19, 0.1, lib("suit_rustle"), 0.3, "froissement de costume"); fx(19, 0.3, lib("sting_soft"), 0.18, "accent")
fx(20, 0.0, whoosh(1.0), 0.2, "descente"); fx(20, 0.3, rumble(1.6, 1, (20, 80)), 0.3, "grave profond")
fx(21, 0.0, water(DUR(21)), 0.18, "eau de la piscine")
fx(22, 0.0, water(DUR(22)), 0.25, "clapotis"); fx(22, 0.5, splash(), 0.22, "plongeon")
fx(23, 0.0, projector(DUR(23)), 0.22, "projecteur de cinéma")
fx(24, 0.2, growl(1.6), 0.35, "rugissement du lion"); fx(24, 0.1, chirp(2), 0.1, "oiseaux du zoo")
fx(25, 0.0, hum(DUR(25), 80, 0.0), 0.12, "ronron de la ville souterraine"); fx(25, 0.2, lib("crowd_breath")[: int(SR * DUR(25))], 0.12, "foule lointaine")
fx(26, 0.0, lib("crowd_breath")[: int(SR * DUR(26))], 0.22, "brouhaha du restaurant"); fx(26, 0.3, ting(3600), 0.25, "verres qui trinquent"); fx(26, 0.45, ting(4100), 0.2, None)
fx(27, 0.0, chirp(3), 0.18, "oiseaux du parc"); fx(27, 0.0, water(DUR(27)), 0.1, "étang")
fx(28, 0.0, hum(DUR(28) + 0.5, 220, 0.0) * 0.5 + riser(DUR(28) + 0.5) * 0.3, 0.2, "vibration lumineuse du soleil artificiel")
fx(29, 0.2, lib("heartbeat")[: int(SR * 2.5)], 0.18, "battements de cœur")
fx(30, 0.0, whoosh(1.2), 0.2, "zoom arrière (souffle)")
fx(31, 0.4, thunder(3), 0.3, "tonnerre")
fx(32, 0.0, rumble(DUR(32), 1, (25, 300)), 0.35, "le nuage approche")
fx(33, 0.0, lib("tower_groan"), 0.35, "gratte-ciel qui gémit"); fx(33, 0.8, thunder(3), 0.35, "tonnerre")
fx(34, 0.2, thunder(3.5), 0.35, "tonnerre sur les montagnes")
fx(35, 0.2, lib("siren_far"), 0.18, "sirène au loin"); fx(35, 0.0, impact(36, 2.5), 0.25, "grave")
fx(36, 0.0, lib("glass_rattle"), 0.3, "vitres qui tremblent"); fx(36, 0.3, lib("breath_nervous"), 0.22, "souffle inquiet")
fx(37, 0.3, lib("steel_door"), 0.4, "portes blindées qui se ferment"); fx(37, DUR(37) - 0.35, lib("door_slam_close"), 0.45, "claquement"); fx(37, DUR(37) - 0.1, lib("lock_click"), 0.35, "verrou")
fx(38, 0.0, loop("knock3", DUR(38)), 0.4, "coups contre la porte"); fx(38, 0.2, lib("door_slam_body"), 0.35, "on cogne"); fx(38, 0.0, lib("crowd_shuffle")[: int(SR * DUR(38))], 0.25, "foule qui supplie")
fx(39, 0.2, lib("sting_soft"), 0.25, "accent : refus")
fx(40, 0.1, lib("heart_fast")[: int(SR * 2)], 0.15, "cœur qui s'accélère")
for k in range(6): fx(41, 0.15 + k * 1.26, thud(45, 1.0), 0.45, "impulsions des générateurs" if k == 0 else None)
fx(41, 0.0, hum(DUR(41), 48, 0.8), 0.2, "générateurs qui démarrent")
fx(42, 0.0, rumble(DUR(42), 1, (20, 200)), 0.4, "nuage qui s'abat"); fx(42, 0.3, whoosh(1.0), 0.3, "souffle")
fx(43, 0.0, steps(DUR(43), 2.2), 0.5, "pas dans le tunnel"); fx(43, 0.4, lib("neon_flicker"), 0.2, "lampe qui grésille")
fx(44, 0.0, steps(DUR(44), 2.2, 0.6), 0.4, "pas lointains"); fx(44, 0.2, lib("metal_creak_far"), 0.25, "métal qui grince")
fx(45, 0.0, riser(DUR(45) + 0.3), 0.2, "montée : la lueur"); fx(45, 0.0, hum(DUR(45), 96, 0.2), 0.12, "bourdonnement")
fx(46, 0.0, lib("sting_hit"), 0.4, "accent : la machine"); fx(46, 0.0, hum(DUR(46), 48, 0.8), 0.3, "machine")
for k in range(4): fx(47, 0.3 + k * 0.8, zap(), 0.18, "arcs électriques dans les câbles" if k == 0 else None)
fx(48, 0.0, lib("vent_air")[: int(SR * DUR(48))], 0.3, "souffle des tours de refroidissement")
fx(49, 0.0, riser(DUR(49)), 0.2, "énergie qui monte"); fx(49, 0.0, hum(DUR(49), 110, 0.3), 0.15, "colonnes d'énergie")
fx(50, 0.0, loop("vent_air", DUR(50)), 0.35, "refroidissement : souffle puissant")
fx(51, 0.0, rumble(DUR(51), 1, (20, 160)), 0.35, "nuage aspiré vers le sol")
fx(52, 0.1, coins(12, DUR(52)), 0.3, "pièces d'or qui s'empilent")
for k in range(8): fx(53, 0.1 + k * 0.17, ting(5200) * 0.4, 0.2, "tic-tac de l'aiguille" if k == 0 else None)
fx(53, 0.6, lib("buzzer"), 0.22, "alarme de surcharge")
fx(54, 0.0, lib("heartbeat")[: int(SR * DUR(54))], 0.3, "cœur")
fx(55, 0.0, lib("handle_turn")[: int(SR * 0.8)], 0.3, "levier qu'on empoigne"); fx(55, DUR(55) * 0.45, thud(140, 1.0) + np.pad(lib("lock_click")[: int(SR * 0.5)], (0, 0))[: int(SR * 0.5)], 0.5, "clac du levier")
fx(56, 0.0, lib("boom_low"), 0.65, "explosion"); fx(56, 0.0, impact(38, 3.0), 0.55, None); fx(56, 0.15, crack(20, 1.5), 0.25, "débris, étincelles")
fx(57, 0.1, lib("lights_cascade"), 0.35, "lumières qui s'éteignent une à une"); fx(57, 0.0, powerdown(1.8), 0.35, "coupure de courant")
fx(58, 0.0, lib("metal_creak_far"), 0.3, "câble qui grince"); fx(58, DUR(58) * 0.4, thud(55, 1.0), 0.5, "l'ascenseur s'arrête net"); fx(58, DUR(58) * 0.45, lib("neon_flicker"), 0.25, "lumière qui clignote")
fx(59, 0.2, powerdown(2.0), 0.4, "le soleil artificiel s'éteint")
fx(60, 0.0, lib("siren_far"), 0.25, "alarme de secours"); fx(60, 0.3, lib("breath_nervous"), 0.25, "souffles paniqués")
fx(61, 0.2, rumble(DUR(61), 0.7), 0.25, "le nuage au-dessus")
fx(62, 0.2, riser(DUR(62)), 0.12, "lueur d'espoir")
fx(63, 0.0, impact(50, 1.5), 0.2, "le grondement s'arrête")
fx(64, 0.0, whoosh(DUR(64)), 0.25, "le nuage remonte"); fx(64, 0.4, lib("wind_city")[: int(SR * DUR(64))], 0.2, None)
fx(65, 0.4, chirp(5), 0.25, "oiseaux, ciel bleu")
fx(66, 0.0, steps(DUR(66), 2.5, 0.5), 0.3, "pas, sortie du bunker"); fx(66, 0.0, lib("crowd_shuffle")[: int(SR * DUR(66))], 0.18, "foule")
fx(67, 0.0, cheer(DUR(67) + 0.5), 0.3, "acclamations"); fx(67, 0.0, flaps(DUR(67), 5, 3), 0.08, "fanions au vent")
fx(68, 0.0, cheer(DUR(68)), 0.32, "foule joyeuse"); fx(68, 0.0, steps(DUR(68), 4, 0.5), 0.3, "pas de la foule")
fx(69, 0.3, chirp(5), 0.25, "oiseaux")
fx(70, 0.3, splash(), 0.3, "plongeon"); fx(70, 0.9, splash(), 0.22, "éclaboussures"); fx(70, 0.0, cheer(DUR(70)) * 0.5, 0.18, "rires, voix joyeuses")
for i in range(2, len(SH) + 1):        # petit souffle sur chaque coupe
    put(whoosh(0.35), T(i) - 0.2, 0.06)

# ---------------- mix ----------------
voice = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(D / "voix/voix_off.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
voice = voice[:N]; v = np.zeros(N); v[: len(voice)] = voice
env = np.sqrt(sm(v ** 2, SR * 0.2)); duck = 1 - 0.35 * np.clip(env / (env.max() * 0.3), 0, 1)   # bruitages un peu baissés sous la voix
sfx = out * duck
sfx = np.tanh(sfx * 1.2) / 1.2
mix = sfx + np.stack([v, v]) * 0.92
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95; sfx_n = sfx / peak * 0.95
def wav(a, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(p)], input=a.T.astype(np.float64).tobytes(), check=True)
n = int(TOTAL / FPS * SR); wav(mix[:, :n], D / "mix_raw.wav"); wav(sfx_n[:, :n], D / "sfx.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(D / "mix_raw.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "pcm_s16le", str(D / "mix.wav")], check=True)

# ---------------- fiches ----------------
def tc(f): return f"{f // (3600 * FPS):02d}:{f // (60 * FPS) % 60:02d}:{f // FPS % 60:02d}:{f % FPS:02d}"
FR = {"PE": "Plan d'ensemble", "PM": "Plan moyen", "PA": "Plan américain", "GP": "Gros plan", "TGP": "Très gros plan", "PL": "Plongée", "CPL": "Contre-plongée", "EP": "Plan épaule", "SUB": "Plan subjectif"}
MV = {"zoomIn": "Zoom avant", "zoomOut": "Zoom arrière", "truckL": "Travelling latéral gauche", "truckR": "Travelling latéral droite", "craneUp": "Montée verticale", "craneDown": "Descente verticale", "orbit": "Drone : orbite", "flyover": "Drone : survol", "dive": "Drone : plongée progressive"}
SET = {"town": "Ville (surface)", "coupe": "Coupe du sol", "sky": "Ciel / montagnes", "cabin": "Cabine de l'avion", "lux": "Bunkers de luxe", "machine": "Tunnel / machine"}
REFDESC = {1: "ville en plongée, nuage noir", 2: "coupe du sol, bunkers, câbles", 3: "famille devant la maison", 4: "cave sous la maison", 5: "avion, montagnes", 6: "avion pétrifié",
           7: "cabine, passagers en pierre", 8: "manoir, piscine", 9: "milliardaire (cinéma)", 10: "ville souterraine, soleil", 11: "milliardaire, soleil artificiel", 12: "machine, garçon de dos",
           13: "terrasse des riches", 14: "machine vue de dessus", 15: "coupe, câbles vers la machine", 16: "entrée « ouverte à tous », ciel bleu"}
def text(i):
    a, b = START[i] / FPS, END[i] / FPS
    return " ".join(w["w"] for w in W if a - 0.05 <= w["s"] < b - 0.05)
pl = ["# Le Nuage — liste des plans", "", f"{len(SH)} plans · {TOTAL} images · {tc(TOTAL)} · 30 i/s · 2160×3840 (TikTok 4K)", "",
      "| N° | Début | Fin | Durée | Type de plan | Mouvement de caméra | Décor | Réf. | Ce que la réf. apporte | Description |", "|---|---|---|---|---|---|---|---|---|---|"]
fa = ["# Le Nuage — fiche audio", "", "Voix off : Fish Audio, voix « Narrateur Expressif et Profond » (modèle s1), français. Musique : aucune (fournie plus tard par l'utilisateur) ; intensité musicale = 0 sur tous les plans.", "",
      "| N° | Début | Fin | Voix off | Bruitages | Ambiance | Musique |", "|---|---|---|---|---|---|---|"]
for i, s in enumerate(SH):
    d = (END[i] - START[i]) / FPS
    pl.append(f"| {i + 1} | {tc(START[i])} | {tc(END[i] - 1)} | {d:.2f} s | {FR[s['fr']]} | {MV[s['mv']]} | {SET[s['set']]} | {s['ref']} | {REFDESC[s['ref']]} | {s['desc']} |")
    fa.append(f"| {i + 1} | {tc(START[i])} | {tc(END[i] - 1)} | {text(i)} | {', '.join(x for x in CUES.get(i + 1, []) if x) or '—'} | {'; '.join(AMB.get(i + 1, [])) or '—'} | 0 (aucune) |")
(D / "plans.md").write_text("\n".join(pl) + "\n", encoding="utf-8"); (D / "fiche_audio.md").write_text("\n".join(fa) + "\n", encoding="utf-8")
json.dump({"start": START, "end": END, "total": TOTAL}, open(D / "cues.json", "w"))
print("ok", len(SH), "plans", TOTAL, "images", tc(TOTAL))
