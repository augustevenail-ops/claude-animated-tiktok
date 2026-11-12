#!/bin/bash
# File de rendus de la nuit : chaque ligne de out/queue.txt = « Composition dossier TOTAL copie_src » ; relit la file après chaque
# épisode (on peut en ajouter pendant le rendu) ; reprend les morceaux manquants ; s'arrête quand tout est rendu.
cd "$(dirname "$0")/.." || exit 1
while true; do
  todo=0
  while read -r COMP OUT TOTAL SNAP; do
    [ -z "$COMP" ] && continue
    n=$(ls $OUT/chunks/c_*.mp4 2>/dev/null | wc -l); need=$(( (TOTAL + 299) / 300 ))
    if [ "$n" -lt "$need" ]; then todo=1; bash scripts/render_chunks_ep.sh $COMP $OUT $TOTAL $SNAP; break; fi
  done < out/queue.txt
  [ $todo -eq 0 ] && break
done
echo "file terminée"
