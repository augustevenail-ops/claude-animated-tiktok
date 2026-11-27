#!/usr/bin/env python3
"""Contrôle OBLIGATOIRE de la voix off avant le rendu : détecte le « charabia » TTS (mots inventés, bruits de bouche)
glissé entre deux phrases par Fish Audio, que l'alignement forcé (CTC) ne voit pas : il l'absorbe dans le mot précédent.
  python3 tools/verif_charabia.py <voix.wav> <words.json>     -> liste des passages suspects ; code 1 s'il y en a
Trois signaux (cf. docs/audio.md, « Charabia TTS ») :
  1. INSERT : faster-whisper (medium) entend des mots absents du script ;
  2. LONG   : mot aligné anormalement long (> 0,9 s, ou > 0,35 s + 0,09 s/lettre) = du son absorbé derrière lui ;
  3. BRUIT  : son > -42 dB entre deux mots alignés du script, sur plus de 0,3 s (respirations et fins de mots : < 0,2 s).
Écouter chaque passage signalé, puis le couper avec tools/coupe_charabia.py (ou régénérer la phrase)."""
import json, re, subprocess, sys, unicodedata, difflib
import numpy as np
from faster_whisper import WhisperModel
wav, ref = sys.argv[1:3]
x = np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", wav, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout, np.float32).copy()
W = json.load(open(ref, encoding="utf-8"))
segs, _ = WhisperModel("medium", device="cpu", compute_type="int8").transcribe(x, language="fr", word_timestamps=True, beam_size=5, condition_on_previous_text=False)
A = [dict(s=w.start, e=w.end, w=w.word.strip(), p=w.probability) for s in segs for w in s.words]
n = lambda w: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", w.lower()).encode("ascii", "ignore").decode())
NUM = {"un": "1", "deux": "2", "trois": "3", "quatre": "4", "cinq": "5", "six": "6", "sept": "7", "huit": "8", "neuf": "9", "dix": "10", "cent": "100", "mille": "1000"}
R = "".join(n(w["w"]) for w in W)
flags = []
# 1. mots entendus en trop (comparaison caractère par caractère : insensible aux apostrophes, traits d'union, chiffres)
Rs = [n(w["w"]) for w in W]; As = [n(a["w"]) for a in A]
Rs = [NUM.get(t, t) for t in Rs]; As = [NUM.get(t, t) for t in As]
for op, i1, i2, j1, j2 in difflib.SequenceMatcher(None, Rs, As, autojunk=False).get_opcodes():
    if op not in ("insert", "replace") or j2 <= j1: continue
    got, exp = "".join(As[j1:j2]), "".join(Rs[i1:i2])
    if op == "replace" and len(got) <= len(exp) + 4: continue   # simple faute d'écoute (mer/maire, loup/Lou) : rien en trop
    if not got: continue
    flags.append((A[j1]["s"], A[j2 - 1]["e"], "INSERT", " ".join(a["w"] for a in A[j1:j2]) + (f"  (script : {' '.join(w['w'] for w in W[i1:i2])})" if i2 > i1 else "")))
# 2. mots alignés trop longs
for i, w in enumerate(W):
    L = len(n(w["w"])); d = w["e"] - w["s"]
    if L and d > min(0.9, 0.35 + 0.09 * L): flags.append((w["s"], w["e"], "LONG", f"« {w['w']} » dure {d:.2f} s"))
# 3. son entre deux mots alignés du script (les horodatages whisper sont trop imprécis : faux positifs)
db = 20 * np.log10(np.sqrt(np.add.reduceat(x.astype(np.float64) ** 2, np.arange(0, len(x), 160)) / 160) + 1e-9)
for a, b in zip(W, W[1:]):
    if b["s"] - a["e"] < 0.25: continue
    on = db[int(a["e"] * 100) + 4:int(b["s"] * 100) - 2] > -42; run = best = 0
    for o in on: run = run + 1 if o else 0; best = max(best, run)
    if best >= 30: flags.append((a["e"], b["s"], "BRUIT", f"{best / 100:.2f} s de son entre « {a['w']} » et « {b['w']} »"))
for s, e, k, t in sorted(flags): print(f"{s:7.2f}-{e:7.2f}  {k:6s} {t}")
print("OK : aucun charabia détecté" if not flags else f"{len(flags)} passage(s) à écouter")
sys.exit(1 if flags else 0)
