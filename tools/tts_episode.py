# Voix complète d'un épisode via ElevenLabs (with-timestamps) -> voice_raw.mp3 + words_raw.json
# Usage : python tools/tts_episode.py productions/<ep>/SCRIPT.md productions/<ep>/voice [voice_id]
# Le texte est la section "## Script" de SCRIPT.md (markdown retiré). La clé API est injectée par le proxy réseau.
import base64, json, os, re, sys, urllib.request

script, outdir = sys.argv[1], sys.argv[2]
voice = sys.argv[3] if len(sys.argv) > 3 else "JBFqnCBsd6RMkjVDRZzb"  # George
SETTINGS = {"stability": 0.32, "similarity_boost": 0.8, "style": 0.45, "use_speaker_boost": True}  # "v2 expressif" validé
src = open(script, encoding="utf-8").read()
body = src.split("## Script", 1)[1].split("\n", 1)[1]
body = body.split("\n(Mots en gras")[0].split("\n## ")[0]
text = re.sub(r"\*\*", "", body).strip()
text = re.sub(r"\s*\n\s*", " ", text)
os.makedirs(outdir, exist_ok=True)
open(os.path.join(outdir, "text.txt"), "w", encoding="utf-8").write(text)
req = urllib.request.Request(
    f"https://api.elevenlabs.io/v1/text-to-speech/{voice}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps({"text": text, "model_id": "eleven_multilingual_v2", "language_code": "fr", "voice_settings": SETTINGS}).encode(),
    headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("XI_API_KEY", "proxy-injected")})
d = json.load(urllib.request.urlopen(req, timeout=300))
open(os.path.join(outdir, "voice_raw.mp3"), "wb").write(base64.b64decode(d["audio_base64"]))
al = d.get("normalized_alignment") or d["alignment"]
ch, t0, t1 = al["characters"], al["character_start_times_seconds"], al["character_end_times_seconds"]
words, cur = [], None
for c, a, b in zip(ch, t0, t1):
    if c.isspace():
        if cur: words.append(cur); cur = None
        continue
    if cur is None: cur = {"w": c, "s": a, "e": b}
    else: cur["w"] += c; cur["e"] = b
if cur: words.append(cur)
words = [w for w in words if re.search(r"\w", w["w"])]
json.dump(words, open(os.path.join(outdir, "words_raw.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
print(len(text.split()), "mots ;", len(words), "mots alignés ; fin", round(words[-1]["e"], 2), "s")
