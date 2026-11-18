#!/bin/bash
# Rendu découpé en 7 morceaux muets (un morceau déjà fini est gardé : relancer le script reprend où il s'était arrêté),
# puis assemblage, voix, export 1080 + 2K + aperçu.   usage : ./render_parts.sh v4
set -e
cd "$(dirname "$0")"
V=${1:-v4}; N=7; FR=2178; PD=video/parts_$V; OUT=video/couronne_ep01_$V
mkdir -p $PD; : > $PD/liste.txt
for i in $(seq 0 $((N-1))); do
  a=$((FR*i/N)); b=$((FR*(i+1)/N)); f=$PD/p$i.mp4
  echo "file 'p$i.mp4'" >> $PD/liste.txt
  if [ -s $f ]; then echo "morceau $i déjà fait"; continue; fi
  node render_video.js --from $(echo "scale=6;$a/30"|bc) --to $(echo "scale=6;$b/30"|bc) --out $PD/p$i.mp4 --novoice > $PD/p$i.log 2>&1
  echo "morceau $((i+1))/$N fini"
done
ffmpeg -loglevel error -y -f concat -safe 0 -i $PD/liste.txt -c copy ${OUT}_muet.mp4
VX=../voix_v9/voix_complete_v11.mp3
ffmpeg -loglevel error -y -i ${OUT}_muet.mp4 -i $VX -map 0:v:0 -map 1:a:0 -af apad -t 72.6 -c:v copy -c:a aac -b:a 192k -movflags +faststart ${OUT}.mp4
ffmpeg -loglevel error -y -i ${OUT}_muet.mp4 -i $VX -map 0:v:0 -map 1:a:0 -af apad -t 72.6 -vf scale=1440:2560:flags=lanczos -c:v libx264 -crf 17 -preset medium -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart ${OUT}_2K.mp4
ffmpeg -loglevel error -y -i ${OUT}.mp4 -c:v libx264 -crf 24 -preset medium -c:a copy ${OUT}_apercu.mp4
rm ${OUT}_muet.mp4; echo FINI
