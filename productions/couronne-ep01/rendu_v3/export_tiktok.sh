#!/bin/bash
# Export final pour TikTok (meilleure qualité après leur réencodage) : 1080x1920 30 i/s (TikTok ne garde pas la 2K),
# H.264 High 4.1, ~18 Mbit/s en 2 passes, couleurs BT.709 déclarées, léger grain anti-bandes dans les dégradés sombres, AAC 320 kbit/s 48 kHz.
# usage : ./export_tiktok.sh <vidéo source (muette ou non)> <son.wav> <sortie.mp4>
set -e
IN=$1; A=$2; O=$3; [ -e "$O" ] && { echo "$O existe déjà"; exit 1; }
VF="scale=1080:1920:flags=lanczos,noise=alls=2:allf=t,format=yuv420p"
X="-c:v libx264 -preset slow -tune animation -profile:v high -level 4.1 -b:v 18M -maxrate 22M -bufsize 36M -g 60 -colorspace bt709 -color_primaries bt709 -color_trc bt709"
ffmpeg -loglevel error -y -i "$IN" -vf "$VF" $X -pass 1 -passlogfile /tmp/tt2p -an -f mp4 /dev/null
ffmpeg -loglevel error -y -i "$IN" -i "$A" -map 0:v:0 -map 1:a:0 -vf "$VF" $X -pass 2 -passlogfile /tmp/tt2p -c:a aac -b:a 320k -ar 48000 -t 72.6 -movflags +faststart "$O"
echo "export TikTok : $O"
