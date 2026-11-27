#!/bin/bash
# Réassemble une vidéo à partir des morceaux rendus en retirant les images des coupes (voix/coupes_v2.json),
# avec la bande-son v2 et les sous-titres v2.   bash tools/assemble_v2.sh <dossier épisode> <nom sortie.mp4> <TOTAL images>
set -e; E=$1; OUT=$2; T=$3; cd "$E"
ls render/chunks/c_*.mp4 | sed "s|^render/|file '|;s|$|'|" > render/list_v2.txt
SEL=$(python3 -c "import json;print('+'.join(f'between(n,{c[\"B\"]-c[\"L\"]},{c[\"B\"]-1})' for c in json.load(open('voix/coupes_v2.json'))))")
ffmpeg -y -v error -f concat -safe 0 -i render/list_v2.txt -i audio/v2_mix.wav -filter_complex \
 "[0:v]select='not($SEL)',setpts=N/(30*TB),scale=1440:2560:flags=lanczos,subtitles=caps_v2.ass:fontsdir=fonts[v]" \
 -map "[v]" -map 1:a:0 -fps_mode passthrough -c:v libx264 -preset medium -b:v 13M -maxrate 15M -bufsize 26M -pix_fmt yuv420p \
 -c:a aac -b:a 320k -movflags +faststart -t $(python3 -c "print($T/30)") "final/$OUT"
ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -show_entries format=duration -of csv=p=0 "final/$OUT"
