#!/usr/bin/env python3
"""Prises « protégées » : chaque phrase est suivie d'une phrase factice (« Voilà. ») pour que le modèle ne coupe pas
la dernière syllabe ; cut_phrases2.py découpe ensuite par alignement dans le silence qui les sépare.
  python3 gen_phrases2.py [n_prises=2] [indices...]   -> phrases2/NN_k.wav"""
import json, sys, pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from gen_phrases import S, tts as _tts  # même découpage, même voix et mêmes réglages
D = pathlib.Path(__file__).parent; P2 = D / "phrases2"; P2.mkdir(exist_ok=True)
DUMMY = "\n\nVoilà."
n = int(sys.argv[1]) if len(sys.argv) > 1 else 2
idx = [int(x) for x in sys.argv[2:]] or range(len(S))
for i in idx:
    for _ in range(n):
        k = len(list(P2.glob(f"{i:02d}_*.wav"))); (P2 / f"{i:02d}_{k}.wav").write_bytes(_tts(S[i] + DUMMY)); print(i, k, flush=True)
