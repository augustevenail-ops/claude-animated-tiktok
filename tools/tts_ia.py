#!/usr/bin/env python3
"""Voix IA du narrateur : Fish Audio s1 (défaut, balises (émotion)) ou ElevenLabs eleven_v3 (balises [émotion]).

Réglages : productions/<ep>/voix_ia/voix_ia.json (« provider » : fish | elevenlabs, et le script de chacun).
Script : une phrase par ligne, chaque phrase précédée de sa balise d'émotion (obligatoire, vérifié).

  python3 tools/tts_ia.py productions/mur-ep01 --check          # vérifie les balises, n'appelle pas l'API
  python3 tools/tts_ia.py productions/mur-ep01 --test 3          # génère seulement la ligne n° 3 (essai)
  python3 tools/tts_ia.py productions/mur-ep01 --texte "[whispers] ..."   # essai libre
  python3 tools/tts_ia.py productions/mur-ep01                   # génère tout -> voix_ia/voice.mp3 + words.json

Options : --fallback (voix de secours), --free (ElevenLabs : voix premade), --provider elevenlabs.
Clés : injectées par le proxy (api.fish.audio, api.elevenlabs.io), aucune variable d'environnement nécessaire.
"""
import base64, json, re, subprocess, sys, urllib.request, urllib.error
import numpy as np
from pathlib import Path

API = "https://api.elevenlabs.io/v1/text-to-speech/{v}/with-timestamps?output_format=mp3_44100_128"
TAG = re.compile(r"\[[^\]]+\]|\([a-z][a-z -]*\)")
FISH = "https://api.fish.audio/v1/tts"


def lines(script: Path):
    out = [l.strip() for l in script.read_text(encoding="utf-8").splitlines() if re.match(r"^(\[|\([a-z]|\{pause|\{vitesse)", l.strip())]
    bad = []
    for i, l in enumerate(out, 1):
        if l.startswith("{"): continue
        if not re.match(r"^((\[[^\]]+\]|\([a-z][a-z -]*\))\s*)+\S", l):
            bad.append((i, "pas de texte après la balise", l))
        body = TAG.sub("", l).strip()
        # une seule phrase par ligne : pas de . ! ? suivi d'une autre phrase (les « … » internes sont permis)
        if re.search(r"[.!?](?!\.)\s+\S", body.replace("…", "")):
            bad.append((i, "plusieurs phrases sur une ligne : une balise par phrase", l))
    if bad:
        for i, why, l in bad: print(f"ligne {i}: {why}\n   {l}")
        sys.exit(1)
    return out


def tts(cfg: dict, text: str, voice: str):
    body = {"text": text, "model_id": cfg["model_id"], "language_code": cfg["language_code"], "voice_settings": cfg["voice_settings"]}
    req = urllib.request.Request(API.format(v=voice), json.dumps(body).encode(), {"Content-Type": "application/json", "xi-api-key": "proxy-injected"})
    try:
        with urllib.request.urlopen(req, timeout=300) as r: return json.load(r)
    except urllib.error.HTTPError as e:
        sys.exit(f"ElevenLabs {e.code}: {e.read().decode()[:400]}")


def fish(cfg: dict, text: str, ref: str) -> bytes:
    body = {"text": text, "reference_id": ref, "format": cfg["format"], "mp3_bitrate": cfg["mp3_bitrate"], "normalize": cfg["normalize"],
            "latency": cfg["latency"], "temperature": cfg["temperature"], "top_p": cfg["top_p"], "prosody": cfg["prosody"]}
    req = urllib.request.Request(FISH, json.dumps(body).encode(), {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": cfg["model"]})
    try:
        with urllib.request.urlopen(req, timeout=600) as r: return r.read()
    except urllib.error.HTTPError as e:
        sys.exit(f"Fish Audio {e.code}: {e.read().decode()[:400]}")


def words(al: dict, text: str):
    """minutage caractère -> mots, balises retirées (elles ne sont pas prononcées)"""
    ch, st, en = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
    out, cur, s, e, depth = [], "", None, None, 0
    for c, a, b in zip(ch, st, en):
        if c == "[": depth += 1; continue
        if c == "]": depth -= 1; continue
        if depth: continue
        if c.isspace():
            if cur: out.append({"w": cur, "s": round(s, 3), "e": round(e, 3)}); cur = ""
            continue
        if not cur: s = a
        cur += c; e = b
    if cur: out.append({"w": cur, "s": round(s, 3), "e": round(e, 3)})
    return out


def main():
    ep = Path(sys.argv[1]); d = ep / "voix_ia"; full = json.loads((d / "voix_ia.json").read_text())
    prov = sys.argv[sys.argv.index("--provider") + 1] if "--provider" in sys.argv else full["provider"]; cfg = full[prov]
    L = lines(d / cfg["script"])
    if "--check" in sys.argv: print(f"{sum(not l.startswith('{') for l in L)} phrases, toutes balisées ({prov})."); return
    if "--texte" in sys.argv:                       # essai libre (court, pour économiser les crédits)
        text, out = sys.argv[sys.argv.index("--texte") + 1], d / f"essai_texte_{prov}"
    elif "--outro" in sys.argv:                     # ligne « OUTRO: » du script (carton final)
        text = next(l[6:].strip() for l in (d / cfg["script"]).read_text(encoding="utf-8").splitlines() if l.startswith("OUTRO:")); out = d / "outro"
        if prov == "fish":                          # même timbre que le récit : générée à la suite des 2 dernières phrases, puis découpée
            ref = cfg["fallback_reference_id"] if "--fallback" in sys.argv else cfg["reference_id"]
            vit = [float(v) for v in re.findall(r"\{vitesse ([0-9.]+)\}", "\n".join(L))]   # vitesse en vigueur à la fin du récit
            if vit: cfg = {**cfg, "prosody": {**cfg["prosody"], "speed": vit[-1]}}
            x = decode(fish(cfg, "\n".join(L[-2:] + [text]), ref)); x = x[cut_outro(x):]
            encode(x, out.with_suffix(".mp3")); y = serre(x, keep=cfg.get("blanc_max", 0.15)); encode(y, out.with_name(out.name + "_serre.mp3"))
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out.with_name(out.name + "_serre.mp3")), "-ar", "48000", "-c:a", "pcm_s16le", str(out.with_suffix(".wav"))], check=True)
            print(f"{out}.wav (dans la continuité du récit)"); return
    elif "--test" in sys.argv:
        n = int(sys.argv[sys.argv.index("--test") + 1]); text, out = L[n - 1], d / f"essai_{n:02d}_{prov}"
    else:
        text, out = "\n".join(L), d / "voice"
    PAUSE = re.compile(r"\{(pause|vitesse) ([0-9.]+)\}")       # {pause X} : silence imposé (s) ; {vitesse X} : vitesse de la suite
    sp = PAUSE.split(text); parts = [sp[0]]                       # [texte, (genre, valeur), texte, ...]
    for q in range(1, len(sp), 3): parts += [(sp[q], float(sp[q + 1])), sp[q + 2]]
    raw, tight = [], []
    for k, seg in enumerate(parts):
        if k % 2:
            if seg[0] == "vitesse": cfg = {**cfg, "prosody": {**cfg["prosody"], "speed": seg[1]}}; continue
            z = np.zeros(int(seg[1] * SR), np.float32); raw.append(z); tight.append(z); continue
        if not seg.strip(): continue
        if prov == "fish":
            ref = cfg["fallback_reference_id"] if "--fallback" in sys.argv else cfg["reference_id"]
            x = decode(fish(cfg, seg.strip(), ref))                # pas de minutage : words.json via tools/voix_transcrire.py
        else:
            voice = cfg["fallback_voice_id"] if "--fallback" in sys.argv else cfg["free_voice_id"] if "--free" in sys.argv else cfg["voice_id"]
            x = decode(base64.b64decode(tts(cfg, seg.strip(), voice)["audio_base64"]))
        raw.append(x); tight.append(serre(x, keep=cfg.get("blanc_max", 0.15), lead=0.04 if not tight else 0.0))
    encode(np.concatenate(raw), out.with_suffix(".mp3")); encode(np.concatenate(tight), out.with_name(out.name + "_serre.mp3"))
    if "--wav" in sys.argv:                                       # pour le mix : WAV 48 kHz de la version resserrée
        subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(out.with_name(out.name + "_serre.mp3")), "-ar", "48000", "-c:a", "pcm_s16le", str(out.with_suffix(".wav"))], check=True)
    print(f"{out.with_suffix('.mp3')}  ({len(PAUSE.sub('', text).encode())} octets) -> {out.name}_serre.mp3")


SR = 44100


def cut_outro(x):
    """début du mot « Abonne » (faster-whisper), 60 ms avant"""
    from faster_whisper import WhisperModel
    a = subprocess.run(["ffmpeg", "-v", "quiet", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-ar", "16000", "-f", "f32le", "-"], input=x.tobytes(), capture_output=True).stdout
    segs, _ = WhisperModel("small", device="cpu", compute_type="int8").transcribe(np.frombuffer(a, np.float32), language="fr", word_timestamps=True)
    t = next(w.start for s in segs for w in s.words if "abonn" in w.word.lower())
    return max(0, int((t - 0.06) * SR))


def decode(b: bytes):
    return np.frombuffer(subprocess.run(["ffmpeg", "-loglevel", "error", "-i", "-", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"], input=b, capture_output=True, check=True).stdout, np.float32)


def encode(x, path: Path):
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", "-", "-b:a", "192k", str(path)], input=x.astype(np.float32).tobytes(), check=True)


def serre(x, keep=0.15, lead=0.04, thr_db=-38.0):
    """resserre les blancs (consigne utilisateur 2026-11-14 : silences légers et rapides) :
    chaque blanc (trames de 10 ms sous thr_db) plus long que keep s est ramené à keep s ; début ramené à lead s.
    Les pauses voulues plus longues s'écrivent {pause 0.8} dans le script."""
    n = SR // 100
    rms = np.sqrt(np.mean(x[: len(x) // n * n].reshape(-1, n) ** 2, axis=1) + 1e-12)
    quiet = 20 * np.log10(rms) < thr_db
    keepf = np.ones(len(quiet), bool); i = 0
    while i < len(quiet):
        if not quiet[i]: i += 1; continue
        j = i
        while j < len(quiet) and quiet[j]: j += 1
        lim = int((lead if i == 0 else keep) * 100)
        if j - i > lim:
            a = i + lim // 2 if i else 0; keepf[a: a + (j - i - lim)] = False   # on retire le milieu du blanc
        i = j
    return np.concatenate([x[k * n:(k + 1) * n] for k in np.flatnonzero(keepf)] + [x[len(quiet) * n:]])


if __name__ == "__main__":
    main()
