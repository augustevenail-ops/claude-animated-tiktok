#!/bin/bash
# Rendu 4K (2160x3840, --scale 2) de Le Puits ép. 1 en petits morceaux de C images (chacun < 30 min), depuis la copie figée
# out/snap_puits/src. Chaque appel rend au plus P morceaux manquants en parallèle puis s'arrête (relancer jusqu'à « complet »).
# Usage : bash scripts/render_puits4k.sh [P=3] [C=40]
cd "$(dirname "$0")/.." || exit 1
P=${1:-3}; C=${2:-40}; D=out/puits4k/chunks; mkdir -p $D; TOTAL=1970
TMPB=${TMPB:-/tmp/claude-0/-home-user-claude-animated-tiktok/95e16bf7-2c29-578e-a9eb-dc55bd228377/scratchpad/tmp}
one() { a=$1; b=$((a + C - 1)); [ $b -ge $TOTAL ] && b=$((TOTAL - 1)); f=$D/c_$(printf %04d $a).mp4
  T=$TMPB/r_$a; rm -rf $T; mkdir -p $T
  TMPDIR=$T TEMP=$T TMP=$T REMOTION_TMP=$T ENTRY=out/snap_puits/src/index.ts node scripts/render.mjs PuitsEp1 "$f.tmp.mp4" 2 "$a-$b" 1 '{"post":{"audio":false}}' > $D/log_$a.txt 2>&1 && mv "$f.tmp.mp4" "$f"
  rm -rf $T; echo "morceau $a-$b : $(tail -1 $D/log_$a.txt)"; }
export -f one; export D TOTAL TMPB C
todo=$(for ((a=0; a<TOTAL; a+=C)); do [ -f $D/c_$(printf %04d $a).mp4 ] || echo $a; done | head -$P)
[ -n "$todo" ] && echo "$todo" | xargs -P $P -I{} bash -c 'one {}'
left=$(for ((a=0; a<TOTAL; a+=C)); do [ -f $D/c_$(printf %04d $a).mp4 ] || echo $a; done | wc -l)
echo "reste $left morceau(x) sur $(( (TOTAL + C - 1) / C ))"; [ $left -eq 0 ] && echo complet
