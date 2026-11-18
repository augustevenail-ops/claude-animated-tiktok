# Bande son de « La Couronne » ép. 1 (voix v11 + ambiances + bruitages + musique douce), modèle tools/mur_mix.py (docs/audio.md).
# Hiérarchie : voix > bruitages > ambiances > musique ; -15 LUFS. Tout est calé sur les plans de plans_ep01.json (plan 6/7 à 11,6 s,
# plans 20+21 en une prise) et sur les mots de voix_v9/mots_v11.json.  Usage : python3 son/couronne_mix.py  -> son/mix.wav, son/mix_ecoute.mp3
import json, os, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); EP = os.path.join(HERE, ".."); ROOT = os.path.join(EP, "..", "..")
sys.path.insert(0, os.path.join(ROOT, "tools"))
from sound_kit import Kit

SR = 48000; DUR = 72.6; N = int(DUR * SR); LIB = os.path.join(ROOT, "productions", "sfx_lib")
db = lambda v: 10 ** (v / 20)
dec = lambda p: np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(float)
words = json.load(open(os.path.join(EP, "voix_v9", "mots_v11.json"), encoding="utf-8"))
W = lambda i: words[i]["s"]
v = dec(os.path.join(EP, "voix_v9", "voix_complete_v11.mp3")); voice = np.zeros(N); voice[: min(N, len(v))] = v[:N]
sp = np.zeros(N, bool)
for w in words: sp[int(w["s"] * SR):min(N, int(w["e"] * SR))] = True
rms = lambda x: 20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-12); vref = rms(voice[sp])
rng = np.random.default_rng(2026)

# ---------- outils
L = np.zeros(N); R = np.zeros(N)                     # bus bruitages + ambiances (stéréo)
def fft_filt(x, lo, hi, slope=0.15):
    """passe-bande doux dans le domaine fréquentiel (bords en cosinus, largeur relative slope)"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo > 0: m *= np.clip((np.log2(np.maximum(f, 1) / lo) / slope + 1) / 2, 0, 1)
    if hi < SR / 2: m *= np.clip((np.log2(hi / np.maximum(f, 1)) / slope + 1) / 2, 0, 1)
    return np.fft.irfft(X * m, len(x))
def smooth_rand(n, rate, seed):                       # courbe aléatoire lisse (0..1), rate = changements / s
    r = np.random.default_rng(seed); k = max(2, int(n / SR * rate) + 2); pts = r.random(k)
    return np.interp(np.linspace(0, k - 1, n), np.arange(k), pts)
def reverb(x, d=1.2, wet=0.35, seed=1):
    r = np.random.default_rng(seed); m = int(d * SR); ir = r.standard_normal(m) * np.exp(-np.arange(m) / SR * 6.9 / d)
    ir = fft_filt(ir, 150, 5000); ir /= np.sqrt(np.sum(ir ** 2)); n = len(x) + m; F = 1 << (n - 1).bit_length()
    y = np.fft.irfft(np.fft.rfft(x, F) * np.fft.rfft(ir, F), F)[: len(x) + m]
    return np.concatenate([x, np.zeros(m)]) * (1 - wet) + y * wet
def put(x, t0, g_db, fade=0.0, pan=0.0, ref=None):
    """pose x à t0, niveau = vref + g_db (RMS des parties actives), pan -1..1 ; x (2,n) = déjà stéréo"""
    st = x.ndim == 2; mono = x[0] if st else x; a = np.abs(mono) > 1e-6
    if not a.any(): return
    k = db(vref + g_db - (ref if ref is not None else rms(mono[a])))
    xs = (x if st else np.stack([x * np.sqrt((1 - pan) / 2) * 1.414, x * np.sqrt((1 + pan) / 2) * 1.414])) * k
    xs = xs.copy(); f = min(xs.shape[1] // 2, int(fade * SR))
    if f: xs[:, :f] *= np.linspace(0, 1, f); xs[:, -f:] *= np.linspace(1, 0, f)
    i = int(t0 * SR); j = min(N, i + xs.shape[1])
    if i < 0: xs = xs[:, -i:]; i = 0
    if i < N: L[i:j] += xs[0, : j - i]; R[i:j] += xs[1, : j - i]
_c = {}
def smp(name):
    if name not in _c: _c[name] = dec(os.path.join(LIB, name + ".mp3"))
    return _c[name]
def cue(name, t0, g_db, dur=None, pan=0.0, fade=0.0, rate=1.0):
    x = smp(name)
    if rate != 1.0: x = np.interp(np.arange(0, len(x) - 1, rate), np.arange(len(x)), x)
    if dur is not None: x = x[: int(dur * SR)]
    put(x, t0, g_db, fade, pan)
def loop(name, t0, t1, g_db, fade=0.6, seed=0, lo=0, hi=SR / 2):
    """nappe stéréo bouclée à partir d'un échantillon court (morceaux pris au hasard, fondus enchaînés, gauche ≠ droite)"""
    x = smp(name); n = int((t1 - t0) * SR); r = np.random.default_rng(seed); out = np.zeros((2, n)); xf = int(0.5 * SR)
    for ch in range(2):
        p = 0
        while p < n:
            seg = min(len(x) - xf - 1, int(2.5 * SR)); s0 = r.integers(0, max(1, len(x) - seg)); y = x[s0:s0 + seg].copy()
            y[:xf] *= np.linspace(0, 1, xf); y[-xf:] *= np.linspace(1, 0, xf); j = min(n, p + len(y)); out[ch, p:j] += y[: j - p]; p += len(y) - xf
        if lo > 0 or hi < SR / 2: out[ch] = fft_filt(out[ch], lo, hi)
    put(out, t0, g_db, fade)
def bed(t0, t1, lo, hi, g_db, am=0.4, rate=0.4, seed=0, fade=0.8):
    """nappe de bruit filtré stéréo, respirant lentement (am = profondeur de modulation)"""
    n = int((t1 - t0) * SR); out = np.zeros((2, n))
    for ch in range(2):
        r = np.random.default_rng(seed * 7 + ch); out[ch] = fft_filt(r.standard_normal(n), lo, hi) * (1 - am + am * smooth_rand(n, rate, seed * 7 + ch + 50))
    put(out, t0, g_db, fade)
k = Kit(N, SR, seed=7)

# ---------- plans (secondes) : coupes et repères
CUTS = [0.1, 0.52, 2.453, 4.813, 6.753, 9.473, 11.6, 14.313, 18.453, 21.753, 24.333, 25.973, 28.553, 30.353, 31.533, 32.753, 35.773,
        37.353, 39.373, 41.633, 46.313, 48.413, 49.813, 51.553, 54.113, 56.233, 59.813, 62.013, 64.033, 66.293, 68.993]
HIT = 0.52; FALL0 = 0.62; LAND = 1.22; FREEZE = 4.813 + 0.85

# ---------- synthèses
def wind(t0, t1, g_db, lo=120, hi=1400, gust=0.6, seed=0, fade=1.0):
    """vent : souffle grave + sifflement plus aigu qui monte avec les rafales"""
    n = int((t1 - t0) * SR); out = np.zeros((2, n))
    for ch in range(2):
        r = np.random.default_rng(seed * 11 + ch); gs = smooth_rand(n, 0.7, seed * 11 + ch + 3) ** 1.5
        base = fft_filt(r.standard_normal(n), lo, hi); whis = fft_filt(r.standard_normal(n), hi * 0.9, hi * 2.2, 0.08)
        out[ch] = base * (1 - gust + gust * gs) + whis * 0.5 * gs ** 2
    put(out, t0, g_db, fade)
def alarm(t0, t1, g_db, per=2.4):
    """alarme d'abri, lente et longue (pas une sirène de police) : son qui monte doucement puis retombe, lointain, réverbéré"""
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; ph = (t % per) / per
    f = 330 + 290 * np.where(ph < 0.7, np.sin(np.pi / 2 * ph / 0.7), np.cos(np.pi / 2 * np.clip((ph - 0.7) / 0.3, 0, 1)) ** 0.7)
    p = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(p) + 0.45 * np.sin(2 * p + 0.3) + 0.25 * np.sin(3 * p) + 0.12 * np.sin(5 * p)
    env = 0.55 + 0.45 * np.sin(np.pi * np.clip(ph / 0.95, 0, 1)); x = fft_filt(x * env, 200, 2600)
    y = reverb(x, 1.8, 0.55, 3); y2 = reverb(np.roll(x, int(0.013 * SR)), 1.8, 0.55, 4)
    st = np.stack([y, y2]); put(st, t0, g_db, 0.5)
    return st
def zap(t0, g_db):
    """choc de l'oiseau sur le champ : claquement électrique + crépitement + son qui chute"""
    d = 0.9; n = int(d * SR); t = np.arange(n) / SR; r = np.random.default_rng(5)
    crack = fft_filt(r.standard_normal(n), 1500, 12000) * np.exp(-t / 0.03)
    buzz = np.sign(np.sin(2 * np.pi * 110 * t)) * fft_filt(r.standard_normal(n), 800, 6000) * np.exp(-t / 0.18) * (r.random(n) > 0.6)
    fall = np.sin(2 * np.pi * np.cumsum(2200 * np.exp(-t * 6) + 180) / SR) * np.exp(-t / 0.25) * 0.5
    put(crack * 2 + buzz + fall, t0, g_db, 0.0)
def shimmer(t0, g_db, d=1.6, base=1760):
    """onde de triangles qui s'allument : petites notes cristallines en cascade"""
    n = int(d * SR); x = np.zeros(n); r = np.random.default_rng(9)
    for e in range(14):
        i = int(e * 0.05 * SR + r.random() * 0.02 * SR); m = n - i; tt = np.arange(m) / SR; f = base * 2 ** (r.integers(0, 12) / 12)
        x[i:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt / (0.25 + 0.3 * r.random())) * (1 - e / 18)
    put(reverb(x, 1.0, 0.4, 7), t0, g_db, 0.0, pan=0.0)
def air_fall(t0, t1, g_db):
    """chute : souffle d'air qui s'ouvre (vitesse qui augmente)"""
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; kk = t / t[-1]; r = np.random.default_rng(12)
    lo = fft_filt(r.standard_normal(n), 300, 1500); hi = fft_filt(r.standard_normal(n), 1500, 6000)
    put((lo * (1 - kk) + hi * kk) * kk ** 1.4, t0, g_db, 0.02)
def geiger(t0, t1, g_db, rate=7.0, seed=0):
    """compteur de radiations : cliquetis irréguliers (rafales)"""
    n = int((t1 - t0) * SR); x = np.zeros(n); r = np.random.default_rng(seed); t = 0.0
    dens = smooth_rand(n, 1.2, seed + 1)
    while t < t1 - t0 - 0.01:
        i = int(t * SR); m = int(0.0025 * SR); x[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (0.0004 * SR)) * (0.6 + 0.4 * r.random())
        t += r.exponential(1 / (rate * (0.3 + 1.7 * dens[min(i, n - 1)])))
    put(fft_filt(x, 1200, 9000), t0, g_db, 0.2, pan=0.25, ref=None)
def field_hum(t0, t1, g_db, f0=55.0, glide=None, seed=0):
    """bourdonnement du champ magnétique : grave, battements lents, petite friture ; glide = (t, f_fin, durée) : baisse d'énergie"""
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; f = np.full(n, f0)
    if glide:
        a, f1, d = glide; kk = np.clip((t - (a - t0)) / d, 0, 1); f = f0 + (f1 - f0) * kk * kk * (3 - 2 * kk)
    p = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(p) + 0.6 * np.sin(2 * p * 1.003) + 0.35 * np.sin(3 * p) + 0.2 * np.sin(4 * p * 0.998)
    x *= 0.8 + 0.2 * np.sin(2 * np.pi * 0.23 * t)
    x += fft_filt(np.random.default_rng(seed).standard_normal(n), 2000, 7000) * 0.08 * (0.5 + smooth_rand(n, 2, seed))
    if glide: x *= 1 - 0.6 * np.clip((t - (glide[0] - t0)) / glide[2], 0, 1)
    put(np.stack([x, np.roll(x, int(0.007 * SR))]), t0, g_db, 1.0)
def holo(t0, t1, g_db, seed=0, down=False):
    """hologramme : nappe cristalline + petits bips de données ; down = le champ se rétracte (le son descend)"""
    n = int((t1 - t0) * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed); kk = t / t[-1]
    fm = (1 - 0.35 * kk ** 1.5) if down else 1.0
    x = sum(np.sin(2 * np.pi * np.cumsum(np.full(n, f) * fm) / SR + r.random() * 6) * a for f, a in [(880, 0.5), (1318.5, 0.35), (1764, 0.25), (2637, 0.12)])
    x *= 0.6 + 0.4 * smooth_rand(n, 3, seed)
    tt = 0.2
    while tt < t1 - t0 - 0.2:
        m = int(0.05 * SR); i = int(tt * SR); f = 2000 + 1800 * r.random(); x[i:i + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.hanning(m) * 1.4
        tt += 0.12 + 0.5 * r.random()
    put(np.stack([x, np.roll(x, int(0.011 * SR))]), t0, g_db, 0.5)
def powerdown(t0, d, g_db, f0=420, f1=38):
    """l'énergie qui baisse : générateur qui ralentit"""
    n = int(d * SR); t = np.arange(n) / SR; kk = t / d; f = f1 + (f0 - f1) * (1 - kk) ** 2
    p = 2 * np.pi * np.cumsum(f) / SR; x = (np.sin(p) + 0.4 * np.sin(2 * p) + 0.2 * np.sin(3 * p)) * (1 - kk) ** 0.6
    put(reverb(x, 1.2, 0.35, 11)[: n + int(0.6 * SR)], t0, g_db, 0.05)
def paper(t0, d, g_db, dens=140, seed=0):
    """papier qu'on manipule / déplie : craquements fins et froissements"""
    n = int(d * SR); x = np.zeros(n); r = np.random.default_rng(seed); env = np.sin(np.pi * np.arange(n) / n) ** 0.5
    for _ in range(int(d * dens)):
        m = int((0.003 + 0.02 * r.random()) * SR); i = r.integers(0, max(1, n - m))
        x[i:i + m] += r.standard_normal(m) * np.exp(-np.arange(m) / (m / 3)) * r.random() ** 2
    put(fft_filt(x, 900, 9000) * env, t0, g_db, 0.02)
def clock(t0, t1, g_db, per=1.0):
    """horloge de la pièce (tic, tac)"""
    n = int((t1 - t0) * SR); x = np.zeros(n); e = 0
    for tt in np.arange(0.07, t1 - t0, per / 2):
        m = int(0.012 * SR); i = int(tt * SR); f = 3200 if e % 2 else 2500
        if i + m < n: x[i:i + m] += np.sin(2 * np.pi * f * np.arange(m) / SR) * np.exp(-np.arange(m) / (0.0018 * SR)) * (1 if e % 2 else 0.8)
        e += 1
    put(reverb(x, 0.5, 0.3, 13)[:n], t0, g_db, 0.1, pan=-0.35)
def babble(t0, t1, g_db, voices=14, seed=0, stop=None):
    """foule qui murmure (syllabes de bruit formantique) ; stop = instant où tout le monde se fige"""
    n = int((t1 - t0) * SR); out = np.zeros((2, n)); r = np.random.default_rng(seed); t = np.arange(n) / SR
    for vv in range(voices):
        f1 = 350 + 400 * r.random(); x = fft_filt(r.standard_normal(n), f1, f1 * (2.2 + r.random()), 0.3)
        syl = smooth_rand(n, 4 + 3 * r.random(), seed * 31 + vv) ** 3 * (smooth_rand(n, 0.4, seed * 31 + vv + 99) > 0.35)
        pan = r.random(); out[0] += x * syl * (1 - pan) ** 0.5; out[1] += x * syl * pan ** 0.5
    if stop is not None: out *= np.clip((stop - t0 - t) / 0.08, 0, 1)
    put(out, t0, g_db, 0.6)
def steps(t0, t1, dt, g_db, pan=0.0, seed=0, rate=1.0):
    t = t0; r = np.random.default_rng(seed); e = 0
    while t < t1:
        cue("footstep_one", t, g_db + (1.2 if e % 2 else 0) - 2 * r.random(), pan=pan + 0.1 * (r.random() - 0.5), rate=rate * (0.92 + 0.16 * r.random()))
        t += dt * (0.9 + 0.2 * r.random()); e += 1
def crowd_steps(t0, t1, g_db, stop, seed=0):
    """foule qui marche (beaucoup de pas désordonnés), coupée net au gel"""
    n = int((t1 - t0) * SR); x = np.zeros((2, n)); r = np.random.default_rng(seed); fs = smp("footstep_one")
    for _ in range(int((stop - t0) * 22)):
        tt = r.random() * (stop - t0 - 0.05); i = int(tt * SR); y = np.interp(np.arange(0, len(fs) - 1, 0.85 + 0.35 * r.random()), np.arange(len(fs)), fs)
        y = fft_filt(y, 80, 3000 + 4000 * r.random()) * (0.3 + 0.7 * r.random()); j = min(n, i + len(y)); p = r.random()
        x[0, i:j] += y[: j - i] * (1 - p) ** 0.5; x[1, i:j] += y[: j - i] * p ** 0.5
    x[:, int((stop - t0) * SR):] *= 0.0
    put(x, t0, g_db, 0.05)
def chirps(t0, t1, g_db, seed=0, rate=1.2):
    """quelques oiseaux du matin, loin (sous le dôme)"""
    n = int((t1 - t0) * SR); x = np.zeros(n); r = np.random.default_rng(seed); tt = 0.2
    while tt < t1 - t0 - 0.4:
        for q in range(r.integers(2, 5)):
            m = int(0.07 * SR); i = int((tt + q * 0.1) * SR); u = np.arange(m) / m; f = 3600 + 1400 * r.random()
            if i + m < n: x[i:i + m] += np.sin(2 * np.pi * np.cumsum(f * (1 + 0.35 * np.sin(np.pi * u))) / SR) * np.hanning(m)
        tt += r.exponential(1 / rate) + 0.4
    put(reverb(x, 0.9, 0.5, 17)[:n], t0, g_db, 0.3, pan=0.4)
def clank(t0, g_db, pan=0.0, seed=0):
    """choc métallique lointain dans le district"""
    d = 1.6; n = int(d * SR); t = np.arange(n) / SR; r = np.random.default_rng(seed)
    x = sum(np.sin(2 * np.pi * f * t) * np.exp(-t / (0.2 + 0.3 * r.random())) for f in (180 + 60 * r.random(), 470 + 80 * r.random(), 1130 + 200 * r.random()))
    x += fft_filt(r.standard_normal(n), 200, 3000) * np.exp(-t / 0.02) * 2
    put(reverb(fft_filt(x, 100, 2500), 1.5, 0.6, seed + 20), t0, g_db, 0.0, pan)
def heartbeat(t0, t1, bpm, g_db, bpm1=None):
    t = t0
    while t < t1:
        k.thud(t, 0.55, 58); k.thud(t + 0.17, 0.4, 52)
        b = bpm if bpm1 is None else bpm + (bpm1 - bpm) * (t - t0) / (t1 - t0); t += 60 / b
def tiin(t0, g_db=-17, d=2.4, f=1568.0):
    n = int(d * SR); t = np.arange(n) / SR
    env = np.minimum(t / 0.04, 1) * np.exp(-t / (d * 0.45)) * np.minimum(1, (d - t) / 0.4)
    x = (np.sin(2 * np.pi * f * t) + 0.7 * np.sin(2 * np.pi * f * 1.0595 * t + 1) + 0.25 * np.sin(2 * np.pi * f * 2.01 * t)) * env * (1 + 0.25 * np.sin(2 * np.pi * 5.5 * t))
    put(x, t0, g_db, 0.0)
def pulse(t0, t1, r0, r1, g_db):
    t = t0; x = np.zeros(int((t1 - t0) * SR) + SR)
    while t < t1:
        m = int(0.22 * SR); tt = np.arange(m) / SR; i = int((t - t0) * SR)
        x[i:i + m] += np.sin(2 * np.pi * (52 - 18 * tt) * tt) * np.exp(-tt / 0.06)
        t += 1 / (r0 + (r1 - r0) * (t - t0) / max(1e-3, t1 - t0))
    put(x, t0, g_db, 0.05)
def pa_voice(t0, t1, g_db, seed=0):
    """annonce lointaine d'un haut-parleur de district (voix inintelligible, filtrée, réverbérée)"""
    n = int((t1 - t0) * SR); r = np.random.default_rng(seed); x = fft_filt(r.standard_normal(n), 500, 2200, 0.25)
    syl = smooth_rand(n, 6, seed) ** 4 * (smooth_rand(n, 0.8, seed + 5) > 0.3)
    put(reverb(x * syl, 2.2, 0.75, seed + 40)[:n], t0, g_db, 0.4, pan=-0.5)

# ================= bande son v2 (retour utilisateur : tout beaucoup plus bas, peu de sons mais chacun motivé par l'image,
# plus de « tiin » ni de pulsations stressantes ; une petite musique de fond ; un souffle de vent sur chaque règle)
def swell(t0, d=1.5, g_db=-20, seed=0):
    """souffle de vent qui part doucement, monte fort et redescend vite (annonce d'une règle)"""
    n = int(d * SR); t = np.arange(n) / SR; u = t / d; r = np.random.default_rng(seed)
    env = np.where(u < 0.6, (u / 0.6) ** 2, np.cos(np.pi / 2 * np.clip((u - 0.6) / 0.4, 0, 1)) ** 1.5)
    st = np.stack([fft_filt(r.standard_normal(n), 180, 1600) + 0.35 * fft_filt(r.standard_normal(n), 1600, 4200) for _ in range(2)]) * env
    put(st, t0, g_db, 0.0)
def thump(t0, g_db, f0=62, d=0.5):
    """coup sourd doux"""
    n = int(d * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * np.cumsum(f0 * (1.4 - 0.4 * np.minimum(t / 0.08, 1))) / SR) * np.exp(-t / 0.09) + fft_filt(rng.standard_normal(n), 100, 1200) * np.exp(-t / 0.012) * 0.5
    put(x, t0, g_db, 0.0)
def tick(t0, g_db):
    """tic de compteur (déclic mécanique net)"""
    n = int(0.09 * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2600 * t) * np.exp(-t / 0.004) + 0.6 * np.sin(2 * np.pi * 900 * t) * np.exp(-t / 0.012) + fft_filt(rng.standard_normal(n), 2000, 9000) * np.exp(-t / 0.002)
    put(reverb(x, 0.4, 0.25, 51)[:n + SR // 4], t0, g_db, 0.0)
# 2 : l'oiseau touche le dôme (petit claquement électrique), tombe, touche le sol
zap(HIT, -24); thump(LAND, -24)
# 2-4 : alarme lente, lointaine, sous la voix ; elle s'éloigne pendant le recul du plan 5
alarm(FALL0 + 0.05, 8.6, -33)
# 3 : le compteur passe de 72:00 à 71:59
tick(2.453 + 0.55, -19)
# 4 : la foule marche puis se fige d'un coup (les pas s'arrêtent net)
crowd_steps(4.813, 5.8, -30, FREEZE, seed=5)
# 5 et 10 : dehors, le vent de l'air irradié
wind(7.6, 9.6, -33, 150, 1300, 0.6, seed=7, fade=1.2)
wind(21.6, 24.5, -29, 120, 1300, 0.7, seed=17); geiger(22.3, 24.3, -33, 5.0, seed=19)
# 7 : « plus assez d'énergie » : les lumières s'éteignent
powerdown(W(43) - 0.1, 2.0, -28)
for e, tt in enumerate([12.6, 13.1, 13.6]): cue("light_off", tt, -30 - 2 * e)
# 8 : hologramme de la carte (léger bourdonnement)
holo(14.3, 18.45, -35, seed=13)
# 9 / 20-21 : annonce des règles : souffle de vent 1,5 s
swell(W(63) - 0.45, 1.5, -21, seed=61); swell(W(138) - 0.45, 1.5, -21, seed=62)
# 12 : il ouvre le dossier ; 14 : les bottes des gardes ; 16 : il te donne la feuille
paper(27.6, 0.8, -27, seed=22)
steps(30.45, 32.6, 0.45, -30, seed=26, rate=0.85)
paper(32.85, 0.6, -28, seed=27)
# 22 : la caméra passe par-dessus le mur
wind(46.3, 48.4, -29, 150, 1600, 0.6, seed=33, fade=0.7)
# 23 : tu déplies la feuille
paper(48.6, 1.0, -24, dens=180, seed=35)
# 26 : la radio du Conseil (carillon + légère friture)
cue("pa_chime", 54.12, -27); loop("pa_static", 54.5, 56.2, -38, seed=37, lo=600, hi=5000)
# 27 : le champ se rétracte sur le centre
powerdown(57.3, 2.4, -30, 300, 30)
# 30 : la cellule (porte d'acier lointaine, une goutte)
cue("steel_door", 64.1, -30, pan=0.4); cue("drip", 65.2, -33, pan=-0.4)
# 32 : carton final (coup sourd doux)
thump(68.99, -24, 50, 0.9)

# ---------- petite musique de fond, constante et discrète
mus = k.music4(DUR, dips=(), transpose=0)
a = np.abs(mus) > 1e-4; mus = mus * db(vref - 19 - rms(mus[a]))
duck = np.ones(N)
for w in words: duck[int(max(0, w["s"] - 0.08) * SR):int(min(DUR, w["e"] + 0.12) * SR)] = db(-2.0)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")
hit = np.zeros(N)
if os.environ.get("NIVEAUX"):                                                     # contrôle : niveau de chaque bus par plan (dB / voix)
    for a_, b_ in zip([0] + CUTS, CUTS + [DUR]):
        sl = slice(int(a_ * SR), int(b_ * SR)); print(f"{a_:6.2f} musique {rms(mus[sl]) - vref:6.1f}  bruitages {rms(hit[sl] + L[sl]) - vref:6.1f}")
    sys.exit()
mix = np.stack([voice + mus + hit + L, voice + mus * 0.97 + hit + R], 1)
out = os.path.join(HERE, "mix_v2.wav"); pre = os.path.join(HERE, "_pre_v2.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", out], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-b:a", "192k", os.path.join(HERE, "mix_ecoute_v2.mp3")], check=True)
print("mix ok", out)
