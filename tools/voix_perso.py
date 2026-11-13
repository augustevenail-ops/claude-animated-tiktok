# Voix off enregistrée par l'utilisateur -> piste narrateur propre, calée comme la voix ElevenLabs d'origine.
#  1. nettoyage de la prise entière (passe-haut, anti-clics de bouche, débruitage léger) ;
#  2. retrait des prises ratées (code erreur : clap + « erreur » + reprise) -> intervalles --cut a-b ;
#  3. transcription Whisper (voix_transcrire.py) alignée sur le texte du script : chaque mot du script reçoit ses temps ;
#  4. tout ce qui n'est pas un mot (inspirations, salive, clap) devient du silence ; débuts/fins de phrase recalés sur l'énergie ;
#  5. blancs ramenés aux cibles de voices.json (fin de phrase / virgule / intérieur / tension), comme tts_roles.py ;
#  6. réglages légers (chaleur, présence, de-esseur, compression douce), volume calé sur la voix d'origine (-22,5 LUFS) ;
#  7. répliques des autres rôles (haut-parleur, mère) reprises telles quelles depuis voice/_seg (voix ElevenLabs d'origine).
# Usage : python tools/voix_perso.py productions/<ep> <prise.wav> <transcription.json> <sortie> [--cut a-b,...] [--tempo 1.0] [--lufs -22.5]
import argparse, difflib, json, os, re, subprocess, unicodedata
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument("ep"); ap.add_argument("prise"); ap.add_argument("trans"); ap.add_argument("out")
ap.add_argument("--cut", default=""); ap.add_argument("--tempo", type=float, default=1.0); ap.add_argument("--lufs", type=float, default=-22.5)
ap.add_argument("--end", type=float, default=0.42); ap.add_argument("--comma", type=float, default=0.14)
ap.add_argument("--pitch", type=float, default=0.0)    # demi-tons ; formants préservés (timbre naturel, pas d'effet robot)
ap.add_argument("--text", default="")   # texte balisé à utiliser à la place de voice/text.txt (ex. réplique {merepaume}« … » ajoutée)
ap.add_argument("--sub", default="")    # écarts de lecture assumés : « ancien>nouveau|… » appliqués au texte du narrateur
ap.add_argument("--st", type=float, default=0.0)        # abaissement PSOLA (Praat) en demi-tons, AVANT le timbre (pas de vocodeur)
ap.add_argument("--formant", type=float, default=1.0)  # < 1 : timbre plus ample
ap.add_argument("--sat", type=float, default=3.0)      # attaque de la saturation douce (dB)
ap.add_argument("--body", action="store_true")         # un peu plus de poitrine (réglage F)
ap.add_argument("--range", type=float, default=1.0)    # intonation : > 1 = mélodie plus ample (conteur)
ap.add_argument("--enddrop", type=float, default=0.0)  # fins de phrase qui retombent (demi-tons sur le dernier mot)
ap.add_argument("--slow", type=float, default=1.0)     # débit : > 1 = plus posé (change le minutage)
ap.add_argument("--onepass", action="store_true")      # hauteur + mélodie + fins de phrase en UNE resynthèse (moins de grain), sans décalage de formants
ap.add_argument("--fmax", type=float, default=400)     # plafond de détection de hauteur (250 pour une voix grave : moins d'erreurs -> moins de grésillement)
ap.add_argument("--soft", action="store_true")         # aigus lissés (highshelf 6,5 kHz -1,5 dB, passe-bas 11 kHz)
ap.add_argument("--outro", default="")   # texte de la phrase de fin (ex. « Abonne-toi pour l'épisode deux. »), lu à la fin de la prise
A = ap.parse_args()
SR = 48000; os.makedirs(A.out, exist_ok=True)
CFG = json.load(open(os.path.join(A.ep, "voices.json"), encoding="utf-8")); P = dict(CFG["pauses"])
P["end"], P["comma"] = A.end, A.comma          # voix perso : un peu plus de silence en fin de phrase (demande utilisateur)

def ff(x, af):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", af, "-f", "f32le", "-"],
                                        input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout, np.float32).astype(np.float64)
def decode(p):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
def lufs(x):
    r = subprocess.run(["ffmpeg", "-v", "info", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", "ebur128", "-f", "null", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True).stderr.decode()
    return float(re.findall(r"I:\s+(-?[\d.]+) LUFS", r)[-1])

# ---------- 1. nettoyage de la prise entière ----------
x = decode(A.prise)
x = ff(x, "highpass=f=75,adeclick=w=40:o=75:t=3,afftdn=nr=8:nf=-62:tn=1")

# ---------- 2. coupes (prises ratées) ----------
cuts = sorted(tuple(map(float, c.split("-"))) for c in A.cut.split(",") if c)
TW = [w for w in json.load(open(A.trans, encoding="utf-8")) if not any(a <= (w["s"] + w["e"]) / 2 <= b for a, b in cuts)]
def shift(t):
    return t - sum(min(b, max(a, t)) - a for a, b in cuts)
keep, pos = [], 0.0
for a, b in cuts: keep.append(x[int(pos * SR):int(a * SR)]); pos = b
keep.append(x[int(pos * SR):]); x = np.concatenate(keep)
for w in TW: w["s"], w["e"] = shift(w["s"]), shift(w["e"])

# ---------- 3. alignement script <-> transcription ----------
def norm(s):
    s = unicodedata.normalize("NFD", s.lower()); s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = {"1": "un", "2": "deux", "3": "trois", "4": "quatre", "5": "cinq"}.get(s.strip(".,;:!?… "), s)
    return re.sub(r"[^a-z0-9]", "", s)
tw = []
for w in TW:                                                    # « s » + « 'éteint » -> « s'éteint », « haut » + « -parleur »
    if tw and w["w"][:1] in "'’-" : tw[-1] = {**tw[-1], "w": tw[-1]["w"] + w["w"], "e": w["e"]}
    else: tw.append(dict(w))
text = open(A.text or os.path.join(A.ep, "voice", "text.txt"), encoding="utf-8").read()
for pair in filter(None, A.sub.split("|")): o_, n_ = pair.split(">"); text = text.replace(o_, n_)
segs, p0 = [], 0
for m in re.finditer(r"\{(\w+)\}«\s*(.*?)\s*»", text):
    if text[p0:m.start()].strip(): segs.append(("narrateur", text[p0:m.start()].strip()))
    segs.append((m.group(1), m.group(2).strip())); p0 = m.end()
if text[p0:].strip(): segs.append(("narrateur", text[p0:].strip()))
sw, PC = [], set()                                             # « façon : la » -> « façon » + petite pause (comme la voix d'origine)
for k, t in [(k, t) for k, (r, s) in enumerate(segs) if r == "narrateur" for t in s.split()] + ([(-1, t) for t in A.outro.split()] if A.outro else []):
    if re.search(r"\w", t): sw.append((k, t))
    elif sw: PC.add(len(sw) - 1)
a_n, b_n = [norm(t) for _, t in sw], [norm(w["w"]) for w in tw]
times = [None] * len(sw)
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, a_n, b_n, autojunk=False).get_opcodes():
    if op == "equal":
        for d in range(i2 - i1): times[i1 + d] = (tw[j1 + d]["s"], tw[j1 + d]["e"])
    elif op == "replace":                                       # répartit la portée Whisper au prorata des lettres
        s0, e0 = tw[j1]["s"], tw[j2 - 1]["e"]; L = [max(1, len(a_n[i])) for i in range(i1, i2)]; acc = 0
        for d, l in enumerate(L): times[i1 + d] = (s0 + (e0 - s0) * acc / sum(L), s0 + (e0 - s0) * (acc + l) / sum(L)); acc += l
        print("  remplacé :", " ".join(t for _, t in sw[i1:i2]), "<-", " ".join(w["w"] for w in tw[j1:j2]))
    elif op == "delete": print("  non trouvé (interpolé) :", " ".join(t for _, t in sw[i1:i2]))
    elif op == "insert": print("  en trop dans la prise (ignoré) :", " ".join(w["w"] for w in tw[j1:j2]))
for i in range(len(times)):                                     # mots manquants : collés au voisin
    if times[i] is None:
        prv = next((times[j][1] for j in range(i - 1, -1, -1) if times[j]), 0.0); times[i] = (prv, prv + 0.05)

# ---------- 4. silence hors des mots, débuts/fins de phrase recalés sur l'énergie ----------
H = 240; n = len(x) // H; fr = x[:n * H].reshape(n, H)
rms = 20 * np.log10(np.sqrt((fr ** 2).mean(1)) + 1e-9)
spec = np.abs(np.fft.rfft(fr * np.hanning(H), axis=1)); f = np.fft.rfftfreq(H, 1 / SR)
hf = spec[:, f > 3000].sum(1) / (spec[:, (f > 80) & (f < 1200)].sum(1) + 1e-9)
voiced = (rms > -33) | ((rms > -46) & (hf > 5))                 # voix, ou sifflante (s, ch, f) ; pas le souffle d'une inspiration
tail_ok = rms > -44                                             # fin de mot qui s'éteint doucement (« Imagine… ») : gardée
def onset(t, lo):
    """début réel : on recule tant qu'il reste de la voix juste avant (Whisper place souvent le 1er mot trop tard), sans passer lo"""
    i = int(t * SR / H); stop = max(int(lo * SR / H), i - int(1.2 * SR / H), 0)
    if not voiced[max(0, i - 12):i + 12].any():                 # Whisper a placé le mot dans le silence qui suit : on remonte jusqu'à la voix
        while i > stop and not voiced[i]: i -= 1
    while i > stop and voiced[max(0, i - 30):i].any(): i -= 1
    j = i                                                       # puis on avance jusqu'à la vraie attaque (pas le souffle)
    while j < min(n - 3, i + int(0.35 * SR / H)) and not voiced[j:j + 3].all(): j += 1
    return max(lo, j * H / SR - 0.035)
def offset(t, hi):
    """fin réelle : on avance tant que la voix (ou sa queue douce) continue, sans dépasser hi"""
    i = int(t * SR / H); stop = min(int(hi * SR / H), i + int(0.8 * SR / H), n - 1)
    while i < stop and tail_ok[i:i + 6].any(): i += 1
    return min(hi, i * H / SR + 0.05)
W = [{"seg": k, "w": t, "s": s, "e": e, "pc": i in PC} for i, ((k, t), (s, e)) in enumerate(zip(sw, times))]
def silence_between(a, b):
    """plus long silence (>= 80 ms, ni voix ni queue douce) entre a et b -> (début, fin) ou None"""
    i0, i1 = max(0, int(a * SR / H)), min(n, int(b * SR / H)); best, run0 = None, None
    for i in range(i0, i1 + 1):
        q = i < i1 and not tail_ok[i]
        if q and run0 is None: run0 = i
        if not q and run0 is not None:
            if i - run0 >= int(0.10 * SR / H) and (best is None or i - run0 > best[1] - best[0]): best = (run0, i)
            run0 = None
    return (best[0] * H / SR, best[1] * H / SR) if best else None
for i in range(len(W) - 1):                                      # fin de phrase / virgule : Whisper colle souvent les mots -> on cherche le vrai silence
    w, nx = W[i], W[i + 1]
    if re.search(r"[.?!…,:;]$", w["w"]) or w.get("pc") or nx["s"] - w["e"] > 0.12:
        sil = silence_between(max(w["s"] + 0.1, w["e"] - 0.45), min(nx["e"] - 0.05, nx["s"] + 0.45))
        if sil: w["e"], nx["s"] = sil[0] + 0.05, max(sil[0] + 0.05, sil[1] - 0.035); w["fx"] = nx["fx_s"] = 1
for i, w in enumerate(W):
    if i and W[i - 1].get("fx") and w.get("fx_s"): pass
    elif i == 0 or w["s"] - W[i - 1]["e"] > 0.12: w["s"] = onset(w["s"], W[i - 1]["e"] + 0.08 if i else 0.0)
    if w.get("fx"): continue
    if i == len(W) - 1 or W[i + 1]["s"] - w["e"] > 0.12: w["e"] = offset(w["e"], W[i + 1]["s"] - 0.1 if i + 1 < len(W) else w["e"] + 0.8)
for i, w in enumerate(W):                                       # garde-fou : jamais de fin avant le début
    if w["e"] < w["s"] + 0.05: w["e"] = offset(w["s"] + 0.05, W[i + 1]["s"] - 0.05 if i + 1 < len(W) else w["s"] + 1.0)
mask = np.zeros(len(x))
for w in W: mask[max(0, int((w["s"] - 0.02) * SR)):int((w["e"] + 0.04) * SR)] = 1
# Whisper se trompe parfois de 0,1-0,2 s : toute voix (ou sifflante) à moins de 0,25 s d'un mot est gardée, jamais coupée
near = np.convolve(mask[:n * H].reshape(n, H).max(1), np.ones(int(0.5 * SR / H)), "same") > 0
mask[:n * H] = np.maximum(mask[:n * H], np.repeat((voiced | (tail_ok & np.roll(voiced, 1) | tail_ok & np.roll(voiced, -1))) & near, H))
k = int(0.008 * SR); mask = np.convolve(mask, np.ones(k) / k, "same")
x = x * mask

# ---------- 5. blancs ramenés aux cibles (même règle que tts_roles.py) ----------
M, FADE = 0.03, int(0.010 * SR)
def quiet_run(x, a, b, h=int(0.005 * SR)):
    """plus long passage silencieux (< -55 dB) entre a et b -> (début, fin) en s"""
    i0, i1 = max(0, int(a * SR) // h), min(len(x) // h, int(b * SR) // h)
    if i1 <= i0: return None
    q = 20 * np.log10(np.sqrt((x[i0 * h:i1 * h].reshape(-1, h) ** 2).mean(1)) + 1e-12) < -55
    best, r0 = None, None
    for i, v in enumerate(list(q) + [False]):
        if v and r0 is None: r0 = i
        if not v and r0 is not None:
            if best is None or i - r0 > best[1] - best[0]: best = (r0, i)
            r0 = None
    return ((i0 + best[0]) * h / SR, (i0 + best[1]) * h / SR) if best else None
def tighten(x, W, tail):
    pieces, seg0 = [], max(0.0, W[0]["s"] - 0.04)
    for i in range(len(W) - 1):
        w, nx = W[i], W[i + 1]; gap = nx["s"] - w["e"]
        if any(nx["w"].lower().strip("«».…").startswith(t) for t in P["tension_words"]): tgt = P["tension"]
        elif re.search(r"[.?!…]$", w["w"]): tgt = P["end"]
        elif re.search(r"[,:;]$", w["w"]) or w.get("pc"): tgt = P["comma"]
        else: tgt = P["inner"]
        # on ne coupe QUE dans un vrai silence (signal déjà mis à zéro hors voix) : plus jamais de mot entamé
        r = quiet_run(x, w["e"] - 0.15, nx["s"] + 0.15)
        if r and r[1] - r[0] > tgt + 0.02:
            pieces.append((seg0, r[0] + tgt / 2)); seg0 = r[1] - tgt / 2
    pieces.append((seg0, W[-1]["e"] + tail))
    out, mp, acc = [], [], 0.0
    for a, b in pieces:
        s = x[max(0, int(a * SR)):int(b * SR)].copy()
        if len(s) > 2 * FADE: s[:FADE] *= np.linspace(0, 1, FADE); s[-FADE:] *= np.linspace(1, 0, FADE)
        out.append(s); mp.append((a, b, acc)); acc += len(s) / SR
    def rm(t):
        for a, b, n0 in mp:
            if t <= b: return n0 + max(0.0, t - a)
        return acc
    y = np.concatenate(out); tl = int(min(0.3, tail) * SR); y[-tl:] *= np.cos(np.linspace(0, np.pi / 2, tl)) ** 2
    return y, [{"w": w["w"], "s": rm(w["s"]), "e": rm(w["e"])} for w in W], rm(W[-1]["e"]) + 0.1

# ---------- 6. réglages légers + volume calé sur la voix d'origine ----------
# style « B + D » validé par l'utilisateur (2026-11-13) : chaud et proche + sombre et dense, sans changer la hauteur
TONE = ("equalizer=f=110:t=q:w=0.9:g=2,lowshelf=f=160:g=2.5,equalizer=f=260:t=q:w=1.0:g=-1.5,equalizer=f=2800:t=q:w=1.2:g=1.2,"
        "highshelf=f=6500:g=-2.5,acompressor=threshold=-27dB:ratio=3.5:attack=5:release=130:makeup=2.5,volume=3dB,asoftclip=type=tanh,volume=-3dB")
if A.tempo != 1 or A.pitch: TONE = f"rubberband=tempo={A.tempo}:pitch={2 ** (A.pitch / 12):.5f}:formant=preserved:pitchq=quality:transients=smooth," + TONE
TONE = TONE.replace("volume=3dB,asoftclip=type=tanh,volume=-3dB", f"volume={A.sat}dB,asoftclip=type=tanh,volume=-{A.sat}dB") if A.sat else TONE.replace(",volume=3dB,asoftclip=type=tanh,volume=-3dB", "")
if A.body: TONE = "lowshelf=f=130:g=2,equalizer=f=320:t=q:w=1.2:g=-1," + TONE
if A.soft: TONE += ",highshelf=f=6500:g=-1.5,lowpass=f=11000"
F0 = None
if A.st or A.formant != 1:
    import parselmouth
    from parselmouth.praat import call
    F0 = call(parselmouth.Sound(x, SR).to_pitch(time_step=0.01, pitch_floor=60, pitch_ceiling=A.fmax), "Get quantile", 0, 0, 0.5, "Hertz")
if F0 is None and (A.range != 1 or A.enddrop or A.slow != 1):
    import parselmouth
    from parselmouth.praat import call
    F0 = call(parselmouth.Sound(x, SR).to_pitch(time_step=0.01, pitch_floor=60, pitch_ceiling=A.fmax), "Get quantile", 0, 0, 0.5, "Hertz")
def fit(z, n): return z[:n] if len(z) >= n else np.pad(z, (0, n - len(z)))
def onepass(y, Wt):
    """une seule resynthèse PSOLA : f' = F0·2^(st/12)·(f/F0)^range, puis chute progressive sur le dernier mot de chaque phrase"""
    snd = parselmouth.Sound(y, SR); dur = len(y) / SR
    man = call(snd, "To Manipulation", 0.01, 60, A.fmax)
    pt = call(man, "Extract pitch tier"); npt = call(pt, "Get number of points")
    ends = [(w["s"], w["e"]) for w in (Wt or []) if re.search(r"[.?!…]$", w["w"])]
    new = call("Create PitchTier", "p", 0, dur)
    for i in range(1, npt + 1):
        t, v = call(pt, "Get time from index", i), call(pt, "Get value at index", i)
        v = F0 * 2 ** (A.st / 12) * (v / F0) ** A.range
        for a, b in ends:
            if a <= t <= b + 0.05: v *= 2 ** (-A.enddrop * min(1, (t - a) / max(0.05, b - a)) / 12)
        call(new, "Add point", t, v)
    call([new, man], "Replace pitch tier")
    if A.slow != 1:
        dt = call("Create DurationTier", "d", 0, dur); call(dt, "Add point", 0, A.slow); call([dt, man], "Replace duration tier")
    return call(man, "Get resynthesis (overlap-add)").values[0].astype(np.float64)
def grave(y, Wt=None):
    """PSOLA (Praat) : hauteur, formants, amplitude de la mélodie ; puis fins de phrase retombantes et débit (2e passe)"""
    if F0 is None: return y
    if A.onepass: return onepass(y, Wt)
    if A.st or A.formant != 1 or A.range != 1:
        y = fit(call(parselmouth.Sound(y, SR), "Change gender", 60, A.fmax, A.formant, F0 * 2 ** (A.st / 12), A.range, 1.0).values[0].astype(np.float64), len(y))
    if not (A.enddrop or A.slow != 1): return y
    snd = parselmouth.Sound(y, SR); dur = len(y) / SR
    man = call(snd, "To Manipulation", 0.01, 60, 400)
    if A.enddrop and Wt:
        pt = call(man, "Extract pitch tier"); npt = call(pt, "Get number of points")
        pts = [(call(pt, "Get time from index", i), call(pt, "Get value at index", i)) for i in range(1, npt + 1)]
        ends = [(w["s"], w["e"]) for w in Wt if re.search(r"[.?!…]$", w["w"])]
        new = call("Create PitchTier", "p", 0, dur)
        for t, v in pts:
            for a, b in ends:
                if a <= t <= b + 0.05: v *= 2 ** (-A.enddrop * min(1, (t - a) / max(0.05, b - a)) / 12)
            call(new, "Add point", t, v)
        call([new, man], "Replace pitch tier")
    if A.slow != 1:
        dt = call("Create DurationTier", "d", 0, dur); call(dt, "Add point", 0, A.slow); call([dt, man], "Replace duration tier")
    return call(man, "Get resynthesis (overlap-add)").values[0].astype(np.float64)
narr = {}
for k in sorted({w["seg"] for w in W}):
    Wk = [w for w in W if w["seg"] == k]
    y, Wt, core = tighten(x, Wk, 0.15)
    y = grave(y, Wt)
    if A.slow != 1: Wt = [{**w, "s": w["s"] * A.slow, "e": w["e"] * A.slow} for w in Wt]; core *= A.slow
    narr[k] = (ff(y, TONE), Wt, core)
g = 10 ** ((A.lufs - lufs(np.concatenate([v[0] for kk, v in narr.items() if kk >= 0]))) / 20)
narr = {kk: (v[0] * g, v[1], v[2]) for kk, v in narr.items()}
from scipy.signal import butter, sosfiltfilt
SOS = butter(4, 3200, "highpass", fs=SR, output="sos")
def desib(y, thr_db=-30.0, ratio=4.0):
    """« ch », « s » trop vifs (grésillement) : bande > 3,2 kHz compressée là où elle dépasse le seuil (phase nulle, pas de décalage)"""
    hi = sosfiltfilt(SOS, y); lo = y - hi; k = int(0.004 * SR)
    env = np.sqrt(np.convolve(hi ** 2, np.ones(k) / k, "same")) + 1e-9; e_db = 20 * np.log10(env)
    gdb = np.where(e_db > thr_db, (thr_db - e_db) * (1 - 1 / ratio), 0.0)
    gdb = np.convolve(gdb, np.ones(int(0.006 * SR)) / int(0.006 * SR), "same")
    return lo + hi * 10 ** (gdb / 20)
narr = {kk: (desib(v[0]), v[1], v[2]) for kk, v in narr.items()}

# ---------- 7. assemblage avec les répliques d'origine (haut-parleur, mère...) ----------
def role_seg(k, role):
    c = os.path.join(A.ep, "voice", "_seg"); base = f"{k:02d}_{role}"
    if not os.path.exists(os.path.join(c, base + ".json")):        # numérotation différente (voix montée à la main) : 1er fichier de ce rôle
        base = sorted(f[:-5] for f in os.listdir(c) if f.endswith(f"_{role}.json"))[0]
    Wr = json.load(open(os.path.join(c, base + ".json"), encoding="utf-8"))["words"]
    y, Wt, core = tighten(decode(os.path.join(c, base + ".mp3")), Wr, 0.5)
    cf = CFG[role]; af = []
    if cf.get("pitch") or cf.get("tempo", 1) != 1: af.append(f"rubberband=pitch={2 ** (cf.get('pitch', 0) / 12):.5f}:tempo={cf.get('tempo', 1)}:pitchq=quality")
    if cf.get("fx"): af.append(cf["fx"])
    return (ff(y, ",".join(af)) if af else y), Wt, core, cf.get("tempo", 1)
audio, words, t, end = np.zeros(int(400 * SR)), [], 0.0, 0.0
for k, (role, txt) in enumerate(segs):
    if role == "narrateur": y, Wt, core = narr[k]; tempo = A.tempo
    else: y, Wt, core, tempo = role_seg(k, role)
    for j, w in enumerate(Wt):
        words.append({"w": w["w"], "s": round(t + w["s"] / tempo, 3), "e": round(t + w["e"] / tempo, 3), "role": role, **({"q": 1} if role != "narrateur" and j == 0 else {})})
    i0 = int(t * SR); audio[i0:i0 + len(y)] += y; end = max(end, t + len(y) / SR)
    nxt = segs[k + 1][0] if k + 1 < len(segs) else None
    gap = P["before_quote"] if nxt and nxt != "narrateur" and txt.rstrip().endswith(":") else P["end"]
    t += core / tempo + max(0.0, gap - 0.14)
y = audio[:int(max(end, t) * SR)]
pk = np.abs(y).max()
if pk > 0.95: y *= 0.95 / pk
def wav(z, p): subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", p], input=z.astype(np.float32).tobytes(), check=True)
wav(y, os.path.join(A.out, "voice.wav"))
ec = y
if -1 in narr:                                                  # écoute : la phrase de fin juste après (comme dans le mix, sur le carton titre)
    yo, Wo, _ = narr[-1]; ec = np.concatenate([y, np.zeros(int(0.35 * SR)), yo[int(max(0, Wo[0]["s"] - 0.03) * SR):]])
wav(ec, os.path.join(A.out, "_ecoute.wav"))
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(A.out, "_ecoute.wav"), "-b:a", "192k", os.path.join(A.out, "voice_ecoute.mp3")]); os.remove(os.path.join(A.out, "_ecoute.wav"))
json.dump(words, open(os.path.join(A.out, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
if -1 in narr:                                                  # phrase de fin -> outro.wav + outro.json (début du mot « épisode »)
    yo, Wo, _ = narr[-1]; wav(yo[int(max(0, Wo[0]["s"] - 0.03) * SR):], os.path.join(A.out, "outro.wav"))
    te = next((w["s"] for w in Wo if "pisode" in w["w"]), 0.8) - max(0, Wo[0]["s"] - 0.03)
    json.dump({"text": A.outro, "t_episode": round(te / A.tempo, 3)}, open(os.path.join(A.out, "outro.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(f"{len(words)} mots ; durée {len(y) / SR:.2f} s ; narrateur {A.lufs} LUFS (gain {20 * np.log10(g):+.1f} dB)")
