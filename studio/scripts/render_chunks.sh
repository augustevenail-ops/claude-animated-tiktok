#!/bin/bash
# Rend le prochain morceau manquant de L'Arène ép. 1 (380 images ≈ 1,8 h sur CPU), 3D interne 720x1280, sortie 1080x1920.
cd "$(dirname "$0")/.." || exit 1
mkdir -p out/arene/chunks
for a in 0 380 760 1140 1520 1900; do
  b=$((a + 379)); [ $b -gt 2099 ] && b=2099
  f=out/arene/chunks/c_$(printf %04d $a).mp4
  if [ ! -f "$f" ]; then
    node scripts/render.mjs AreneEp1 "$f.tmp.mp4" 1 "$a-$b" 1 '{"post":{"audio":false,"dpr":0.6667}}' > "out/arene/chunks/log_$a.txt" 2>&1 && mv "$f.tmp.mp4" "$f"
    echo "chunk $a-$b: $(tail -1 out/arene/chunks/log_$a.txt)"; exit 0
  fi
done
echo "ALL DONE"
