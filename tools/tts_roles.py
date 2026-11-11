# Voix multi-rôles d'un épisode : narrateur + personnages, chaque rôle avec sa voix ElevenLabs, son modèle, sa hauteur,
# son tempo et son effet (voices.json). Les répliques sont balisées dans SCRIPT.md : {role}« ... ».
# Règle des blancs (docs/VOIX.md) : pauses seulement en fin de phrase (end), petite respiration aux virgules (comma),
# mots liés à l'intérieur d'une phrase (inner, aucun trou), pause de tension avant certains mots ; entre une annonce
# « … te murmure : » et la réplique : before_quote.
# Usage : python tools/tts_roles.py productions/<ep>   -> voice/voice.wav (48 kHz), voice/words.json (w, s, e, role, q), voice/voice_ecoute.mp3
import base64, json, os, re, subprocess, sys, urllib.error, urllib.request
import numpy as np

EP = sys.argv[1]
CFG = json.load(open(os.path.join(EP, "voices.json"), encoding="utf-8"))
P = CFG["pauses"]
SR = 44100
OUT = os.path.join(EP, "voice"); os.makedirs(OUT, exist_ok=True)
CACHE = os.path.join(OUT, "_seg"); os.makedirs(CACHE, exist_ok=True)

src = open(os.path.join(EP, "SCRIPT.md"), encoding="utf-8").read()
body = src.split("## Script", 1)[1].split("\n", 1)[1].split("\n(Mots en gras")[0].split("\n## ")[0]
text = re.sub(r"\s*\n\s*", " ", re.sub(r"\*\*", "", body)).strip()
# segments : (rôle, texte) ; une réplique {role}« ... » devient un segment de ce rôle (guillemets retirés)
segs, pos = [], 0
for m in re.finditer(r"\{(\w+)\}«\s*(.*?)\s*»", text):
    if text[pos:m.start()].strip(): segs.append(("narrateur", text[pos:m.start()].strip()))
    segs.append((m.group(1), m.group(2).strip())); pos = m.end()
if text[pos:].strip(): segs.append(("narrateur", text[pos:].strip()))

def tts(role, txt, k):
    c = CFG[role]; key = f"{k:02d}_{role}"
    fa, fj = os.path.join(CACHE, key + ".mp3"), os.path.join(CACHE, key + ".json")
    sig = json.dumps([c["voice"], c["model"], c.get("settings"), c.get("prefix", ""), txt, c.get("suffix", "")], ensure_ascii=False)
    if os.path.exists(fj) and json.load(open(fj, encoding="utf-8")).get("sig") == sig: return fa, json.load(open(fj, encoding="utf-8"))["words"]
    body = {"text": c.get("prefix", "") + txt + c.get("suffix", ""), "model_id": c["model"], "language_code": "fr"}
    if c.get("settings"): body["voice_settings"] = c["settings"]
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{c['voice']}/with-timestamps?output_format=mp3_44100_128",
        data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("XI_API_KEY", "proxy-injected")})
    try:
        d = json.load(urllib.request.urlopen(req, timeout=300))
    except urllib.error.HTTPError as e:
        msg = e.read()[:300]
        if os.path.exists(fj):  # quota épuisé, etc. : on garde l'ancienne prise en le signalant
            print(f"ATTENTION segment {key} : API refusée ({e.code} {msg!r}) -> ancienne prise conservée (réglages différents)")
            return fa, json.load(open(fj, encoding="utf-8"))["words"]
        raise
    open(fa, "wb").write(base64.b64decode(d["audio_base64"]))
    al = d.get("normalized_alignment") or d["alignment"]
    words, cur = [], None
    for ch, a, b in zip(al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]):
        if ch.isspace():
            if cur: words.append(cur); cur = None
            continue
        if cur is None: cur = {"w": ch, "s": a, "e": b}
        else: cur["w"] += ch; cur["e"] = b
    if cur: words.append(cur)
    words = [w for w in words if re.search(r"\w", w["w"]) and not w["w"].startswith("[") and not w["w"].endswith("]")]
    for i in range(len(words) - 1): words[i]["e"] = min(words[i]["e"], words[i + 1]["s"])
    json.dump({"sig": sig, "words": words}, open(fj, "w", encoding="utf-8"), ensure_ascii=False)
    return fa, words

def decode(p):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).copy()

M, FADE = 0.03, int(0.012 * SR)
def tighten(x, W):
    """garde chaque mot, ramène chaque blanc à sa cible (fin de phrase / virgule / intérieur / tension)"""
    pieces, seg0 = [], max(0.0, W[0]["s"] - 0.04)
    for i in range(len(W) - 1):
        w, n = W[i], W[i + 1]; gap = n["s"] - w["e"]
        if any(n["w"].lower().strip("«».…").startswith(t) for t in P["tension_words"]): tgt = P["tension"]
        elif re.search(r"[.?!…]$", w["w"]): tgt = P["end"]
        elif re.search(r"[,:;]$", w["w"]): tgt = P["comma"]
        else: tgt = P["inner"]
        if gap > tgt + 2 * M:
            half = max(0.0, tgt - 2 * M) / 2
            pieces.append((seg0, w["e"] + M + half)); seg0 = n["s"] - M - half
    pieces.append((seg0, W[-1]["e"] + 0.5))  # queue naturelle (souffle, écho) gardée puis fondue, mélangée au segment suivant
    out, mp, acc = [], [], 0.0
    for a, b in pieces:
        s = x[int(a * SR):int(b * SR)].copy()
        if len(s) > 2 * FADE: s[:FADE] *= np.linspace(0, 1, FADE); s[-FADE:] *= np.linspace(1, 0, FADE)
        out.append(s); mp.append((a, b, acc)); acc += b - a
    def rm(t):
        for a, b, n0 in mp:
            if t <= b: return n0 + max(0.0, t - a)
        return acc
    y = np.concatenate(out); tail = int(0.35 * SR)
    y[-tail:] *= np.cos(np.linspace(0, np.pi / 2, tail)) ** 2  # fondu doux, plus de coupure nette
    return y, [{"w": w["w"], "s": rm(w["s"]), "e": rm(w["e"])} for w in W], rm(W[-1]["e"]) + 0.1

def process(x, role):
    c = CFG[role]; af = []
    if c.get("pitch") or c.get("tempo", 1) != 1: af.append(f"rubberband=pitch={2 ** (c.get('pitch', 0) / 12):.5f}:tempo={c.get('tempo', 1)}:pitchq=quality")
    if c.get("fx"): af.append(c["fx"])
    if not af: return x
    r = subprocess.run(["ffmpeg", "-v", "error", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-af", ",".join(af), "-f", "f32le", "-"],
                       input=x.astype(np.float32).tobytes(), capture_output=True, check=True).stdout
    return np.frombuffer(r, np.float32).copy()

audio, words, t = np.zeros(int(400 * SR)), [], 0.0
for k, (role, txt) in enumerate(segs):
    fa, W = tts(role, txt, k)
    x, W, core = tighten(decode(fa), W)
    tempo = CFG[role].get("tempo", 1)
    y = process(x, role)
    for j, w in enumerate(W):
        words.append({"w": w["w"], "s": round(t + w["s"] / tempo, 3), "e": round(t + w["e"] / tempo, 3), "role": role, **({"q": 1} if role != "narrateur" and j == 0 else {})})
    i0 = int(t * SR); audio[i0:i0 + len(y)] += y      # superposition : la queue déborde sur le blanc suivant
    end = t + len(y) / SR
    nxt = segs[k + 1][0] if k + 1 < len(segs) else None
    gap = P["before_quote"] if nxt and nxt != "narrateur" and txt.rstrip().endswith(":") else P["end"]
    gap = max(0.0, gap - 0.14)  # la tête (0,04 s) et la fin utile (0,1 s) des segments comptent déjà dans le blanc
    t += core / tempo + gap
y = audio[: int(max(end, t) * SR)]
subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", "48000", os.path.join(OUT, "voice.wav")], input=y.astype(np.float32).tobytes(), check=True)
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(OUT, "voice.wav"), "-b:a", "160k", os.path.join(OUT, "voice_ecoute.mp3")])
json.dump(words, open(os.path.join(OUT, "words.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
open(os.path.join(OUT, "text.txt"), "w", encoding="utf-8").write(text)
print(f"{len(segs)} segments ; {len(words)} mots ; durée {len(y) / SR:.2f} s")
