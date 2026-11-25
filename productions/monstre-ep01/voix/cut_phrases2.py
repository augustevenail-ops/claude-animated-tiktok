#!/usr/bin/env python3
"""Découpe les prises protégées (phrases2/) juste avant la phrase factice, au point le plus silencieux, et note chaque prise.
Sorties : phrases2/cut/NN_k.wav (48 kHz) et phrases2/qc2.json."""
import json, re, subprocess, unicodedata, pathlib
import numpy as np, torch
from torchaudio.pipelines import MMS_FA as B
D = pathlib.Path(__file__).parent; P2 = D / "phrases2"; C = P2 / "cut"; C.mkdir(exist_ok=True)
S = json.load(open(D / "phrases/phrases.json", encoding="utf-8"))
SR = B.sample_rate; model, tok, aligner = B.get_model(), B.get_tokenizer(), B.get_aligner()
rom = lambda w: re.sub(r"[^a-z']", "", unicodedata.normalize("NFD", w.lower().replace("œ", "oe").replace("æ", "ae").replace("’", "'")).encode("ascii", "ignore").decode())
def load(p, sr): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).astype(np.float64)
out = {}
for f in sorted(P2.glob("*.wav")):
    i = int(f.name[:2]); t = S[i].replace("2h13", "deux heures treize")
    words = [w for w in t.split() if rom(w).strip("'")]; toks = [rom(w).strip("'") or "a" for w in words] + ["voila"]
    a16 = load(f, SR)
    with torch.inference_mode():
        em, _ = model(torch.from_numpy(a16.astype(np.float32))[None]); spans = aligner(em[0], tok(toks))
    r = len(a16) / em.shape[1] / SR
    sc = [float(np.mean([x.score for x in s])) for s in spans[:-1]]
    le, ds = spans[-2][-1].end * r, spans[-1][0].start * r            # fin du dernier vrai mot, début de « voilà »
    a = load(f, 48000); n = int(0.01 * 48000)
    db = 20 * np.log10(np.sqrt(np.add.reduceat(a ** 2, np.arange(0, len(a), n)) / n) + 1e-9)
    lo, hi = int((le + 0.05) * 100), max(int((le + 0.05) * 100) + 1, int((ds - 0.03) * 100))
    cut = lo + int(np.argmin(db[lo:hi])) if hi > lo else lo           # trame la plus calme entre les deux phrases
    cut = min(cut, int((le + 0.45) * 100))
    sp = np.where(db[:cut] > -42)[0]; s0 = max(0, sp[0] - 3) if len(sp) else 0
    seg = a[s0 * n: cut * n].copy(); fo = int(0.03 * 48000); seg[-fo:] *= np.linspace(1, 0, fo)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", "48000", "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", str(C / f.name)], input=seg.tobytes(), check=True)
    out[f.name] = dict(i=i, gap=round(ds - le, 2), cut_db=round(float(db[cut - 1]), 1), dur=round(len(seg) / 48000, 2),
                       meanscore=round(float(np.mean(sc)), 3), minscore=round(min(sc), 3), worst=words[int(np.argmin(sc))])
    print(f.name, out[f.name], flush=True)
json.dump(out, open(P2 / "qc2.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
