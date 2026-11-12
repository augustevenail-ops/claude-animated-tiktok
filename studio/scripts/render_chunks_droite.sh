#!/bin/bash
# Rend « Ne le regarde pas » par morceaux de 300 images (reprend les morceaux manquants), 1080p natif, sans audio (mux après).
# Usage : scripts/render_chunks_droite.sh <TOTAL images>   -> out/droite_final/chunks/c_NNNN.mp4
cd "$(dirname "$0")/.." || exit 1
D=out/droite_final/chunks; mkdir -p $D
TOTAL=${1:?total d'images}
for ((a=0; a<TOTAL; a+=300)); do
  b=$((a + 299)); [ $b -ge $TOTAL ] && b=$((TOTAL - 1))
  f=$D/c_$(printf %04d $a).mp4
  [ -f "$f" ] && continue
  node scripts/render.mjs DroiteEp1 "$f.tmp.mp4" 1 "$a-$b" 1 '{"post":{"audio":false,"lensTaps":32,"lensNear":16}}' > "$D/log_$a.txt" 2>&1 && mv "$f.tmp.mp4" "$f"
  echo "morceau $a-$b : $(tail -1 $D/log_$a.txt)"
done
ls $D/c_*.mp4 | wc -l
