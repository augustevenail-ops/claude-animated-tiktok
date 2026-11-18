#!/bin/bash
# Rendu 4K natif (2160x3840) en petits morceaux reprenables : un morceau fini (pNN.mp4) est gardé, relancer le script reprend
# là où il s'était arrêté (coupure de session, limite de temps). 2 morceaux en parallèle. Puis assemblage + bande son + exports.
# usage : ./render_4k.sh v6 [../son/mix_v12.wav]      état : video/parts4k_<v>/etat.txt
cd "$(dirname "$0")"
V=${1:-v6}; A=${2:-../son/mix_v12.wav}; FR=2178; STEP=120; PD=video/parts4k_$V; OUT=video/couronne_ep01_${V}
mkdir -p $PD
part() { i=$1; a=$((i*STEP)); b=$(( (i+1)*STEP < FR ? (i+1)*STEP : FR )); f=$PD/p$(printf %02d $i).mp4
  [ -s $f ] && return 0
  node render_video.js --k 2 --from $(echo "scale=6;$a/30"|bc) --to $(echo "scale=6;$b/30"|bc) --out $f --novoice --crf 14 --preset medium > ${f%.mp4}.log 2>&1 \
    && echo "$(date +%T) morceau $i fini" >> $PD/etat.txt || echo "$(date +%T) morceau $i ÉCHEC (relancer le script)" >> $PD/etat.txt; }
export -f part; export STEP FR PD
NP=$(( (FR + STEP - 1) / STEP ))
echo "$(date +%T) début : $NP morceaux" >> $PD/etat.txt
seq 0 $((NP-1)) | xargs -P 2 -I{} bash -c 'part {}'
for i in $(seq 0 $((NP-1))); do [ -s $PD/p$(printf %02d $i).mp4 ] || { echo "$(date +%T) incomplet, relancer ./render_4k.sh $V" >> $PD/etat.txt; exit 1; }; done
: > $PD/liste.txt; for i in $(seq 0 $((NP-1))); do echo "file 'p$(printf %02d $i).mp4'" >> $PD/liste.txt; done
[ -s ${OUT}_4K_muet.mp4 ] || ffmpeg -loglevel error -y -f concat -safe 0 -i $PD/liste.txt -c copy ${OUT}_4K_muet.mp4
[ -s ${OUT}_4K_master.mp4 ] || ffmpeg -loglevel error -y -i ${OUT}_4K_muet.mp4 -i $A -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 320k -ar 48000 -t 72.6 -movflags +faststart ${OUT}_4K_master.mp4
[ -s ${OUT}_TikTok_4K.mp4 ] || ./export_tiktok.sh ${OUT}_4K_muet.mp4 $A ${OUT}_TikTok_4K.mp4 4k
[ -s ${OUT}_TikTok_1080.mp4 ] || ./export_tiktok.sh ${OUT}_4K_muet.mp4 $A ${OUT}_TikTok_1080.mp4
[ -s ${OUT}_apercu.mp4 ] || ffmpeg -loglevel error -y -i ${OUT}_TikTok_1080.mp4 -c:v libx264 -crf 24 -preset medium -c:a aac -b:a 160k -movflags +faststart ${OUT}_apercu.mp4
echo "$(date +%T) FINI" >> $PD/etat.txt
