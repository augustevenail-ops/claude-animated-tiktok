# Voix off « Le Téléphone rouge », version propre : une requête Fish Audio par paragraphe (le texte entier d'un coup
# dérive et mâche des mots ; phrase par phrase, les intonations ne s'enchaînent pas), 4 à 8 prises par paragraphe,
# on garde celle que l'alignement forcé (MMS_FA) reconnaît le mieux (score du mot le plus faible, puis moyen),
# en écartant les prises à blanc anormal. Blancs internes ramenés dans [0,30 ; 0,50] s, 0,65 s entre paragraphes.
#   python3 gen_phrases.py [reference_id]   -> voice.mp3, ref.json, prises/  (rapport des scores à l'écran)
import sys, hashlib, json, re, subprocess, urllib.request, pathlib, unicodedata
import numpy as np, torch
from torchaudio.pipelines import MMS_FA as B

D = pathlib.Path(__file__).parent; P = D / "prises"; P.mkdir(exist_ok=True)
MAXT = 8
REF, SR, TAKES = (sys.argv[1] if len(sys.argv) > 1 else "15ba126e214c4eae9c69d5a01bbbf53c"), 44100, 4
PAUSE_PHRASE, PAUSE_PARA = 0.28, 0.65
BL_MIN, BL_MAX = 0.30, 0.50

text = (D / "texte.txt").read_text(encoding="utf-8").replace("«", "").replace("»", "").strip()
paras = [p.strip() for p in text.split("\n\n") if p.strip()]
def units(p):                     # phrases très courtes regroupées (seules, Fish les mâche) : unités de 6 mots minimum
    u = []
    for s in re.split(r"(?<=[.!?])\s+", p):
        if u and (len(s.split()) < 7 or len(u[-1].split()) < 6): u[-1] += " " + s
        else: u.append(s)
    return u
phr = [([p], ) for p in paras]          # une unité = un paragraphe

def fish(t: str) -> np.ndarray:
    body = {"text": t, "reference_id": REF, "format": "wav", "normalize": True, "latency": "normal",
            "temperature": 0.6, "top_p": 0.7, "prosody": {"speed": 1.0, "volume": 0}}
    req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
                                 {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": "s1"})
    b = urllib.request.urlopen(req, timeout=300).read()
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "-", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                        input=b, capture_output=True, check=True).stdout, np.float32).copy()

def db(x):
    n = SR // 100; return 20 * np.log10(np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, 1) + 1e-12))

def trim(x, thr=-50.0, pad=0.10):          # marge large + fondus 15 ms : pas de début/fin de mot coupé
    on = np.flatnonzero(db(x) > thr); n = SR // 100
    if len(on): x = x[max(0, on[0] * n - int(pad * SR)): min(len(x), (on[-1] + 1) * n + int(pad * SR))].copy()
    f = int(0.015 * SR); x[:f] *= np.linspace(0, 1, f); x[-f:] *= np.linspace(1, 0, f); return x

def blancs(x, thr=-45.0):                  # blancs internes (s) : (début, fin) en trames de 10 ms
    q = db(x) < thr; out, i = [], 0
    while i < len(q):
        if q[i]:
            j = i
            while j < len(q) and q[j]: j += 1
            if i > 0 and j < len(q) and j - i >= 15: out.append((i, j))
            i = j
        else: i += 1
    return out

def regle(x):                              # blancs entre phrases ramenés dans [BL_MIN, BL_MAX], coupe au milieu du blanc
    n = SR // 100; parts, last = [], 0
    for i, j in blancs(x):
        L = (j - i) / 100; T = min(max(L, BL_MIN), BL_MAX) if L >= 0.22 else L
        m = (i + j) // 2 * n; parts.append(x[last:m])
        d = int((T - L) * SR)
        if d > 0: parts.append(np.zeros(d, np.float32))
        elif d < 0: parts[-1] = parts[-1][: len(parts[-1]) + d // 2]; m -= d - d // 2   # retire du blanc de part et d'autre
        last = m
    parts.append(x[last:]); return np.concatenate(parts)

rom = lambda w: re.sub(r"[^a-z']", "", unicodedata.normalize("NFD", w.lower().replace("œ", "oe")).encode("ascii", "ignore").decode()).strip("'")
model, tok, aligner = B.get_model(), B.get_tokenizer(), B.get_aligner()

def score(x, t):
    w = [rom(v) for v in t.split()]; w = [v for v in w if v]
    a = subprocess.run(["ffmpeg", "-v", "quiet", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", "16000", "-f", "f32le", "-"],
                       input=x.tobytes(), capture_output=True).stdout
    with torch.inference_mode():
        em, _ = model(torch.from_numpy(np.frombuffer(a, np.float32).copy())[None])
        spans = aligner(em[0], tok(w))
    s = [float(np.mean([c.score for c in sp])) for sp in spans]
    return min(s), float(np.mean(s)), w[int(np.argmin(s))]

out, rep, k = [], [], 0
for pi, (ps,) in enumerate(phr):
    for si, t in enumerate(ps):
        k += 1; best = None
        for n in range(MAXT):
            if n >= TAKES and best[1] >= 0.8: break
            f = P / f"{hashlib.md5((REF + t).encode()).hexdigest()[:8]}_{n}.wav"
            x = trim(fish(t)) if not f.exists() else np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout, np.float32).copy()
            if not f.exists():
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", str(f)], input=x.tobytes(), check=True)
            mn, mu, wk = score(x, t)
            longb = max([(j - i) / 100 for i, j in blancs(x)] + [0])
            if longb > 1.1: mn -= 0.3                     # blanc anormal (coupure) : prise pénalisée
            e = db(x); cut = int(np.sum((e[:-12] > -25) & (e[1:-11] < -50)))
            mn -= 0.3 * cut                               # son coupé net en pleine parole (artefact) : prise pénalisée
            if best is None or (round(mn, 2), mu) > (round(best[1], 2), best[2]): best = (x, mn, mu, wk, n)
        out.append(regle(best[0])); rep.append(f"{k:02d} prise {best[4]}/{n + 1}  min {best[1]:.2f} ({best[3]})  moy {best[2]:.2f}  {t}")
        last = si == len(ps) - 1 and pi < len(phr) - 1
        if not (si == len(ps) - 1 and pi == len(phr) - 1):
            out.append(np.zeros(int((PAUSE_PARA if last else PAUSE_PHRASE) * SR), np.float32))

y = np.concatenate(out)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", str(D / "voice.mp3")], input=y.tobytes(), check=True)
json.dump([{"w": w} for w in text.split()], open(D / "ref.json", "w", encoding="utf-8"), ensure_ascii=False)
print("\n".join(rep)); print(f"durée {len(y) / SR:.2f} s")
