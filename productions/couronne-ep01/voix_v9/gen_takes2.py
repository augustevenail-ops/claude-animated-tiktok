#!/usr/bin/env python3
"""v10 : prises du dilemme (ton interrogatif modéré) et de la phrase « Un mur le sépare des districts »."""
import json, sys, urllib.request, urllib.error
from pathlib import Path
NARR = "15ba126e214c4eae9c69d5a01bbbf53c"
T = "[serious][soft tone] "
D = "Tu révèles ce que tu sais à tout le dôme et ton père risque d'être exécuté, "
JOBS = {
 "dil2": [("s2.1-pro", T + D + "ou tu te tais [strongly rising question intonation] ?"),
          ("s2.1-pro", T + D + "[questioning tone] ou tu te tais [rising pitch at the end] ?"),
          ("s2.1-pro", T + D + "ou [curious, uncertain] tu te tais [rising] ?"),
          ("s2.1-pro", T + D + "[asking, voice rising at the end] ou tu te tais ?"),
          ("drama-3", T + D + "[asking a worried question, voice rising at the end] ou tu te tais ?")] * 4,
 "mur":  [("s2.1-pro", T + "Un mur le sépare des districts.")] * 6,
}
def gen(model, text):
    body = {"text": text, "reference_id": NARR, "format": "mp3", "mp3_bitrate": 192, "normalize": True, "latency": "normal"}
    req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
        {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": model})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Fish {e.code}: {e.read().decode()[:300]}")
meta = {}
for name, jobs in JOBS.items():
    for k, (model, text) in enumerate(jobs):
        f = Path("takes") / f"{name}_{k:02d}.mp3"; meta[f.name] = {"model": model, "text": text}
        if not f.exists(): f.write_bytes(gen(model, text))
json.dump(meta, open("takes/textes2.json", "w"), ensure_ascii=False, indent=1)
print(len(meta), "prises")
