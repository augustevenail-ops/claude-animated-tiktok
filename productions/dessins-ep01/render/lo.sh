#!/bin/bash
# morceaux restants en 1080x1920 (scale 0.75) puis agrandis en 1440x2560 (lanczos) pour gagner du temps
cd /home/user/claude-animated-tiktok/studio
export OUT=/home/user/claude-animated-tiktok/productions/dessins-ep01/render TOTAL=4410
job() { a=$1; b=$((a+49)); [ $b -ge $TOTAL ] && b=$((TOTAL-1)); f=$OUT/chunks/c_$(printf %04d $a).mp4; [ -f $f ] && return
  T=/home/user/rtmp/ds_$a; rm -rf $T; mkdir -p $T; rm -f $f.lo.mp4
  TMPDIR=$T TEMP=$T TMP=$T REMOTION_TMP=$T ENTRY=/home/user/claude-animated-tiktok/studio/snap_ds2k/index.ts timeout 9000 node scripts/render.mjs Dessins $f.lo.mp4 0.75 "$a-$b" 1 '{}' > $OUT/chunks/log_$a.txt 2>&1 \
   && ffmpeg -v error -y -i $f.lo.mp4 -vf scale=1440:2560:flags=lanczos -c:v libx264 -crf 16 -preset medium -pix_fmt yuv420p $f.up.mp4 && mv $f.up.mp4 $f && rm -f $f.lo.mp4
  rm -rf $T; [ -f $f ] && echo "chunk $a ok (lo) $(date +%T)" || echo "chunk $a FAIL $(date +%T)"; }
export -f job
for try in 1 2 3; do printf "%s\n" "$@" | xargs -P ${N:-3} -I{} bash -c 'job {}'; done
echo "FIN-LO $(ls $OUT/chunks/c_*.mp4 | wc -l)"
