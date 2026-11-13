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
ap.add_argument("--outro", default="")   # texte de la phrase de fin (ex. « Abonne-toi pour l'épisode deux. »), lu à la fin de la prise
A = ap.parse_args()
SR = 48000; os.makedirs(A.out, exist_ok=True)
CFG = json.load(open(os.path.join(A.ep, "voices.json"), encoding="utf-8")); P = CFG["pauses"]

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
text = open(os.path.join(A.ep, "voice", "text.txt"), encoding="utf-8").read()
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
def onset(t):
    i0, i1 = int((t - 0.12) * SR / H), int((t + 0.35) * SR / H)
    for i in range(max(0, i0), min(n, i1)):
        if voiced[i:i + 3].all(): return max(t - 0.12, i * H / SR - 0.035)
    return t
def offset(t):
    i0, i1 = int((t - 0.3) * SR / H), int((t + 0.25) * SR / H)
    for i in range(min(n, i1) - 1, max(0, i0), -1):
        if voiced[max(0, i - 2):i + 1].all(): return min(t + 0.25, (i + 1) * H / SR + 0.06)
    return t
W = [{"seg": k, "w": t, "s": s, "e": e, "pc": i in PC} for i, ((k, t), (s, e)) in enumerate(zip(sw, times))]
for i, w in enumerate(W):
    if i == 0 or w["s"] - W[i - 1]["e"] > 0.12: w["s"] = onset(w["s"])
    if i == len(W) - 1 or W[i + 1]["s"] - w["e"] > 0.12: w["e"] = offset(w["e"])
mask = np.zeros(len(x))
for w in W: mask[max(0, int((w["s"] - 0.02) * SR)):int((w["e"] + 0.04) * SR)] = 1
k = int(0.008 * SR); mask = np.convolve(mask, np.ones(k) / k, "same")
x = x * mask

# ---------- 5. blancs ramenés aux cibles (même règle que tts_roles.py) ----------
M, FADE = 0.03, int(0.010 * SR)
def tighten(x, W, tail):
    pieces, seg0 = [], max(0.0, W[0]["s"] - 0.04)
    for i in range(len(W) - 1):
        w, nx = W[i], W[i + 1]; gap = nx["s"] - w["e"]
        if any(nx["w"].lower().strip("«».…").startswith(t) for t in P["tension_words"]): tgt = P["tension"]
        elif re.search(r"[.?!…]$", w["w"]): tgt = P["end"]
        elif re.search(r"[,:;]$", w["w"]) or w.get("pc"): tgt = P["comma"]
        else: tgt = P["inner"]
        if gap > tgt + 2 * M:
            half = max(0.0, tgt - 2 * M) / 2
            pieces.append((seg0, w["e"] + M + half)); seg0 = nx["s"] - M - half
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
TONE = ("equalizer=f=140:t=q:w=1.1:g=2.5,equalizer=f=380:t=q:w=1.3:g=-1.5,equalizer=f=3500:t=q:w=1.6:g=1.5,"
        "deesser=i=0.35,acompressor=threshold=-24dB:ratio=2.5:attack=8:release=160:makeup=1")
if A.tempo != 1: TONE = f"rubberband=tempo={A.tempo}:pitchq=quality," + TONE
narr = {}
for k in sorted({w["seg"] for w in W}):
    Wk = [w for w in W if w["seg"] == k]
    y, Wt, core = tighten(x, Wk, 0.15)
    narr[k] = (ff(y, TONE), Wt, core)
g = 10 ** ((A.lufs - lufs(np.concatenate([v[0] for kk, v in narr.items() if kk >= 0]))) / 20)
narr = {kk: (v[0] * g, v[1], v[2]) for kk, v in narr.items()}

# ---------- 7. assemblage avec les répliques d'origine (haut-parleur, mère...) ----------
def role_seg(k, role):
    c = os.path.join(A.ep, "voice", "_seg"); base = f"{k:02d}_{role}"
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
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(A.out, "voice.wav"), "-b:a", "192k", os.path.join(A.out, "voice_ecoute.mp3")])
json.dump(words, open(os.path.join(A.out, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
if -1 in narr:                                                  # phrase de fin -> outro.wav + outro.json (début du mot « épisode »)
    yo, Wo, _ = narr[-1]; wav(yo[int(max(0, Wo[0]["s"] - 0.03) * SR):], os.path.join(A.out, "outro.wav"))
    te = next((w["s"] for w in Wo if "pisode" in w["w"]), 0.8) - max(0, Wo[0]["s"] - 0.03)
    json.dump({"text": A.outro, "t_episode": round(te / A.tempo, 3)}, open(os.path.join(A.out, "outro.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(f"{len(words)} mots ; durée {len(y) / SR:.2f} s ; narrateur {A.lufs} LUFS (gain {20 * np.log10(g):+.1f} dB)")
