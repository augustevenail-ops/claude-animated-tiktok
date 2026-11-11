#!/bin/bash
# Rend L'Arène ép. 1 par morceaux de 300 images (reprend les morceaux manquants), 3D en 1080p natif, sans audio (mux après).
cd "$(dirname "$0")/.." || exit 1
mkdir -p out/final/chunks
TOTAL=2092
for ((a=0; a<TOTAL; a+=300)); do
  b=$((a + 299)); [ $b -ge $TOTAL ] && b=$((TOTAL - 1))
  f=out/final/chunks/c_$(printf %04d $a).mp4
  [ -f "$f" ] && continue
  node scripts/render.mjs AreneEp1 "$f.tmp.mp4" 1 "$a-$b" 1 '{"post":{"audio":false,"lensTaps":32,"lensNear":16}}' > "out/final/chunks/log_$a.txt" 2>&1 && mv "$f.tmp.mp4" "$f"
  echo "morceau $a-$b : $(tail -1 out/final/chunks/log_$a.txt)"
done
ls out/final/chunks/c_*.mp4 | wc -l
