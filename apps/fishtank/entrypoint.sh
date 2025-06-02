#!/bin/bash

STREAM_URL="https://storage.googleapis.com/thom-vod-testing/fishtank_director.mp4"
RTMP_TARGET="rtmp://ai.livepeer.com/stk_*****"

while true; do
  ffmpeg -rw_timeout 10000000 -timeout 10000000 -re -i "$STREAM_URL" -c copy -f flv "$RTMP_TARGET"
  sleep 5
done 
