#!/bin/bash
# ゲームに入れる声の大きさをそろえる：平均 -24dB（山は -3dB まで）。使い方: level.sh <入力> <出力>
v=$(ffmpeg -hide_banner -i "$1" -af volumedetect -f null - 2>&1)
m=$(echo "$v" | grep -oE "mean_volume: [-0-9.]*" | awk '{print $2}'); x=$(echo "$v" | grep -oE "max_volume: [-0-9.]*" | awk '{print $2}')
g=$(python3 -c "print(round(min(-24-($m), -3-($x)),1))")
ffmpeg -hide_banner -loglevel error -y -i "$1" -af "volume=${g}dB" -ac 1 -b:a 96k "$2"
echo "$(basename "$2") 平均$m 山$x → ${g}dB"
