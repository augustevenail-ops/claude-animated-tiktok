#!/usr/bin/env python3
"""Alignement forcé mot à mot (torchaudio MMS_FA, CTC) : bien plus précis que les timestamps de whisper.
  python3 tools/aligne_force.py <voix.wav> <words.json de référence (texte)> <sortie.json>
"""
import json, re, subprocess, sys, unicodedata
import numpy as np, torch, torchaudio
from torchaudio.pipelines import MMS_FA as B

wav, ref, out = sys.argv[1:4]
SR = B.sample_rate
a = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", wav, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).copy()
words = [w["w"] for w in json.load(open(ref, encoding="utf-8"))]
rom = lambda w: re.sub(r"[^a-z']", "", unicodedata.normalize("NFD", w.lower().replace("œ", "oe").replace("æ", "ae")).encode("ascii", "ignore").decode())
toks = [rom(w) for w in words]
model, tok, aligner = B.get_model(), B.get_tokenizer(), B.get_aligner()
keep = [i for i, t in enumerate(toks) if t.strip("'")]
with torch.inference_mode():
    em, _ = model(torch.from_numpy(a)[None])
    spans = aligner(em[0], tok([toks[i] for i in keep]))
r = a.shape[0] / em.shape[1] / SR                      # secondes par trame d'émission
res = [{"w": w, "s": None, "e": None} for w in words]
for i, sp in zip(keep, spans):
    res[i]["s"], res[i]["e"] = round(sp[0].start * r, 3), round(sp[-1].end * r, 3)
for i, x in enumerate(res):                            # mots sans lettres : collés au voisin
    if x["s"] is None:
        j = i - 1 if i else i + 1; x["s"], x["e"] = res[j]["e"] or 0, res[j]["e"] or 0
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(res), "mots ; fin", res[-1]["e"])
