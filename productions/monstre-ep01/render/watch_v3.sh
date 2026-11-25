#!/bin/bash
# chien de garde : relance le superviseur s'il s'arrête alors qu'il manque des morceaux
R=/home/user/claude-animated-tiktok/productions/monstre-ep01/render; need=70
while true; do
  have=$(ls $R/chunks_v3/c_*.mp4 2>/dev/null | wc -l); [ $have -ge $need ] && { echo "TOUT $(date +%T)" >> $R/watch_v3.log; exit 0; }
  pgrep -f "monstre-ep01/render/sup_v3.sh" >/dev/null || { echo "relance $(date +%T) ($have/$need)" >> $R/watch_v3.log; setsid nohup $R/sup_v3.sh >> $R/sup_v3.log 2>&1 < /dev/null & }
  sleep 60
done
