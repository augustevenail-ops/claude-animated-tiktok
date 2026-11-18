#!/bin/bash
# Pose la bande son complète (son/$M) sur une vidéo déjà rendue, sans re-rendu. usage : son/mux_son.sh v4
# -> rendu_v3/video/couronne_ep01_<v>_son.mp4 (1080), _son_2K.mp4 (1440x2560), _son_apercu.mp4
set -e
cd "$(dirname "$0")/.."
V=${1:-v4}; IN=rendu_v3/video/couronne_ep01_$V.mp4; IN2=rendu_v3/video/couronne_ep01_${V}_2K.mp4; M=${MIX:-mix_v4.wav}; T=${M#mix_}; T=${T%.wav}; O=rendu_v3/video/couronne_ep01_${V}_son${T#v}
[ -e $O.mp4 ] && { echo "$O.mp4 existe déjà"; exit 1; }
A="-map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 256k -t 72.6 -movflags +faststart"
ffmpeg -loglevel error -y -i $IN -i son/$M $A $O.mp4
[ -f $IN2 ] && ffmpeg -loglevel error -y -i $IN2 -i son/$M $A ${O}_2K.mp4
ffmpeg -loglevel error -y -i $O.mp4 -c:v libx264 -crf 24 -preset medium -c:a copy ${O}_apercu.mp4
echo "son posé : $O.mp4"
