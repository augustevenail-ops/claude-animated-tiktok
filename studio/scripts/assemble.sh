#!/bin/bash
# Assemble les morceaux rendus, ajoute la bande son, contrôle qualité. Sortie : out/final/arene_ep01.mp4
cd "$(dirname "$0")/.." || exit 1
( for f in out/final/chunks/c_*.mp4; do echo "file '$PWD/$f'"; done ) > out/final/list.txt
ffmpeg -v error -y -f concat -safe 0 -i out/final/list.txt -c copy out/final/video_noaudio.mp4
ffmpeg -v error -y -i out/final/video_noaudio.mp4 -i public/arene/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart out/final/arene_ep01.mp4
python3 - <<'PY'
import json, re
src = open("src/videos/arene/story.ts").read()
total = int(re.search(r"export const TOTAL = (\d+)", src).group(1))
json.dump({"shots": [{"id": 0, "a": 0, "b": total}]}, open("out/final/shots.json", "w"))
PY
python3 scripts/short_qa.py out/final/arene_ep01.mp4 out/final/qa out/final/shots.json | head -12
