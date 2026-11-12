#!/bin/bash
# Assemble un épisode rendu par morceaux : jointure (CRF 12, CFR 30), son, versions TikTok et YouTube 2K, contrôle qualité.
# Usage : scripts/assemble_ep.sh <dossier> <mix.wav> <nom>   -> <dossier>/<nom>.mp4, <nom>_tiktok.mp4, <nom>_youtube_2K.mp4
cd "$(dirname "$0")/.." || exit 1
D=$1; MIX=$2; NAME=$3
( for f in $D/chunks/c_*.mp4; do echo "file '$PWD/$f'"; done ) > $D/list.txt
ffmpeg -v error -y -f concat -safe 0 -i $D/list.txt -an -vf "setpts=N/30/TB" -r 30 -fps_mode cfr -c:v libx264 -preset slow -crf 12 -pix_fmt yuvj420p -color_range pc $D/video_noaudio.mp4
DUR=$(ffprobe -v error -select_streams v:0 -show_entries stream=duration -of default=nw=1:nk=1 $D/video_noaudio.mp4)
ffmpeg -v error -y -i $D/video_noaudio.mp4 -i $MIX -map 0:v:0 -map 1:a:0 -c:v copy -af "apad,atrim=end=$DUR" -t "$DUR" -c:a aac -b:a 256k -movflags +faststart $D/$NAME.mp4
ffmpeg -v error -y -i $D/$NAME.mp4 -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -profile:v high -level 4.2 -c:a aac -b:a 192k -movflags +faststart $D/${NAME}_tiktok.mp4
ffmpeg -v error -y -i $D/$NAME.mp4 -vf "scale=1440:2560:flags=lanczos" -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -profile:v high -level 5.1 -r 30 -c:a aac -b:a 256k -movflags +faststart $D/${NAME}_youtube_2K.mp4
N=$(ffprobe -v error -count_frames -select_streams v:0 -show_entries stream=nb_read_frames -of default=nw=1:nk=1 $D/video_noaudio.mp4)
echo "{\"shots\": [{\"id\": 0, \"a\": 0, \"b\": $N}]}" > $D/shots.json
python3 scripts/short_qa.py $D/$NAME.mp4 $D/qa $D/shots.json | head -6 > $D/qa.txt
cat $D/qa.txt; ls -la $D/*.mp4 | awk '{print $5, $9}'
