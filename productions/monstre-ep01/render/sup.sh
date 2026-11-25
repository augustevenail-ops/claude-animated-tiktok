#!/bin/bash
# superviseur : rend les morceaux manquants (50 images) avec N travailleurs en parallèle, relance tant qu'il en manque
cd /home/user/claude-animated-tiktok/studio
export OUT=/home/user/claude-animated-tiktok/productions/monstre-ep01/render TOTAL=3953
N=${N:-3}
job() { a=$1; b=$((a+49)); [ $b -ge $TOTAL ] && b=$((TOTAL-1)); f=$OUT/chunks/c_$(printf %04d $a).mp4; [ -f $f ] && return
  T=/home/user/rtmp/m_$a; rm -rf $T; mkdir -p $T; rm -f $f.tmp.mp4
  TMPDIR=$T TEMP=$T TMP=$T REMOTION_TMP=$T ENTRY=/home/user/claude-animated-tiktok/studio/snap_m2k/index.ts timeout 9000 node scripts/render.mjs Monstre $f.tmp.mp4 1 "$a-$b" 1 '{}' > $OUT/chunks/log_$a.txt 2>&1 && mv $f.tmp.mp4 $f
  rm -rf $T; [ -f $f ] && echo "chunk $a ok $(date +%T)" || echo "chunk $a FAIL $(date +%T)"; }
export -f job
need=$(( (TOTAL+49)/50 ))
for try in 1 2 3 4 5 6 7 8; do
  have=$(ls $OUT/chunks/c_*.mp4 2>/dev/null | wc -l); [ $have -ge $need ] && break
  echo "passe $try : $have/$need"
  seq 0 50 $((TOTAL-1)) | xargs -P $N -I{} bash -c 'job {}'
done
echo "FIN $(ls $OUT/chunks/c_*.mp4 | wc -l)/$need"
