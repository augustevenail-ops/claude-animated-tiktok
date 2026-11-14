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
import base64, json, re, sys, urllib.request, urllib.error
from pathlib import Path

API = "https://api.elevenlabs.io/v1/text-to-speech/{v}/with-timestamps?output_format=mp3_44100_128"
TAG = re.compile(r"\[[^\]]+\]|\([a-z][a-z -]*\)")
FISH = "https://api.fish.audio/v1/tts"


def lines(script: Path):
    out = [l.strip() for l in script.read_text(encoding="utf-8").splitlines() if re.match(r"^(\[|\([a-z])", l.strip())]
    bad = []
    for i, l in enumerate(out, 1):
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
    if "--check" in sys.argv: print(f"{len(L)} phrases, toutes balisées ({prov})."); return
    if "--texte" in sys.argv:                       # essai libre (court, pour économiser les crédits)
        text, out = sys.argv[sys.argv.index("--texte") + 1], d / f"essai_texte_{prov}"
    elif "--test" in sys.argv:
        n = int(sys.argv[sys.argv.index("--test") + 1]); text, out = L[n - 1], d / f"essai_{n:02d}_{prov}"
    else:
        text, out = "\n".join(L), d / "voice"
    if prov == "fish":
        ref = cfg["fallback_reference_id"] if "--fallback" in sys.argv else cfg["reference_id"]
        out.with_suffix(".mp3").write_bytes(fish(cfg, text, ref))    # pas de minutage : words.json via tools/voix_transcrire.py
    else:
        voice = cfg["fallback_voice_id"] if "--fallback" in sys.argv else cfg["free_voice_id"] if "--free" in sys.argv else cfg["voice_id"]
        r = tts(cfg, text, voice)
        out.with_suffix(".mp3").write_bytes(base64.b64decode(r["audio_base64"]))
        if r.get("alignment"): out.with_suffix(".json").write_text(json.dumps(words(r["alignment"], text), ensure_ascii=False, indent=0))
    print(f"{out.with_suffix('.mp3')}  ({len(text.encode())} octets)")


if __name__ == "__main__":
    main()
