#!/usr/bin/env python3
"""Voix off v11 : v10 + fins de phrase plus basses (choix de prise PAR PHRASE parmi 6) et TEMPO 1.1.
Les Dessins ép. 1 : même voix et mêmes réglages que Monstre v11 (787591f6, s2.1-pro-free, x1.1, 6 prises, choix par phrase).
Voix off v10 : voix fish.audio/m/787591f6a440423a9f21106a05637a57 (même méthode que v8).
Génération par passages de plusieurs phrases (intonation continue), plusieurs prises par passage, phrase factice
finale contre les coupures ; choix de la prise par alignement + intonation ; phrases jamais coupées ;
silences entre phrases ramenés à GAP secondes. Sortie : ../voix_off_v10.wav + v10/report.json
  python3 gen_v8.py [prises=3]"""
import json, re, subprocess, sys, time, unicodedata, urllib.request, urllib.error, pathlib
import numpy as np, torch, torchaudio
from torchaudio.pipelines import MMS_FA as B
D = pathlib.Path(__file__).parent; V = D; RAW = D / "raw"; RAW.mkdir(exist_ok=True)
import os
REF = "787591f6a440423a9f21106a05637a57"; MODEL = "s2.1-pro-free"; TEMPO = float(os.environ.get("TEMPO", "1.1")); GAP = 0.3; SR = 48000
S = json.load(open(D / "phrases.json", encoding="utf-8"))
PASS = [(0,2),(3,4),(5,8),(9,11),(12,15),(16,18),(19,21),(22,24),(25,26),(27,29),(30,33),(34,37),(38,41),(42,43),(44,46)]
NT = int(sys.argv[1]) if len(sys.argv) > 1 else 6
say = lambda t: t.replace("« ", "").replace(" »", "").replace("«", "").replace("»", "")
rom = lambda w: re.sub(r"[^a-z']", "", unicodedata.normalize("NFD", w.lower().replace("œ", "oe").replace("’", "'")).encode("ascii", "ignore").decode()).strip("'")
def tts(t):
    body = {"text": t, "reference_id": REF, "format": "wav", "normalize": True, "latency": "normal", "temperature": 0.9, "top_p": 0.9}
    for k in range(6):
        try:
            return urllib.request.urlopen(urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
                   {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": MODEL}), timeout=300).read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503): time.sleep(5 * (k + 1)); continue
            raise
    raise RuntimeError("TTS")
def load(p, sr, af=None):
    cmd = ["ffmpeg", "-v", "quiet", "-i", str(p)] + (["-af", af] if af else []) + ["-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True).stdout, np.float32).astype(np.float64)
# 1. génération
for p, (a, b) in enumerate(PASS):
    txt = " ".join(say(S[i]) for i in range(a, b + 1))
    for k in range(NT):
        f = RAW / f"p{p}_{k}.wav"
        if not f.exists(): f.write_bytes(tts(txt + "\n\nVoilà.\n\n")); print("généré", f.name, flush=True)
# 2. analyse phrase par phrase
model, tok, aligner = B.get_model(), B.get_tokenizer(), B.get_aligner()
def analyse(f, a, b):
    sents = [[w for w in say(S[i]).split() if rom(w)] for i in range(a, b + 1)]
    words = [w for s in sents for w in s]; toks = [rom(w) for w in words] + ["voila"]
    x = load(f, SR, f"atempo={TEMPO}"); x16 = load(f, 16000, f"atempo={TEMPO}")
    with torch.inference_mode():
        em, _ = model(torch.from_numpy(x16.astype(np.float32))[None]); sp = aligner(em[0], tok(toks))
    r = len(x16) / em.shape[1] / 16000
    st = [s[0].start * r for s in sp]; en = [s[-1].end * r for s in sp]; sc = [float(np.mean([y.score for y in s])) for s in sp[:-1]]
    pf = torchaudio.functional.detect_pitch_frequency(torch.from_numpy(x16.astype(np.float32))[None], 16000, frame_time=0.02, win_length=15, freq_low=70, freq_high=400)[0].numpy()
    hop = len(x16) / len(pf); e = np.array([np.sqrt((x16[int(i * hop):int((i + 1) * hop)] ** 2).mean()) for i in range(len(pf))])
    ok = (e > e.max() * 0.1) & (pf > 75) & (pf < 380); med = np.median(pf[ok])
    st_ = lambda t: int(t * 16000 / hop)
    n = int(0.01 * SR); db = 20 * np.log10(np.sqrt(np.add.reduceat(x ** 2, np.arange(0, len(x), n)) / n) + 1e-9)
    bounds, j = [], 0
    for s in sents: bounds.append((j, j + len(s) - 1)); j += len(s)
    res, prev_cut = [], 0.0
    for q, (w0, w1) in enumerate(bounds):
        k0 = int(st[w0] * 100); k = k0
        while k > max(0, k0 - 15) and db[k - 1] > -45: k -= 1
        s0 = max(prev_cut, k / 100 - 0.01)
        nxt = st[w1 + 1]
        lo, hi = int((en[w1] + 0.03) * 100), int((min(nxt - 0.03, en[w1] + 0.4)) * 100)
        k = lo
        while k < hi and db[k] > -45: k += 1
        cut = min(k / 100 + 0.04, hi / 100) if hi > lo else en[w1] + 0.02
        prev_cut = cut
        inner = db[int(st[w0] * 100):int(en[w1] * 100)] < -45; run = best = 0
        for v in inner: run = run + 1 if v else 0; best = max(best, run)
        i0, i1 = st_(st[w0]), st_(en[w1]); sl = slice(i0, i1); m = ok[sl]
        ps = pf[sl][m]; sdq = float(np.std(12 * np.log2(ps / med))) if m.sum() > 5 else 0.0
        e0 = st_(max(st[w1], en[w1] - 0.3)); tail = pf[e0:i1][ok[e0:i1]]
        drop = float(12 * np.log2(np.median(tail) / np.median(ps))) if len(tail) >= 2 and m.sum() > 5 else 0.0
        scs = sc[w0:w1 + 1]
        res.append(dict(seg=(s0, cut), mean=float(np.mean(scs)), min=float(min(scs)), hole=best * 0.01, sd=sdq, drop=drop))
    return x, res
SEL = []
FORCE = {21: "p6_5.wav", 41: "p12_5.wav"}   # prises écartées : syllabes inventées en fin de passage (p6_4 « ce m.. », p12_2 « ça m.. »)
out, rep = [np.zeros(int(0.2 * SR))], []
for p, (a, b) in enumerate(PASS):
    cand = [(f, *analyse(f, a, b)) for f in sorted(RAW.glob(f"p{p}_*.wav"))]
    for q in range(b - a + 1):
        txt = S[a + q].rstrip(" »"); question = txt.endswith("?")
        cs = [(f, x, R[q]) for f, x, R in cand]
        good = [c for c in cs if c[2]["min"] >= 0.3 and c[2]["mean"] >= 0.88 and c[2]["hole"] <= 0.5] or cs
        if a + q in FORCE: good = [c for c in cs if c[0].name == FORCE[a + q]]
        key = (lambda c: 0.5 * c[2]["sd"] + 5 * c[2]["mean"]) if question else (lambda c: -c[2]["drop"] + 0.3 * c[2]["sd"] + 5 * c[2]["mean"])
        f, x, A = max(good, key=key)
        s0, s1 = A["seg"]; seg = x[int(s0 * SR):int(s1 * SR)].copy()
        rms = np.sqrt(np.mean(seg[np.abs(seg) > 0.02 * np.abs(seg).max()] ** 2)); SEL.append(rms)
        rep.append(dict(phrase=a + q, take=f.name, drop=round(A["drop"], 2), mean=round(A["mean"], 3), min=round(A["min"], 3),
                        drops=[(c[0].name, round(c[2]["drop"], 2)) for c in cs]))
        out += [(seg, rms), None]
    print("passage", p, [(r["phrase"], r["take"], r["drop"]) for r in rep[-(b - a + 1):]], flush=True)
tgt = float(np.median(SEL)); fi, fo = int(0.005 * SR), int(0.03 * SR); final = [out[0]]
for o in out[1:]:
    if o is None: final.append(np.zeros(int(GAP * SR))); continue
    seg, rms = o; seg = seg * (tgt / rms) ** 0.5           # égalise à moitié le niveau entre prises
    seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo); final.append(seg)
v = np.concatenate(final + [np.zeros(int(0.9 * SR))]); v = v / np.abs(v).max() * 0.89
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", str(V / "voix_off_v1.wav")], input=v.tobytes(), check=True)
json.dump(rep, open(D / "report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
d = [r["drop"] for r in rep]; print("durée", round(len(v) / SR, 2), "chute médiane fin de phrase", round(float(np.median(d)), 2), "demi-tons")
