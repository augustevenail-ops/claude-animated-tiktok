#!/usr/bin/env python3
"""[v4 : voix f7a979ab… (v9), sans sirènes ni cri, musique ×1,2 au niveau validé] « Le Monstre » ép. 1 : bruitages calés sur les plans (même découpage que studio/src/videos/monstre/story.ts),
mix voix > bruitages > musique du Nuage en boucle (plus basse, -6 dB). Sorties : mix.wav, sfx.wav, fiche_audio.md."""
import json, subprocess
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[3]; D = Path(__file__).parent; EP = D.parent
SR = 48000; FPS = 30
W = json.load(open(EP / "voix/v9/words_v9.json", encoding="utf-8"))
SW = [0, 7, 15, 24, 30, 45, 51, 60, 70, 72, 82, 91, 103, 113, 117, 124, 136, 139, 143, 145, 150, 157, 166, 173, 187, 195, 199, 208, 215, 226, 233, 240, 246, 253, 258, 266, 269, 277, 280, 287, 294, 300, 304, 309, 320, 326, 330, 333, 339, 345, 358, 366, 376, 381, 392, 398, 408, 412, 419, 426, 432, 435, 443]
last = [w for w in W if any(c.isalpha() for c in w["w"])][-1]
TOTAL = round((last["e"] + 1.3) * FPS); START = [0] + [round(W[i]["s"] * FPS) - 2 for i in SW[1:]]; END = START[1:] + [TOTAL]
N = int(TOTAL / FPS * SR) + SR; out = np.zeros((2, N)); rng = np.random.default_rng(7); CUES = []
def T(n, u=0.0): return (START[n - 1] + u * (END[n - 1] - START[n - 1])) / FPS
def lib(name): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(ROOT / f"productions/sfx_lib/{name}.mp3"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
def put(sig, t0, g=1.0, pan=0.0, label=None, shot=None):
    i = int(t0 * SR); sig = sig[: max(0, N - i)]
    if i < 0 or len(sig) == 0: return
    out[0, i:i + len(sig)] += sig * g * (1 - pan) ** 0.5; out[1, i:i + len(sig)] += sig * g * (1 + pan) ** 0.5
    if label: CUES.append((shot, round(t0, 2), label))
def x_(d): return np.arange(int(d * SR)) / SR
def sm(x, n): n = max(1, int(n)); return np.convolve(x, np.ones(n) / n, "same")
def lp(x, f): return sm(x, SR / f / 2)
def bp(x, lo, hi): return lp(x, hi) - lp(x, lo)
def norm(s, p=0.9): return s / (np.max(np.abs(s)) + 1e-9) * p
def fade(s, a=0.02, r=0.3):
    n = len(s); e = np.ones(n); A = int(a * SR); R = int(r * SR)
    if A: e[:A] = np.linspace(0, 1, A)
    if R: e[-R:] *= np.linspace(1, 0, R)
    return s * e
def thunder(d=4.0):
    t = x_(d); n = rng.standard_normal(len(t)); crack = bp(n, 300, 4000) * np.exp(-t * 9); roll = lp(n, 120) * (np.exp(-t * 0.8)) * (1 + 0.6 * np.sin(t * 7) ** 2)
    return fade(norm(crack * 0.5 + norm(roll) * 0.9), 0.005, 1.0)
def explosion(d=3.0):
    t = x_(d); n = rng.standard_normal(len(t)); body = lp(n, 90) * np.exp(-t * 1.6); hi = bp(n, 800, 6000) * np.exp(-t * 6); sub = np.sin(2 * np.pi * (45 - 10 * t) * t) * np.exp(-t * 2)
    return fade(norm(norm(body) + 0.5 * norm(hi) + 0.8 * sub), 0.002, 0.8)
def crackle(d=2.0, dens=40):
    s = np.zeros(int(d * SR))
    for _ in range(int(d * dens)): i = rng.integers(0, len(s) - 400); s[i:i + 300] += rng.standard_normal(300) * np.exp(-np.arange(300) / 40) * rng.uniform(0.2, 1)
    return fade(norm(bp(s, 600, 7000)), 0.01, 0.3)
def rain(d):
    n = rng.standard_normal(int(d * SR)); r = bp(n, 400, 9000) * 0.6 + lp(n, 300) * 0.4
    drops = np.zeros_like(n); idx = rng.integers(0, len(n) - 200, int(d * 60)); 
    for i in idx: drops[i:i + 150] += np.exp(-np.arange(150) / 25) * rng.uniform(0.3, 1)
    return norm(r) * 0.8 + norm(bp(drops * rng.standard_normal(len(n)), 1500, 8000)) * 0.4
def hum(d, f=55, buzz=0.3):
    t = x_(d); s = np.sin(2 * np.pi * f * t) + 0.5 * np.sin(2 * np.pi * 2 * f * t) + buzz * np.sign(np.sin(2 * np.pi * f * t)) * 0.3; return fade(norm(s), 0.3, 0.5)
def powerdown(d=1.6):
    t = x_(d); f = 120 * np.exp(-t * 1.8); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sign(np.sin(2 * np.pi * np.cumsum(f * 2) / SR)); return fade(norm(s * np.exp(-t * 0.8)), 0.005, 0.4)
def scream(d=2.2):
    t = x_(d); f = 380 + 120 * np.sin(t * 11) + 260 * np.exp(-t * 2); ph = 2 * np.pi * np.cumsum(f) / SR
    s = sum(np.sin(ph * k + rng.uniform(0, 6)) / k for k in range(1, 9)) * (1 + 0.5 * np.sin(t * 37)); n = bp(rng.standard_normal(len(t)), 900, 5000)
    return fade(norm(np.tanh(norm(s) * 2.5) * 0.8 + n * 0.3), 0.05, 0.7)
def whoosh(d=0.5):
    t = x_(d); return fade(norm(bp(rng.standard_normal(len(t)), 300, 3000)) * np.sin(np.pi * t / d) ** 2, 0.0, 0.05)
def engine(d):
    t = x_(d); s = np.sin(2 * np.pi * 38 * t) + 0.5 * np.sign(np.sin(2 * np.pi * 76 * t)) * 0.3 + 0.3 * lp(rng.standard_normal(len(t)), 200); return fade(norm(s), 0.5, 0.6)
def siren(d):
    t = x_(d); f = 760 + 320 * np.sign(np.sin(2 * np.pi * 1.4 * t)); return fade(norm(np.sin(2 * np.pi * np.cumsum(f) / SR)), 0.4, 0.8)
def clink(n=5):
    s = np.zeros(int(1.6 * SR))
    for k in range(n): i = int((0.1 + k * 0.22 + rng.uniform(0, 0.05)) * SR); tt = np.arange(4000) / SR; s[i:i + 4000] += np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 60) * (1 - k / n)
    return norm(s)
def F(shot, u, sig, g, label, pan=0.0): put(sig, T(shot, u), g, pan, label, shot)
dur = TOTAL / FPS
# ambiances
put(fade(norm(lib("wind_city")), 1, 2)[: N], 0, 0.18); amb = hum(T(35) - 0.2, 50, 0.4); put(amb, 0, 0.05)
F(3, 0.45, lib("neon_flicker"), 0.35, "grésillement du projecteur")
for k in range(6): F(10, 0.1 + k * 0.12, lib("light_on"), 0.35, "allumage d'une tour" if k == 0 else None, (k - 2.5) / 3)
F(11, 0.0, hum(2.5, 60, 0.6), 0.12, "ronron du générateur")
F(16, 0.0, lib("light_on"), 0.2, "clic de la lampe")
F(18, 0.0, lib("beep_ok"), 0.2, "notification du téléphone")
F(19, 0.12, explosion(), 0.95, "explosion du projecteur"); F(19, 0.15, crackle(2.5), 0.4, "étincelles")
F(20, 0.0, crackle(2.0, 25), 0.3, "feu qui crépite"); F(21, 0.0, crackle(1.5, 15), 0.18, None)
F(23, 0.0, lib("pa_static"), 0.4, "grésillement radio"); F(24, 0.0, lib("pa_static"), 0.25, None); F(24, 0.2, lib("neon_flicker"), 0.3, "lumières qui vacillent")
F(26, 0.0, lib("vent_air"), 0.35, "sifflement de surchauffe"); F(28, 0.0, lib("pa_click"), 0.3, "clic radio")
F(31, 0.3, lib("cloth_rustle"), 0.25, "les gardes lèvent les lampes")
F(34, 0.32, lib("lock_click"), 0.9, "« clic » du levier"); F(34, 0.45, powerdown(), 0.5, "coupure du générateur")
F(35, 0.05, lib("lights_cascade"), 0.5, "la ville s'éteint"); F(35, 0.0, lib("boom_low"), 0.4, None)
F(38, 0.0, lib("metal_creak_far"), 0.3, "grincement du monstre figé")
F(40, 0.3, thunder(), 1.0, "coup de tonnerre")
put(fade(rain(dur - T(41)), 0.6, 1.5), T(41), 0.3, 0, "pluie torrentielle (jusqu'à la fin)", 41)
F(42, 0.2, lib("struggle"), 0.4, "le garde glisse"); F(42, 0.55, lib("boom_low"), 0.3, "chute")
F(43, 0.0, clink(), 0.35, "la lampe roule"); F(44, 0.55, lib("light_off"), 0.6, "les phares s'éteignent")
F(46, 0.0, lib("run_steps_room"), 0.35, "gardes qui courent"); F(48, 0.4, lib("footstep_one"), 0.6, "trébuche"); F(48, 0.5, lib("cloth_rustle"), 0.4, None)
F(49, 0.6, clink(3), 0.5, "la lampe tombe")
F(50, 0.2, lib("light_off"), 0.6, "obscurité"); F(50, 0.75, thunder(3), 0.7, "tonnerre"); F(50, 0.0, lib("heart_fast"), 0.4, "cœur")
F(52, 0.0, lib("lights_cascade"), 0.45, "les lumières se rallument")
F(55, 0.0, lib("sting_hit"), 0.6, "choc : il est juste devant"); F(56, 0.0, lib("struggle"), 0.35, "le garde se débat"); F(57, 0.2, lib("gasp_teen"), 0.4, "souffle du garde")
F(59, 0.2, lib("cloth_rustle"), 0.5, "papa saisit le bras"); F(63, 0.86, lib("neon_flicker"), 0.5, "un faisceau grésille"); F(63, 0.9, lib("sting_soft"), 0.5, "fin")
for i in range(2, len(START) + 1): put(whoosh(0.35), T(i) - 0.2, 0.05)
# mix
voice = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(EP / "voix/voix_off_v9.wav"), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
v = np.zeros(N); v[: min(N, len(voice))] = voice[:N]
env = np.sqrt(sm(v ** 2, SR * 0.2)); duck = 1 - 0.35 * np.clip(env / (env.max() * 0.3), 0, 1)
sfx = np.tanh(out * duck * 1.2) / 1.2
mus = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(ROOT / "productions/bunker/musique/musique.wav"), "-af", "atempo=1.2", "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64).reshape(-1, 2).T
xf = int(0.4 * SR); Lm = mus.shape[1]; step = Lm - xf; music = np.zeros((2, N + Lm)); ramp = np.linspace(0, 1, xf)
for k, i in enumerate(range(0, N, step)):
    seg = mus.copy()
    if k > 0: seg[:, :xf] *= ramp
    seg[:, Lm - xf:] *= ramp[::-1]; music[:, i:i + Lm] += seg
music = music[:, :N]; music /= (np.sqrt(np.mean(music ** 2)) + 1e-9)
vrms = np.sqrt(np.mean(v[np.abs(v) > 0.02 * np.abs(v).max()] ** 2)) * 0.92  # musique au rapport validé (0,157 de la voix)
music = music * (1 - 0.2 * np.clip(env / (env.max() * 0.3), 0, 1)) * 0.1569 * vrms * np.clip((dur - np.arange(N) / SR) / 1.5, 0, 1)
mix = sfx + music + np.stack([v, v]) * 0.92
peak = np.max(np.abs(mix)); mix = mix / peak * 0.95
def wav(a, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", "-c:a", "pcm_s16le", str(p)], input=a.T.astype(np.float64).tobytes(), check=True)
n = int(TOTAL / FPS * SR); wav(mix[:, :n], D / "v4_mix_raw.wav"); wav((sfx / peak * 0.95)[:, :n], D / "v4_sfx.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(D / "v4_mix_raw.wav"), "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", "48000", "-c:a", "pcm_s16le", str(D / "v4_mix.wav")], check=True)
with open(D / "v4_fiche_audio.md", "w", encoding="utf-8") as f:
    f.write("# Le Monstre ép. 1 — fiche audio\n\nVoix off : Fish Audio (narrateur). Musique : celle du Nuage en boucle, -6 dB par rapport au Nuage. Mix : voix > bruitages > musique, -14 LUFS.\n\n| Plan | Temps (s) | Bruitage |\n|---|---|---|\n")
    for s, t, l in sorted(c for c in CUES if c[2]): f.write(f"| {s} | {t} | {l} |\n")
print("ok", TOTAL, round(dur, 2), len(CUES))
