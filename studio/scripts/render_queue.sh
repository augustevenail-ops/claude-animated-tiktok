#!/bin/bash
# File de rendus de la nuit : chaque ligne de out/queue.txt = « Composition dossier TOTAL copie_src mix.wav nom » ; relit la file après
# chaque épisode (on peut en ajouter pendant le rendu) ; reprend les morceaux manquants ; assemble chaque épisode fini ; s'arrête quand tout est fait.
cd "$(dirname "$0")/.." || exit 1
while pgrep -f "render_chunks_ep.sh" >/dev/null; do sleep 30; done      # attend un rendu déjà lancé (évite les doublons)
while true; do
  todo=0
  while read -r COMP OUT TOTAL SNAP MIX NAME; do
    [ -z "$COMP" ] && continue
    n=$(ls $OUT/chunks/c_*.mp4 2>/dev/null | wc -l); need=$(( (TOTAL + 299) / 300 ))
    if [ "$n" -lt "$need" ]; then todo=1; bash scripts/render_chunks_ep.sh $COMP $OUT $TOTAL $SNAP; break; fi
    if [ ! -f "$OUT/${NAME}_youtube_2K.mp4" ]; then todo=1; bash scripts/assemble_ep.sh $OUT $MIX $NAME; break; fi
  done < out/queue.txt
  [ $todo -eq 0 ] && break
done
echo "file terminée"
