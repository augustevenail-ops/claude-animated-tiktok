#!/usr/bin/env python3
"""Assemble la voix complète de l'épisode 1 à partir des clips (une phrase par clip).
- pauses internes plafonnées selon la ponctuation du script (virgule 0,18 s ; deux-points 0,28 s ; point interne 0,35 s ;
  aucune ponctuation 0,06 s) : coupe au centre du silence, fondu enchaîné 20 ms ;
- silences entre phrases = tableau GAPS (secondes de silence réel) ;
- bords de clip rognés + fondus 8 ms ; aucun fondu < 8 ms.
  python3 build_v8.py"""
import difflib, json, re, subprocess, unicodedata
import numpy as np

from faster_whisper import WhisperModel
from gen_clips import CLIPS

SR = 44100
GAPS = dict(s01=.55, s02=.45, s03=.50, s04=.70, s05=.45, s06=.70, s07=.50, s08=.55, s09=.70, s10=.60, s11=.50, s12=.45,
            s13=.45, pere=.55, s14=.45, s15=.50, s16=.45, s17=.70, s18=.50, s19=.45, s20=.75, s21=.45, s22=.55,
            radio=.55, s23=.45, s24=.35)
CAP_PONCT = {",": .20, ":": .30, ".": .40, "?": .40, "!": .40, "": .05}   # pause interne max selon la ponctuation du script
CAP_CLIP = dict(s23={",": .18}, radio={",": .28, ":": .28})                     # dilemme : virgule rapide ; radio
norm = lambda w: re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", w.lower()).encode("ascii", "ignore").decode())
NUM = {"10": "dix", "000": "mille", "1": "un", "2": "deux", "3": "trois"}

def load(f):
    return np.frombuffer(subprocess.run(["ffmpeg", "-v", "quiet", "-i", f, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout, np.float32).copy()
def db(a):
    return 20 * np.log10(np.sqrt(np.mean(a ** 2)) + 1e-9)
def runs_below(a, t0, t1, thr, hop=0.01, win=0.02):
    i0, i1, h, w = int(max(t0, 0) * SR), int(min(t1, len(a) / SR) * SR), int(hop * SR), int(win * SR)
    out, s = [], None
    for i in range(i0, i1, h):
        low = db(a[i:i + w]) < thr
        if low and s is None: s = i
        if not low and s is not None: out.append((s / SR, i / SR)); s = None
    if s is not None: out.append((s / SR, i1 / SR))
    return out
def xcut(a, t0, t1, cf=0.02):
    i0, i1, n = int(t0 * SR), int(t1 * SR), int(cf * SR)
    w = np.linspace(0, np.pi / 2, n, dtype=np.float32)
    mid = a[i0 - n:i0] * np.cos(w) + a[i1:i1 + n] * np.sin(w)
    return np.concatenate([a[:i0 - n], mid, a[i1 + n:]])


model = WhisperModel("small", device="cpu", compute_type="int8")
def word_ends(a, clean):
    a16 = np.interp(np.arange(0, len(a), SR / 16000), np.arange(len(a)), a).astype(np.float32)
    segs, _ = model.transcribe(a16, language="fr", word_timestamps=True, condition_on_previous_text=False)
    heard = [(w.word.strip(), w.start, w.end) for s in segs for w in s.words if norm(w.word)]
    return heard
def merged_runs(a, thr=-26, gap=0.05):
    rs = runs_below(a, 0.05, len(a) / SR - 0.05, thr); out = []
    for r in rs:
        if out and r[0] - out[-1][1] < gap: out[-1] = (out[-1][0], r[1])
        else: out.append(r)
    return out
def process(cid, text):
    a = load(f"clips/{cid}.mp3"); cuts, log = [], []
    clean = re.sub(r"\s+([:?!])", r"\1", re.sub(r"\[[^\]]*\]|<[^>]*>|[«»]", "", text)).split()   # « répond : » -> « répond: »
    heard = word_ends(a, clean)
    # ponctuation du script, dans l'ordre : on associe la k-ième pause longue/ponctuée au k-ième mot entendu le plus proche
    punct_words = [(norm(w), w[-1] if w[-1] in ",:.?!" else "") for w in clean]
    for rs0, rs1 in merged_runs(a):
        L = rs1 - rs0
        if L < 0.08 or rs0 < 0.12 or rs1 > len(a) / SR - 0.12: continue   # tête/queue : rognées plus bas
        near = min(heard, key=lambda h: abs(h[2] - rs0))                # mot entendu dont la fin est la plus proche de la pause
        nn = norm(near[0]); cand = [pw for pw in punct_words if pw[0] and (pw[0] == nn or pw[0].endswith(nn) or nn.endswith(pw[0]))]
        punct = cand[0][1] if cand else ""
        if len(set(c[1] for c in cand)) > 1: punct = max((c[1] for c in cand), key=lambda x: CAP_PONCT[x])   # mot répété : on garde la ponctuation la plus permissive
        cap = CAP_CLIP.get(cid, {}).get(punct, CAP_PONCT[punct])
        if L > cap + 0.03:
            keep = cap / 2; cuts.append((rs0 + keep, rs1 - keep)); log.append((cid, near[0], round(rs0, 2), round(L, 2), "->", cap))
    for t0, t1 in sorted(cuts, reverse=True): a = xcut(a, t0, t1, cf=min(0.02, (t1 - t0) / 2, 0.02))
    # bords : rogner jusqu'à -42 dB, garder 30 ms, fondus 8 ms
    h = int(0.01 * SR); e = [db(a[i:i + h]) for i in range(0, len(a) - h, h)]
    act = [i for i, v in enumerate(e) if v > -42]
    s0 = max(act[0] * h - int(0.03 * SR), 0); s1 = min((act[-1] + 1) * h + int(0.05 * SR), len(a)); a = a[s0:s1].copy()
    n = int(0.008 * SR); a[:n] *= np.linspace(0, 1, n, dtype=np.float32); a[-n:] *= np.linspace(1, 0, n, dtype=np.float32)
    return a, log

parts, timeline, t, alllog = [], [], 0.0, []
for cid, _, _, text in CLIPS:
    a, log = process(cid, text); alllog += log
    timeline.append({"id": cid, "start": round(t, 3), "end": round(t + len(a) / SR, 3), "text": re.sub(r"\[[^\]]*\]|<[^>]*>", "", text).strip()})
    parts.append(a); t += len(a) / SR
    if cid in GAPS and cid != CLIPS[-1][0]:
        parts.append(np.zeros(int(GAPS[cid] * SR), np.float32)); t += GAPS[cid]
full = np.clip(np.nan_to_num(np.concatenate(parts)), -0.98, 0.98).astype(np.float32)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-codec:a", "libmp3lame", "-b:a", "192k", "voix_complete_v8.mp3"], input=full.tobytes(), check=True)
json.dump({"duree": round(len(full) / SR, 2), "clips": timeline}, open("timeline_v8.json", "w"), ensure_ascii=False, indent=1)
for l in alllog: print("coupe", *l)
print("durée", round(len(full) / SR, 2), "s ; pic", round(float(np.abs(full).max()), 3))
