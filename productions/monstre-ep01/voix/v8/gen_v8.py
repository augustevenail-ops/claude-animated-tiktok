#!/usr/bin/env python3
"""Voix off v8 : voix « Jfoot » (fish.audio/m/a829cc490b6c4c0085b9e86c15dfcc42), accélérée ×1,1.
Génération par passages de plusieurs phrases (intonation continue), plusieurs prises par passage, phrase factice
finale contre les coupures ; choix de la prise par alignement + intonation ; phrases jamais coupées ;
silences entre phrases ramenés à GAP secondes. Sortie : ../voix_off_v8.wav + v8/report.json
  python3 gen_v8.py [prises=3]"""
import json, re, subprocess, sys, time, unicodedata, urllib.request, urllib.error, pathlib
import numpy as np, torch, torchaudio
from torchaudio.pipelines import MMS_FA as B
D = pathlib.Path(__file__).parent; V = D.parent; RAW = D / "raw"; RAW.mkdir(exist_ok=True)
REF = "a829cc490b6c4c0085b9e86c15dfcc42"; MODEL = "s2.1-pro-free"; TEMPO = 1.1; GAP = 0.25; SR = 48000
S = json.load(open(V / "phrases/phrases.json", encoding="utf-8"))
PASS = [(0, 4), (5, 10), (11, 14), (15, 20), (21, 26), (27, 30), (31, 35), (36, 40), (41, 44)]
NT = int(sys.argv[1]) if len(sys.argv) > 1 else 3
say = lambda t: t.replace("2h13", "deux heures treize").replace("« ", "").replace(" »", "").replace("«", "").replace("»", "")
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
# 2. analyse et montage
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
    hop = len(x16) // len(pf); e = np.array([np.sqrt((x16[i * hop:(i + 1) * hop] ** 2).mean()) for i in range(len(pf))])
    ok = (e > e.max() * 0.1) & (pf > 75) & (pf < 380); sd = float(np.std(12 * np.log2(pf[ok] / np.median(pf[ok]))))
    n = int(0.01 * SR); db = 20 * np.log10(np.sqrt(np.add.reduceat(x ** 2, np.arange(0, len(x), n)) / n) + 1e-9)
    bounds, j = [], 0                                   # [début, fin] de chaque phrase (indices de mots)
    for s in sents: bounds.append((j, j + len(s) - 1)); j += len(s)
    segs, holes = [], 0
    for q, (w0, w1) in enumerate(bounds):
        prev_cut = segs[-1][1] if segs else 0.0
        k0 = int(st[w0] * 100)                          # début : dernier instant calme juste avant le 1er mot
        k = k0
        while k > max(0, k0 - 15) and db[k - 1] > -45: k -= 1
        s0 = max(prev_cut, k / 100 - 0.01)
        nxt = st[w1 + 1]                                # mot suivant (ou « voilà »)
        lo, hi = int((en[w1] + 0.03) * 100), int((min(nxt - 0.03, en[w1] + 0.4)) * 100)
        k = lo                                          # fin : premier instant calme après le dernier mot
        while k < hi and db[k] > -45: k += 1
        cut = min(k / 100 + 0.04, hi / 100) if hi > lo else en[w1] + 0.02
        segs.append((s0, cut))
        inner = db[int(st[w0] * 100):int(en[w1] * 100)] < -45; run = best = 0
        for v in inner: run = run + 1 if v else 0; best = max(best, run)
        holes = max(holes, best * 0.01)
    return dict(x=x, segs=segs, mean=float(np.mean(sc)), min=float(min(sc)), worst=words[int(np.argmin(sc))], sd=sd, hole=holes)
out, rep = [np.zeros(int(0.2 * SR))], []
for p, (a, b) in enumerate(PASS):
    cand = [(f, analyse(f, a, b)) for f in sorted(RAW.glob(f"p{p}_*.wav"))]
    good = [c for c in cand if c[1]["min"] >= 0.3 and c[1]["mean"] >= 0.88 and c[1]["hole"] <= 0.7] or cand
    f, A = max(good, key=lambda c: c[1]["sd"] + 2 * c[1]["mean"])
    rep.append(dict(passage=p, take=f.name, **{k: round(v, 3) if isinstance(v, float) else v for k, v in A.items() if k not in ("x", "segs")},
                    candidats=[(c[0].name, round(c[1]["mean"], 3), round(c[1]["min"], 3), round(c[1]["sd"], 2), round(c[1]["hole"], 2)) for c in cand]))
    for q, (s0, s1) in enumerate(A["segs"]):
        seg = A["x"][int(s0 * SR):int(s1 * SR)].copy(); fi, fo = int(0.005 * SR), int(0.03 * SR)
        if p == 0 and q == 0:                           # 1re phrase : la prise validée par l'utilisateur (A, fin montante)
            o = load(V / "casting/jfoot_x1.1_A_fin_montante.wav", SR); n = int(0.01 * SR)
            odb = 20 * np.log10(np.sqrt(np.add.reduceat(o ** 2, np.arange(0, len(o), n)) / n) + 1e-9); on = np.where(odb > -45)[0]
            o = o[max(0, on[0] - 4) * n:(on[-1] + 4) * n]
            rms = lambda z: np.sqrt(np.mean(z[np.abs(z) > 0.02 * np.abs(z).max()] ** 2))
            seg = o * rms(seg) / rms(o); rep[-1]["phrase1"] = "prise validée A"
        seg[:fi] *= np.linspace(0, 1, fi); seg[-fo:] *= np.linspace(1, 0, fo)
        out += [seg, np.zeros(int(GAP * SR))]
    print("passage", p, "->", f.name, rep[-1]["candidats"], flush=True)
v = np.concatenate(out + [np.zeros(int(0.9 * SR))]); v = v / np.abs(v).max() * 0.89
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f64le", "-ar", str(SR), "-ac", "1", "-i", "-", "-c:a", "pcm_s24le", str(V / "voix_off_v8.wav")], input=v.tobytes(), check=True)
json.dump(rep, open(D / "report.json", "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("durée", round(len(v) / SR, 2))
