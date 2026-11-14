#!/usr/bin/env python3
"""Minutage mot à mot d'une voix sans timestamps (Fish Audio) : faster-whisper local, puis recalage sur les mots du
script (même découpage que le words.json de référence, pour garder les indices de plans ANCH de story.ts).

  python3 tools/aligne_mots.py <voice.wav> <reference_words.json> <sortie_words.json> [modèle whisper]
"""
import difflib, json, re, subprocess, sys, unicodedata
import numpy as np
from faster_whisper import WhisperModel

wav, ref, out = sys.argv[1:4]
model = sys.argv[4] if len(sys.argv) > 4 else "small"
norm = lambda w: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", w.lower()).encode("ascii", "ignore").decode())

audio = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32)
script = [w["w"] for w in json.load(open(ref, encoding="utf-8"))]
segs, _ = WhisperModel(model, device="cpu", compute_type="int8").transcribe(
    audio, language="fr", word_timestamps=True, vad_filter=False, condition_on_previous_text=False)   # pas d'initial_prompt : il fait sauter le début
heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if norm(w.word)]

# whisper peut couper/coller autrement (« t'expliquent », « Dis-le ») : on aligne sur les caractères normalisés
A = "".join(norm(w) for w in script); B = "".join(norm(w) for w, _, _ in heard)
tB = []                                                     # temps (début, fin) de chaque caractère entendu
for w, s, e in heard:
    n = len(norm(w))
    for k in range(n): tB.append((s + (e - s) * k / n, s + (e - s) * (k + 1) / n))
cs, ce = [None] * len(A), [None] * len(A)
for a, b, n in difflib.SequenceMatcher(None, A, B, autojunk=False).get_matching_blocks():
    for k in range(n): cs[a + k], ce[a + k] = tB[b + k]
res, p = [], 0
for w in script:
    n = len(norm(w)); s = [x for x in cs[p:p + n] if x is not None]; e = [x for x in ce[p:p + n] if x is not None]
    res.append({"w": w, "s": round(min(s), 3) if s else None, "e": round(max(e), 3) if e else None}); p += n
miss = [r["w"] for r in res if r["s"] is None]
for i, r in enumerate(res):                                 # mots non entendus : interpolés entre voisins
    if r["s"] is None:
        a = next((res[j]["e"] for j in range(i - 1, -1, -1) if res[j]["e"] is not None), 0.0)
        b = next((res[j]["s"] for j in range(i + 1, len(res)) if res[j]["s"] is not None), a + 0.3)
        r["s"], r["e"] = round(a, 3), round(b, 3)
json.dump(res, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(f"{len(res)} mots, {len(miss)} interpolés {miss[:10]} ; fin {res[-1]['e']} s")
