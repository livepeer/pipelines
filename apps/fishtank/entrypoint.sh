#!/bin/bash

STREAM_URL="https://storage.googleapis.com/thom-vod-testing/fishtank_director.mp4"
RTMP_TARGET="rtmp://ai.livepeer.monster/stk_m7QQNZPjUp5wP3NV"

while true; do
  ffmpeg -rw_timeout 10000000 -timeout 10000000 -an -re -i "$STREAM_URL" -c copy -f flv "$RTMP_TARGET"
  sleep 5
done 
