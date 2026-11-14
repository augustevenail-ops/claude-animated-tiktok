#!/usr/bin/env python3
"""Voix IA du narrateur (ElevenLabs eleven_v3, balises d'émotion).

Script : productions/<ep>/voix_ia/SCRIPT_BALISE.md — une phrase par ligne, chaque phrase précédée de sa
balise [émotion] (obligatoire, vérifié). Réglages : productions/<ep>/voix_ia/voix_ia.json.

  python3 tools/tts_ia.py productions/mur-ep01 --check          # vérifie les balises, n'appelle pas l'API
  python3 tools/tts_ia.py productions/mur-ep01 --test 3          # génère seulement la ligne n° 3 (essai)
  python3 tools/tts_ia.py productions/mur-ep01 --texte "[whispers] ..."   # essai libre
  python3 tools/tts_ia.py productions/mur-ep01                   # génère tout -> voix_ia/voice.mp3 + words.json

Clé : injectée par le proxy (en-tête xi-api-key remplacé), aucune variable d'environnement nécessaire.
"""
import base64, json, re, sys, urllib.request, urllib.error
from pathlib import Path

API = "https://api.elevenlabs.io/v1/text-to-speech/{v}/with-timestamps?output_format=mp3_44100_128"
TAG = re.compile(r"\[[^\]]+\]")


def lines(script: Path):
    out = [l.strip() for l in script.read_text(encoding="utf-8").splitlines() if l.strip().startswith("[")]
    bad = []
    for i, l in enumerate(out, 1):
        if not re.match(r"^(\[[^\]]+\]\s*)+\S", l):
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
    ep = Path(sys.argv[1]); d = ep / "voix_ia"; cfg = json.loads((d / "voix_ia.json").read_text())
    L = lines(d / "SCRIPT_BALISE.md")
    if "--check" in sys.argv: print(f"{len(L)} phrases, toutes balisées."); return
    voice = cfg["voice_id"]
    if "--fallback" in sys.argv: voice = cfg["fallback_voice_id"]
    if "--free" in sys.argv: voice = cfg["free_voice_id"]          # forfait gratuit : voix premade uniquement
    if "--texte" in sys.argv:                       # essai libre (court, pour économiser les caractères)
        text, out = sys.argv[sys.argv.index("--texte") + 1], d / "essai_texte"
    elif "--test" in sys.argv:
        n = int(sys.argv[sys.argv.index("--test") + 1]); text, out = L[n - 1], d / f"essai_{n:02d}"
    else:
        text, out = "\n".join(L), d / "voice"
    r = tts(cfg, text, voice)
    out.with_suffix(".mp3").write_bytes(base64.b64decode(r["audio_base64"]))
    if r.get("alignment"): out.with_suffix(".json").write_text(json.dumps(words(r["alignment"], text), ensure_ascii=False, indent=0))
    print(f"{out.with_suffix('.mp3')}  ({len(text)} caractères)")


if __name__ == "__main__":
    main()
