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

# ================= bande son, plan par plan =================
# 1-2 : noir, puis l'oiseau vole vers le dôme, choc électrique, chute, arrêt sur les personnages ; l'alarme se lance
k.impact(0.0, 0.8, 42.0, 2.0); cue("sting_soft", 0.0, -14)
wind(0.0, 2.6, -25, 200, 1800, 0.5, seed=1)                                   # haut dans le ciel vert
for e in range(5): put(fft_filt(rng.standard_normal(int(0.07 * SR)), 300, 3000) * np.hanning(int(0.07 * SR)), 0.1 + e * 0.085, -20, 0.0, -0.3)   # battements d'ailes
zap(HIT, -6); shimmer(HIT + 0.03, -15); k.impact(HIT, 0.9, 50.0, 1.4)
air_fall(FALL0, LAND, -14); k.whoosh(LAND, 0.35, 0.5)
k.thud(LAND, 0.7, 60); k.impact(LAND + 0.01, 0.6, 38.0, 1.6); cue("cloth_rustle", LAND + 0.05, -26)   # l'oiseau tombe à côté, la caméra s'arrête
ALARM = alarm(FALL0 + 0.05, 9.2, -17)                                          # alarme d'abri lente (s'éloigne pendant le dézoom du plan 5)
field_hum(0.1, 11.9, -27, 55.0, seed=2)                                       # bourdonnement du champ magnétique
babble(LAND + 0.2, 4.813, -27, 10, seed=3); cue("gasp_teen", LAND + 0.35, -24, pan=0.3); cue("crowd_breath", 1.5, -25)
# 3 : compte à rebours, la foule
for e in range(3): k.tick(2.55 + e, 0.5)
cue("beep_ok", W(14) - 0.05, -22); k.impact(W(14), 0.5, 40.0, 1.6)            # « coupé »
cue("crowd_shuffle", 2.6, -24); babble(2.453, 4.813, -25, 16, seed=4)
# 4 : la foule bouge puis se fige d'un coup (seuls l'alarme et le champ restent)
crowd_steps(4.813, 5.8, -20, FREEZE, seed=5); babble(4.813, 5.8, -24, 18, seed=6, stop=FREEZE)
k.reverse(FREEZE, 0.6, 0.5); k.sub_drop(FREEZE, 0.6)
# 5 : la caméra recule jusqu'au dôme entier dans le désert irradié (vent toxique, radiations)
k.whoosh(6.9, 1.4, 0.7); wind(6.6, 9.6, -21, 150, 1500, 0.7, seed=7)
bed(7.8, 10.2, 40, 220, -25, 0.5, 0.6, seed=8)                                # grondement sourd du désert
geiger(W(27) - 0.3, 9.6, -24, 6.0, seed=9)                                      # « radiations extérieures »
# 6 : drone vers la fenêtre du Conseil ; 7 : « plus assez d'énergie » : le champ faiblit, les lumières s'éteignent
wind(9.4, 11.7, -23, 200, 2000, 0.6, seed=10); k.whoosh(11.6, 0.6, 0.6)
cue("elec_hum", 10.4, -29, 1.3, fade=0.3)
field_hum(11.6, 14.6, -25, 55.0, glide=(11.9, 30.0, 2.2), seed=11); powerdown(W(43) - 0.1, 2.2, -19)
for e, tt in enumerate([12.55, 12.95, 13.3, 13.85]): cue("light_off", tt, -21 - 2 * e, pan=(-0.4, 0.4, -0.1, 0.2)[e])
wind(11.6, 14.4, -27, 150, 1200, 0.5, seed=12)
# 8 : hologramme de la carte (riches au centre, districts autour)
holo(14.3, 18.5, -26, seed=13); cue("light_on", 14.35, -22); k.whoosh(14.31, 0.4, 0.4)
cue("beep_ok", W(55) - 0.05, -25); cue("beep_ok", W(62) - 0.05, -26)
# 9 : règle 1 sur un mur de district ; ambiance de district (vent, néon, haut-parleur lointain, chocs métalliques)
cue("sting_hit", W(63) - 0.06, -11); k.impact(W(63) - 0.03, 0.8, 44.0, 1.8)
loop("wind_city", 18.4, 21.9, -26, seed=14); cue("neon_flicker", 19.2, -27, pan=-0.3); clank(20.5, -27, 0.5, seed=15)
pa_voice(18.6, 21.6, -31, seed=16)
# 10 : dehors : vent toxique, gaz, radiations ; « tue »
wind(21.7, 24.5, -17, 120, 1300, 0.8, seed=17); bed(21.7, 24.5, 1800, 7000, -29, 0.6, 1.5, seed=18)   # sifflement du gaz
geiger(21.8, 24.4, -20, 9.0, seed=19); k.impact(W(74) - 0.03, 0.7, 40.0, 2.0); tiin(W(74) - 0.05, -21)
# 11-12 : chez toi, le soir : ton père, les dossiers (pièce calme, horloge, lampe, papier)
bed(24.3, 28.7, 60, 500, -33, 0.2, 0.3, seed=20); clock(24.4, 28.6, -29); cue("elec_hum", 24.4, -31, 4.0, fade=0.5)
cue("cloth_rustle", 25.2, -25, pan=0.2); paper(26.3, 1.1, -22, seed=21); paper(27.6, 0.8, -21, seed=22)   # il ouvre le dossier, tourne les pages
cue("drip", 25.9, -32, pan=-0.6)
# 13-16 : le matin dans la rue, les gardes l'emmènent
loop("wind_city", 28.5, 35.9, -28, seed=23); chirps(28.6, 31.0, -31, seed=24); pa_voice(28.9, 30.6, -32, seed=25)
cue("boots_approach", 29.3, -18, pan=-0.2)                                     # « des gardes »
steps(30.4, 35.7, 0.42, -21, pan=0.15, seed=26, rate=0.85)                       # pas lourds des gardes
cue("suit_rustle", 30.5, -23); cue("cloth_rustle", 31.7, -22); cue("breath_nervous", 31.6, -25)
cue("struggle", 31.9, -30, dur=0.7, fade=0.1)                                  # il ne se débat pas : à peine un frottement
paper(32.85, 0.7, -21, seed=27)                                                # « prends ça » : la feuille passe de main en main
clank(34.6, -31, -0.6, seed=28)
# 17-18 : toi ; le garde (cœur, radio du garde)
heartbeat(35.85, 37.3, 74, 0); cue("breath_nervous", 35.9, -24)
cue("pa_click", 37.4, -24, pan=0.3); cue("pa_static", 37.45, -30, 1.2, pan=0.3, fade=0.1); cue("suit_rustle", 37.9, -24)
loop("wind_city", 35.7, 39.5, -30, seed=29)
# 19-22 : le centre (drone entre les tours, la façade, règle 2, le mur de béton)
wind(39.3, 41.8, -22, 250, 2400, 0.6, seed=30); k.whoosh(39.37, 0.5, 0.6); holo(39.4, 41.7, -31, seed=31)
wind(41.6, 46.4, -24, 200, 1800, 0.5, seed=32); cue("neon_flicker", 43.5, -26); cue("elec_hum", 42.6, -28, 3.7, fade=0.5)
cue("sting_hit", W(138) - 0.06, -10); k.impact(W(138) - 0.03, 0.9, 42.0, 2.0)
wind(46.2, 48.6, -19, 150, 1600, 0.8, seed=33); cue("tower_groan", 46.4, -18); k.whoosh(46.4, 0.9, 0.7)   # par-dessus le mur
# 23-25 : la feuille (on la déplie, on lit ; « ils nous mentent »)
bed(48.3, 54.2, 60, 500, -33, 0.2, 0.3, seed=34); clock(48.5, 54.1, -31)
paper(48.5, 1.2, -16, dens=200, seed=35); paper(50.4, 0.5, -24, seed=36)
heartbeat(51.6, 54.1, 62, 0, 70)
tiin(W(170) - 0.05, -16); k.sub_drop(W(170), 0.6)
# 26 : la radio du Conseil dans le district (carillon, friture), la foule écoute
cue("pa_chime", 54.12, -15); cue("pa_feedback", 55.6, -29, fade=0.2)
loop("pa_static", 54.6, 62.0, -31, seed=37, lo=600, hi=5000)
babble(54.1, 56.4, -27, 14, seed=38); cue("crowd_shuffle", 54.4, -25)
# 27 : le champ se rétracte sur le centre (hologramme qui descend, l'énergie qui baisse)
holo(56.2, 59.9, -25, seed=39, down=True); powerdown(57.3, 2.4, -21, 300, 30); bed(56.2, 59.9, 35, 160, -26, 0.4, 0.5, seed=40)
# 28 : le garde ; « exécutés »
steps(59.85, 60.7, 0.4, -22, seed=41, rate=0.85); cue("suit_rustle", 59.9, -24)
k.impact(W(192) - 0.03, 1.1, 40.0, 2.2); cue("sting_hit", W(192) - 0.05, -12); tiin(W(192), -18, 2.0, 1480)
# 29 : toi dans la foule ; 30 : ton père en cellule
babble(62.0, 64.1, -26, 18, seed=42); cue("crowd_breath", 62.1, -25); heartbeat(62.1, 64.0, 78, 0, 86)
bed(64.0, 66.4, 50, 400, -30, 0.3, 0.4, seed=43); cue("drip", 64.4, -24, pan=-0.4); cue("drip", 65.5, -26, pan=-0.4)
cue("steel_door", 64.05, -22, pan=0.5); cue("metal_creak_far", 65.0, -25); cue("elec_hum", 64.1, -30, 2.2, fade=0.3)
# 31 : le choix ; 32 : carton final
heartbeat(66.35, 68.9, 88, 0, 112); k.riser(68.99, 2.4, 0.8); cue("breath_nervous", 66.5, -25)
k.stinger(68.99, 0.55); k.impact(68.99, 0.8, 40.0, 2.4); cue("lock_click", 69.0, -18)
bed(68.9, 72.6, 40, 300, -31, 0.3, 0.3, seed=44, fade=1.4)
pulse(62.0, 68.9, 1.4, 2.8, -12)                                               # pulsation grave qui accélère jusqu'au choix

# souffles discrets sur les coupes (sans doubler celles qui ont déjà le leur)
for c in CUTS:
    if c in (0.1, 0.52, 11.6, 14.313, 39.373, 46.313, 51.553, 68.993): continue
    k.whoosh(c, 0.35, 0.3)

# ---------- musique douce, qui suit l'histoire (nappe tenue + couche de tension ; s'efface avant les révélations)
REV = [W(63), W(74), W(138), W(170), W(192), W(210)]
mus = k.music4(DUR, dips=[t - 0.25 for t in REV], transpose=0)
ten, _ = Kit(N, SR, seed=5).tension_layer(DUR, REV, 54.0, 68.99)
sec = np.interp(np.arange(N) / SR, [0, 2.4, 6.7, 9.5, 14.3, 18.4, 24.3, 35.8, 41.6, 48.4, 54.1, 59.8, 66.3, 69.0, 71.0, 72.6],
                [-19, -18, -17, -14, -13, -12, -15, -14, -12, -13, -12, -11, -10, -9, -9, -30])   # dB par rapport à la voix
a = np.abs(mus) > 1e-4; mus = mus * db(vref - rms(mus[a])) * db(sec)
a = np.abs(ten) > 1e-4
if a.any(): mus = mus + ten * db(vref - 13 - rms(ten[a]))
duck = np.ones(N)
for w in words: duck[int(max(0, w["s"] - 0.08) * SR):int(min(DUR, w["e"] + 0.12) * SR)] = db(-3.0)
mus *= np.convolve(duck, np.ones(2000) / 2000, "same")

hit = (k.hit + 0.8 * k.air); a = np.abs(hit) > 1e-5; hit *= db(vref - 12 - rms(hit[a]))
if os.environ.get("NIVEAUX"):                                                     # contrôle : niveau de chaque bus par plan (dB / voix)
    for a_, b_ in zip([0] + CUTS, CUTS + [DUR]):
        sl = slice(int(a_ * SR), int(b_ * SR)); print(f"{a_:6.2f} musique {rms(mus[sl]) - vref:6.1f}  bruitages {rms(hit[sl] + L[sl]) - vref:6.1f}")
    sys.exit()
mix = np.stack([voice + mus + hit + L, voice + mus * 0.97 + hit + R], 1)
out = os.path.join(HERE, "mix.wav"); pre = os.path.join(HERE, "_pre.wav")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "2", "-i", "-", pre], input=mix.tobytes(), check=True)
m = subprocess.run(["ffmpeg", "-i", pre, "-af", "loudnorm=I=-15:TP=-1.2:LRA=9:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(m[m.rfind("{"):])
af = f"loudnorm=I=-15:TP=-1.2:LRA=9:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true,aresample=48000"
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", pre, "-af", af, "-c:a", "pcm_s24le", out], check=True); os.remove(pre)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", out, "-b:a", "192k", os.path.join(HERE, "mix_ecoute.mp3")], check=True)
print("mix ok", out)
