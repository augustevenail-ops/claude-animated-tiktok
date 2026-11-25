# Voix off « Le Téléphone rouge » : Fish Audio s1, voix choisie par l’utilisateur (Jfoot a829cc49…).
import json, urllib.request, pathlib
D = pathlib.Path(__file__).parent; text = (D / "texte.txt").read_text(encoding="utf-8").strip()
body = {"text": text, "reference_id": "a829cc490b6c4c0085b9e86c15dfcc42", "format": "mp3", "mp3_bitrate": 192, "normalize": True, "latency": "normal", "temperature": 0.7, "top_p": 0.7, "prosody": {"speed": 1.0, "volume": 0}}
req = urllib.request.Request("https://api.fish.audio/v1/tts", json.dumps(body).encode(), {"Content-Type": "application/json", "Authorization": "Bearer proxy-injected", "model": "s1"})
(D / "voice.mp3").write_bytes(urllib.request.urlopen(req, timeout=900).read())
json.dump([{"w": w} for w in text.split()], open(D / "ref.json", "w", encoding="utf-8"), ensure_ascii=False)
