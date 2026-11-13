# Phrase de fin d'épisode (pendant le carton du titre), voix du narrateur de l'épisode (voices.json), même tempo et même effet.
# Usage : python tools/tts_outro.py productions/<ep> "Abonne-toi pour l'épisode deux."  ->  voice/outro.wav (+ outro.json : début du mot « épisode »)
import base64, json, os, subprocess, sys, urllib.request
EP, TXT = sys.argv[1], sys.argv[2]
c = json.load(open(os.path.join(EP, "voices.json"), encoding="utf-8"))["narrateur"]
body = {"text": TXT, "model_id": c["model"], "language_code": "fr", "voice_settings": c["settings"]}
req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{c['voice']}/with-timestamps?output_format=mp3_44100_128",
    data=json.dumps(body).encode(), headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("XI_API_KEY", "proxy-injected")})
d = json.load(urllib.request.urlopen(req, timeout=300))
V = os.path.join(EP, "voice"); mp = os.path.join(V, "outro_brut.mp3"); open(mp, "wb").write(base64.b64decode(d["audio_base64"]))
al = d.get("normalized_alignment") or d["alignment"]; txt = "".join(al["characters"]); i = txt.lower().find("épisode")
t_ep = al["character_start_times_seconds"][i] if i >= 0 else 0.8
tempo = c.get("tempo", 1.0); fx = c.get("fx", "anull")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp, "-af", f"atempo={tempo},{fx},silenceremove=start_periods=1:start_threshold=-50dB,aresample=48000", "-ac", "1", os.path.join(V, "outro.wav")], check=True)
json.dump({"text": TXT, "t_episode": round(t_ep / tempo, 3)}, open(os.path.join(V, "outro.json"), "w", encoding="utf-8"), ensure_ascii=False)
print(TXT, "| durée", subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", os.path.join(V, "outro.wav")], capture_output=True, text=True).stdout.strip(), "| « épisode » à", round(t_ep / tempo, 2), "s")
