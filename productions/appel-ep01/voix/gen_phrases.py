# Voix off « Le Téléphone rouge », version propre : une requête Fish Audio par phrase (les longues requêtes dérivent
# et mâchent des mots), 3 prises par phrase, on garde celle que l'alignement forcé (MMS_FA) reconnaît le mieux
# (score du mot le plus faible, puis score moyen). Phrases recollées avec des pauses fixes.
#   python3 gen_phrases.py            -> voice.mp3, ref.json, prises/  (rapport des scores à l'écran)
import hashlib, json, re, subprocess, urllib.request, pathlib, unicodedata
import numpy as np, torch
from torchaudio.pipelines import MMS_FA as B

D = pathlib.Path(__file__).parent; P = D / "prises"; P.mkdir(exist_ok=True)
MAXT = 8
REF, SR, TAKES = "76afa942e9444f4cbc9e35de38f0245b", 44100, 3
PAUSE_PHRASE, PAUSE_PARA = 0.28, 0.55

text = (D / "texte.txt").read_text(encoding="utf-8").replace("«", "").replace("»", "").strip()
paras = [p.strip() for p in text.split("\n\n") if p.strip()]
def units(p):                     # phrases très courtes regroupées (seules, Fish les mâche) : unités de 6 mots minimum
    u = []
    for s in re.split(r"(?<=[.!?])\s+", p):
        if u and (len(s.split()) < 7 or len(u[-1].split()) < 6): u[-1] += " " + s
        else: u.append(s)
    return u
phr = [(units(p), ) for p in paras]

def fish(t: str) -> np.ndarray:
    body = {"text": t, "reference_id": REF, "format": "wav", "normalize": True, "latency": "normal",
            "temperature": 0.55, "top_p": 0.7, "prosody": {"speed": 1.0, "volume": 0}}
    req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
                                 {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": "s1"})
    b = urllib.request.urlopen(req, timeout=300).read()
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", "-", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
                                        input=b, capture_output=True, check=True).stdout, np.float32).copy()

def trim(x, thr=-42.0, pad=0.03):
    n = SR // 100; r = 20 * np.log10(np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, 1) + 1e-12))
    on = np.flatnonzero(r > thr)
    return x if not len(on) else x[max(0, on[0] * n - int(pad * SR)): min(len(x), (on[-1] + 1) * n + int(pad * SR))]

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
            f = P / f"{hashlib.md5(t.encode()).hexdigest()[:8]}_{n}.wav"
            x = trim(fish(t)) if not f.exists() else np.frombuffer(subprocess.run(["ffmpeg", "-v", "error", "-i", str(f), "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], capture_output=True).stdout, np.float32).copy()
            if not f.exists():
                subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", str(f)], input=x.tobytes(), check=True)
            mn, mu, wk = score(x, t)
            if best is None or (round(mn, 2), mu) > (round(best[1], 2), best[2]): best = (x, mn, mu, wk, n)
        out.append(best[0]); rep.append(f"{k:02d} prise {best[4]}  min {best[1]:.2f} ({best[3]})  moy {best[2]:.2f}  {t}")
        last = si == len(ps) - 1 and pi < len(phr) - 1
        if not (si == len(ps) - 1 and pi == len(phr) - 1):
            out.append(np.zeros(int((PAUSE_PARA if last else PAUSE_PHRASE) * SR), np.float32))

y = np.concatenate(out)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", str(D / "voice.mp3")], input=y.tobytes(), check=True)
json.dump([{"w": w} for w in text.split()], open(D / "ref.json", "w", encoding="utf-8"), ensure_ascii=False)
print("\n".join(rep)); print(f"durée {len(y) / SR:.2f} s")
