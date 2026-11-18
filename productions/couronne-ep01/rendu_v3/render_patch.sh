#!/bin/bash
# Re-rend seulement des plages d'images (morceaux gardés : relancer reprend) et les remplace dans une vidéo déjà rendue.
# usage : ./render_patch.sh <base> <sortie> <a1-b1> <a2-b2> ...   (a/b = n° d'image à 30 i/s, b exclu)
# ex. : ./render_patch.sh v4 v5 16-74 144-203 1121-1452 1547-1623   -> video/couronne_ep01_v5_muet.mp4 (image seule)
set -e
cd "$(dirname "$0")"
BASE=video/couronne_ep01_$1.mp4; V=$2; PD=video/patch_$V; OUT=video/couronne_ep01_${V}_muet.mp4; shift 2
[ -e $OUT ] && { echo "$OUT existe déjà"; exit 1; }
mkdir -p $PD; F=""; IN="-i $BASE"; k=1; prev=0; parts=""
for r in "$@"; do a=${r%-*}; b=${r#*-}; f=$PD/r$a.mp4
  if [ ! -s $f ]; then node render_video.js --from $(echo "scale=6;$a/30"|bc) --to $(echo "scale=6;$b/30"|bc) --out $f --novoice > $PD/r$a.log 2>&1; echo "plage $a-$b faite"; fi
  IN="$IN -i $f"; F="$F[0:v]trim=start_frame=$prev:end_frame=$a,setpts=PTS-STARTPTS[o$k];[$k:v]setpts=PTS-STARTPTS[n$k];"; parts="$parts[o$k][n$k]"; prev=$b; k=$((k+1))
done
F="$F[0:v]trim=start_frame=$prev,setpts=PTS-STARTPTS[fin];${parts}[fin]concat=n=$((2*k-1)):v=1:a=0[v]"
ffmpeg -loglevel error -y $IN -filter_complex "$F" -map "[v]" -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p -r 30 $OUT
echo "FINI $OUT $(ffprobe -v error -count_frames -select_streams v -show_entries stream=nb_read_frames -of csv=p=0 $OUT) images"
