#!/bin/bash
# Rendu de Le Puits ép. 1 par morceaux de C images (reprise des manquants), depuis la copie figée out/snap_puits/src.
# Mesures du 2026-11-19 (CPU 4 cœurs, rendu logiciel) : 4K natif 9,1 s/image ; 2K (scale 1.3333) 4,4 s/image ; plusieurs rendus
# en parallèle ne vont pas plus vite (CPU saturé). Choix : 2K natif puis agrandissement lanczos en 4K à l'assemblage (~2 h 15 au lieu de ~5 h).
# Chaque appel s'arrête de lancer de nouveaux morceaux après BUDGET secondes (appels < 30 min) ; relancer jusqu'à « complet ».
# Usage : bash scripts/render_puits4k.sh [P=2] [C=60] [SCALE=1.3333] [BUDGET=1200]
cd "$(dirname "$0")/.." || exit 1
P=${1:-2}; C=${2:-60}; SCALE=${3:-1.3333}; BUDGET=${4:-1200}; D=out/puits4k/chunks_s$SCALE; mkdir -p $D; TOTAL=1970
TMPB=${TMPB:-/tmp/claude-0/-home-user-claude-animated-tiktok/95e16bf7-2c29-578e-a9eb-dc55bd228377/scratchpad/tmp}
DEADLINE=$(( $(date +%s) + BUDGET ))
one() { [ $(date +%s) -ge $DEADLINE ] && return; a=$1; b=$((a + C - 1)); [ $b -ge $TOTAL ] && b=$((TOTAL - 1)); f=$D/c_$(printf %04d $a).mp4
  T=$TMPB/r_$a; rm -rf $T; mkdir -p $T
  TMPDIR=$T TEMP=$T TMP=$T REMOTION_TMP=$T ENTRY=out/snap_puits/src/index.ts node scripts/render.mjs PuitsEp1 "$f.tmp.mp4" $SCALE "$a-$b" 1 '{"post":{"audio":false,"lensTaps":16,"lensNear":8}}' > $D/log_$a.txt 2>&1 && mv "$f.tmp.mp4" "$f"
  rm -rf $T; echo "morceau $a-$b : $(tail -1 $D/log_$a.txt)"; }
export -f one; export D TOTAL TMPB C SCALE DEADLINE
for ((a=0; a<TOTAL; a+=C)); do [ -f $D/c_$(printf %04d $a).mp4 ] || echo $a; done | xargs -P $P -I{} bash -c 'one {}'
left=$(for ((a=0; a<TOTAL; a+=C)); do [ -f $D/c_$(printf %04d $a).mp4 ] || echo $a; done | wc -l)
echo "reste $left morceau(x) sur $(( (TOTAL + C - 1) / C ))"; [ $left -eq 0 ] && echo complet
