#!/bin/bash
# chien de garde : relance le superviseur s'il s'arrête alors qu'il manque des morceaux
R=/home/user/claude-animated-tiktok/productions/gentils-ep01/render; need=70
while true; do
  have=$(ls $R/chunks/c_*.mp4 2>/dev/null | wc -l); [ $have -ge $need ] && { echo "TOUT $(date +%T)" >> $R/watch.log; exit 0; }
  pgrep -f "gentils-ep01/render/sup.sh" >/dev/null || { echo "relance $(date +%T) ($have/$need)" >> $R/watch.log; setsid nohup $R/sup.sh >> $R/sup.log 2>&1 < /dev/null & }
  sleep 60
done
