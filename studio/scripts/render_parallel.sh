#!/bin/bash
# Rend les épisodes de out/queue_final.txt EN PARALLÈLE (un rendu par épisode, morceaux de 300 images, reprise des morceaux manquants),
# puis assemble chaque épisode terminé (son, versions TikTok et YouTube 2K, contrôle qualité). Relançable sans risque :
# un épisode dont le rendu tourne déjà n'est pas relancé ; un épisode déjà assemblé est ignoré.
cd "$(dirname "$0")/.." || exit 1
Q=${1:-out/queue_final.txt}
while read -r COMP OUT TOTAL SNAP MIX NAME; do
  [ -z "$COMP" ] && continue
  [ -f "$OUT/${NAME}_youtube_2K.mp4" ] && continue
  if pgrep -f "render_chunks_ep.sh $COMP " >/dev/null; then echo "$COMP déjà en cours"; continue; fi
  ( bash scripts/render_chunks_ep.sh $COMP $OUT $TOTAL $SNAP; n=$(ls $OUT/chunks/c_*.mp4 2>/dev/null | wc -l); need=$(( (TOTAL + 299) / 300 ))
    [ "$n" -ge "$need" ] && bash scripts/assemble_ep.sh $OUT $MIX $NAME > $OUT/assemble.log 2>&1 ) &
done < "$Q"
wait
echo "fin : $(ls out/final_ep*/lappel_ep*_youtube_2K.mp4 2>/dev/null | wc -l) épisode(s) assemblé(s)"
