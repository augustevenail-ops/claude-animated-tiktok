#!/bin/bash
# Rendu partiel de Le Puits : seulement les images listées dans out/puits_patch/frames.json (composition PuitsPatch),
# par morceaux de C images, depuis la copie figée out/snap_patch/src ; relancer jusqu'à « complet » (appels < 30 min).
# Puis : python3 scripts/splice_puits.py (recolle les images dans out/puits4k/puits_2k_muet.mp4).
# Usage : bash scripts/patch_puits.sh [P=2] [C=57] [BUDGET=900]
cd "$(dirname "$0")/.." || exit 1
P=${1:-2}; C=${2:-57}; BUDGET=${3:-900}; D=out/puits_patch; L=$D/frames.json
TMPB=${TMPB:-/tmp/claude-0/-home-user-claude-animated-tiktok/95e16bf7-2c29-578e-a9eb-dc55bd228377/scratchpad/tmp}
N=$(python3 -c "import json;print(len(json.load(open('$L'))))"); DEADLINE=$(( $(date +%s) + BUDGET ))
one() { [ $(date +%s) -ge $DEADLINE ] && return; i=$1; f=$D/p_$(printf %04d $i).mp4
  fr=$(python3 -c "import json;print(json.dumps(json.load(open('$L'))[$i:$i+$C]))")
  T=$TMPB/p_$i; rm -rf $T; mkdir -p $T
  TMPDIR=$T TEMP=$T TMP=$T REMOTION_TMP=$T ENTRY=out/snap_patch/src/index.ts node scripts/render.mjs PuitsPatch "$f.tmp.mp4" 1.3333 "" 1 "{\"post\":{\"audio\":false,\"lensTaps\":16,\"lensNear\":8},\"frames\":$fr}" > $D/log_$i.txt 2>&1 && mv "$f.tmp.mp4" "$f"
  rm -rf $T; echo "morceau $i : $(tail -1 $D/log_$i.txt)"; }
export -f one; export D L C TMPB DEADLINE
for ((i=0; i<N; i+=C)); do [ -f $D/p_$(printf %04d $i).mp4 ] || echo $i; done | xargs -P $P -I{} bash -c 'one {}'
left=$(for ((i=0; i<N; i+=C)); do [ -f $D/p_$(printf %04d $i).mp4 ] || echo $i; done | wc -l)
echo "reste $left morceau(x) sur $(( (N + C - 1) / C ))"; [ $left -eq 0 ] && echo complet
