#!/bin/bash
# Rend une composition par morceaux de 300 images (reprend les morceaux manquants), sans flou ni audio (mux après),
# à partir d'une COPIE FIGÉE du code (on peut continuer à travailler sur src/ pendant le rendu).
# Usage : scripts/render_chunks_ep.sh <Composition> <dossier_sortie> <TOTAL images> <copie_src>
cd "$(dirname "$0")/.." || exit 1
COMP=$1; D=$2/chunks; TOTAL=$3; SNAP=$4; mkdir -p $D
for ((a=0; a<TOTAL; a+=300)); do
  b=$((a + 299)); [ $b -ge $TOTAL ] && b=$((TOTAL - 1))
  f=$D/c_$(printf %04d $a).mp4
  [ -f "$f" ] && continue
  T=$D/tmp_$a; mkdir -p $T   # bundle temporaire propre à ce morceau, supprimé ensuite (sinon ~130 Mo laissés dans /tmp à chaque rendu)
  TMPDIR=$T TEMP=$T TMP=$T REMOTION_TMP=$T ENTRY=$SNAP/index.ts node scripts/render.mjs $COMP "$f.tmp.mp4" 1 "$a-$b" 1 '{"post":{"audio":false,"lens":false}}' > "$D/log_$a.txt" 2>&1 && mv "$f.tmp.mp4" "$f"
  rm -rf "$T"
  echo "$COMP morceau $a-$b : $(tail -1 $D/log_$a.txt)"
done
ls $D/c_*.mp4 | wc -l
