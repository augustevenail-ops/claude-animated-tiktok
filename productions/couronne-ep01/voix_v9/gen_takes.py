#!/usr/bin/env python3
"""Plusieurs prises des phrases à corriger (Fish REST, voix Narrateur Expressif et Profond), vitesse 1.0.
  python3 gen_takes.py"""
import json, sys, urllib.request, urllib.error
from pathlib import Path
NARR = "15ba126e214c4eae9c69d5a01bbbf53c"
T = "[serious][soft tone] "
JOBS = {
 "s04":   [T + "Le champ magnétique vous protège des radiations extérieures, mais le conseil vient d'annoncer qu'il n'y a plus assez d'énergie pour le maintenir sur les districts."] * 12,
 "radio": ["[serious] Le conseil annonce à la radio : seul le centre restera protégé à cause du manque d'énergie, les agitateurs seront exécutés."] * 12,
 "dil":   [T + "Tu révèles ce que tu sais à tout le dôme et ton père risque d'être exécuté, [questioning] ou tu te tais ?",
           T + "Tu révèles ce que tu sais à tout le dôme et ton père risque d'être exécuté, ou tu te tais [rising intonation, questioning] ?",
           "[serious] Tu révèles ce que tu sais à tout le dôme et ton père risque d'être exécuté, [curious, questioning tone] ou tu te tais ?",
           T + "Tu révèles ce que tu sais à tout le dôme et ton père risque d'être exécuté, ou [questioning] tu te tais ?"] * 3,
}
def gen(text):
    body = {"text": text, "reference_id": NARR, "format": "mp3", "mp3_bitrate": 192, "normalize": True, "latency": "normal"}
    req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
        {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": "s2.1-pro"})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Fish {e.code}: {e.read().decode()[:300]}")
if __name__ == "__main__":
    for name, texts in JOBS.items():
        for k, text in enumerate(texts):
            f = Path("takes") / f"{name}_{k:02d}.mp3"
            if not f.exists(): f.write_bytes(gen(text)); print(f, f.stat().st_size, flush=True)
    json.dump({n: t for n, t in JOBS.items()}, open("takes/textes.json", "w"), ensure_ascii=False, indent=1)
