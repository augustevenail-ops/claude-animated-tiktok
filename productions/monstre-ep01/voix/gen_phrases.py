#!/usr/bin/env python3
"""Voix off phrase par phrase (Fish Audio, voix 15ba126e…), pour éviter les coupures et maîtriser les silences.
  python3 gen_phrases.py            -> génère les phrases manquantes dans phrases/NN_k.wav
  python3 gen_phrases.py 3 17       -> régénère les phrases 3 et 17 (nouvelle prise)
"""
import json, re, sys, time, urllib.request, urllib.error, pathlib
D = pathlib.Path(__file__).parent; P = D / "phrases"; P.mkdir(exist_ok=True)
REF = "15ba126e214c4eae9c69d5a01bbbf53c"; MODEL = "s2.1-pro-free"
text = (D / "texte.txt").read_text(encoding="utf-8").strip()
cuts = [m.end() for m in re.finditer(r"[.!?](\s»)?\s+", text)]
S = []
for a, b in zip([0] + cuts, cuts + [len(text)]):
    t = text[a:b].strip()
    if not t: continue
    if not re.search(r"\w", t) and S: S[-1] += " " + t
    else: S.append(t)
if __name__ == "__main__": json.dump(S, open(P / "phrases.json", "w", encoding="utf-8"), ensure_ascii=False, indent=0)
def tts(t):
    t = t.replace("2h13", "deux heures treize").replace("« ", "").replace(" »", "") + "\n\n"  # saut de ligne final : évite la dernière syllabe coupée
    body = {"text": t, "reference_id": REF, "format": "wav", "normalize": True, "latency": "normal",
            "temperature": 0.8, "top_p": 0.8, "prosody": {"speed": 1.0, "volume": 0}}
    for k in range(6):
        req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(),
              {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": MODEL})
        try: return urllib.request.urlopen(req, timeout=300).read()
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503): time.sleep(5 * (k + 1)); continue
            raise
    raise RuntimeError("échec TTS")
redo = {int(x) for x in sys.argv[1:]}
for i, t in (enumerate(S) if __name__ == "__main__" else []):
    takes = sorted(P.glob(f"{i:02d}_*.wav"))
    if takes and i not in redo: continue
    k = len(takes); (P / f"{i:02d}_{k}.wav").write_bytes(tts(t)); print(i, k, t[:60], flush=True)
if __name__ == "__main__": print(len(S), "phrases")
