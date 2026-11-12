#!/bin/bash
# Assemble « L'appel » : jointure des morceaux (décodage + un seul réencodage CRF 12, CFR 30 i/s exact), son mix.wav, contrôle qualité.
# Sorties : out/appel_final/lappel.mp4 (master), _tiktok.mp4 (5 Mb/s), _youtube_2K.mp4 (1440x2560)
cd "$(dirname "$0")/.." || exit 1
D=out/appel_final; mkdir -p $D
( for f in $D/chunks/c_*.mp4; do echo "file '$PWD/$f'"; done ) > $D/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $D/list.txt -an -vf "setpts=N/30/TB" -r 30 -fps_mode cfr -c:v libx264 -preset slow -crf 12 -pix_fmt yuvj420p -color_range pc $D/video_noaudio.mp4
DUR=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=nw=1:nk=1 $D/video_noaudio.mp4)
ffmpeg -v error -y -i $D/video_noaudio.mp4 -i public/appel/mix.wav -map 0:v:0 -map 1:a:0 -c:v copy -af "apad,atrim=end=$DUR" -t "$DUR" -c:a aac -b:a 256k -movflags +faststart $D/lappel.mp4
ffmpeg -v error -y -i $D/lappel.mp4 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -level 4.2 -c:a aac -b:a 192k -movflags +faststart $D/lappel_tiktok.mp4
ffmpeg -v error -y -i $D/lappel.mp4 -vf "scale=1440:2560:flags=lanczos" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 5.1 -r 30 -c:a aac -b:a 256k -movflags +faststart $D/lappel_youtube_2K.mp4
python3 - <<'PY'
import json, re
src = open("src/videos/appel/story.ts").read()
json.dump({"shots": [{"id": 0, "a": 0, "b": 2416}]}, open("out/appel_final/shots.json", "w"))
PY
python3 scripts/short_qa.py $D/lappel.mp4 $D/qa $D/shots.json | head -12
ls -la $D/*.mp4 | awk '{print $5, $9}'
