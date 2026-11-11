#!/bin/bash
# Assemble les morceaux rendus, ajoute la bande son, contrôle qualité. Sortie : out/final/arene_ep01.mp4
cd "$(dirname "$0")/.." || exit 1
( for f in out/final/chunks/c_*.mp4; do echo "file '$PWD/$f'"; done ) > out/final/list.txt
# jointure : la copie de flux laisse des trous d'horodatage (listes d'édition des images B) ou perd des images ;
# on décode les morceaux bout à bout et on réencode une fois en haute qualité (CRF 12, visuellement identique), CFR 30 i/s exact
ffmpeg -v error -y -f concat -safe 0 -i out/final/list.txt -an -vf "setpts=N/30/TB" -r 30 -fps_mode cfr -c:v libx264 -preset slow -crf 12 -pix_fmt yuvj420p -color_range pc out/final/video_noaudio.mp4
# pas de -shortest (il coupe des images en copie de flux) : l'audio est complété à la durée exacte de la vidéo
DUR=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of csv=p=0 out/final/video_noaudio.mp4)
ffmpeg -v error -y -i out/final/video_noaudio.mp4 -i public/arene/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -af "apad,atrim=end=$DUR" -t "$DUR" -c:a aac -b:a 256k -movflags +faststart out/final/arene_ep01.mp4
python3 - <<'PY'
import json, re
src = open("src/videos/arene/story.ts").read()
total = int(re.search(r"export const TOTAL = (\d+)", src).group(1))
json.dump({"shots": [{"id": 0, "a": 0, "b": total}]}, open("out/final/shots.json", "w"))
PY
python3 scripts/short_qa.py out/final/arene_ep01.mp4 out/final/qa out/final/shots.json | head -12
