#!/usr/bin/env python3
"""Contrôle qualité des prises de phrases : débit, pauses internes, trous, alignement (MMS_FA). Écrit phrases/qc.json."""
import json, re, subprocess, unicodedata, pathlib, math
import numpy as np, torch
from tailcheck import tail_db
from torchaudio.pipelines import MMS_FA as B
D = pathlib.Path(__file__).parent; P = D / "phrases"; S = json.load(open(P / "phrases.json", encoding="utf-8"))
SR = B.sample_rate; model, tok, aligner = B.get_model(), B.get_tokenizer(), B.get_aligner()
rom = lambda w: re.sub(r"[^a-z']", "", unicodedata.normalize("NFD", w.lower().replace("œ", "oe").replace("æ", "ae").replace("’", "'")).encode("ascii", "ignore").decode())
def load(p, sr): return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", str(p), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).copy()
def syl(t): return len(re.findall(r"[aeiouyàâäéèêëîïôöùûüœ]+", t.lower()))
def runs(mask, hop):
    r, i = [], 0
    while i < len(mask):
        if mask[i]:
            j = i
            while j < len(mask) and mask[j]: j += 1
            r.append((i * hop, (j - i) * hop)); i = j
        else: i += 1
    return r
out = {}
for i, t in enumerate(S):
    for f in sorted(P.glob(f"{i:02d}_*.wav")):
        a = load(f, SR); hop = 0.01; n = int(SR * hop)
        e = np.sqrt(np.add.reduceat(a ** 2, np.arange(0, len(a), n)) / n); db = 20 * np.log10(e + 1e-9)
        sp = np.where(db > -40)[0]; s0, s1 = sp[0] * hop, (sp[-1] + 1) * hop; dur = s1 - s0
        inner = db[sp[0]:sp[-1] + 1] < -45
        pauses = [d for _, d in runs(inner, hop)]
        holes = [round(st + s0, 2) for st, d in runs(inner, hop) if 0.12 <= d < 0.25]
        words = [w for w in t.replace("2h13", "deux heures treize").split() if rom(w).strip("'")]
        toks = [rom(w).strip("'") or "a" for w in words]
        with torch.inference_mode():
            em, _ = model(torch.from_numpy(a)[None]); spans = aligner(em[0], tok(toks))
        sc = [float(np.mean([x.score for x in s])) for s in spans]
        punct = len(re.findall(r"[,:;…]", t))
        out[f.name] = dict(i=i, dur=round(dur, 2), rate=round(syl(t) / dur, 2), maxpause=round(max(pauses or [0]), 2),
                           npause=sum(d >= 0.25 for d in pauses), punct=punct, holes=holes,
                           minscore=round(min(sc), 3), meanscore=round(float(np.mean(sc)), 3),
                           worst=words[int(np.argmin(sc))], peak=round(float(np.abs(a).max()), 3), lead=round(s0, 2), tail=round(float(tail_db(f)), 1))
        print(f.name, out[f.name], flush=True)
json.dump(out, open(P / "qc.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
