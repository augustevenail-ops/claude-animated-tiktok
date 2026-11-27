#!/usr/bin/env python3
"""Génère en parallèle (4 requêtes à la fois) les prises manquantes de raw/ ; gen_v1.py fait ensuite le choix et le montage."""
import json, pathlib, sys
from concurrent.futures import ThreadPoolExecutor
sys.argv = [sys.argv[0]]
src = open(pathlib.Path(__file__).parent / "gen_v1.py", encoding="utf-8").read().split("# 1. génération")[0]
exec(src)
jobs = []
for p, (a, b) in enumerate(PASS):
    txt = " ".join(say(S[i]) for i in range(a, b + 1))
    for k in range(NT):
        f = RAW / f"p{p}_{k}.wav"
        if not f.exists(): jobs.append((f, txt))
def run(j):
    f, txt = j; d = tts(txt + "\n\nVoilà.\n\n"); tmp = f.with_suffix(".tmp"); tmp.write_bytes(d); tmp.rename(f); print("généré", f.name, flush=True)
with ThreadPoolExecutor(4) as ex: list(ex.map(run, jobs))
print("FIN", len(jobs))
