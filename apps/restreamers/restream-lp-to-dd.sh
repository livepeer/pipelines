#!/bin/ash

HLS_SOURCE_URL="${HLS_URL_STREAM2}"
RTMP_TARGET="${RTMP_TARGET_STREAM2}"

RW_TIMEOUT="10000000"
CONNECT_TIMEOUT="10000000"
FFMPEG_INPUT_OPTS="-re -analyzeduration 2000000 -probesize 10000000 -fflags +genpts"
FFMPEG_CODEC_OPTS="-c:v libx264 -preset ultrafast -crf 23 -vf scale=-2:720 -c:a aac -b:a 128k -avoid_negative_ts make_zero"
FFMPEG_OUTPUT_OPTS="-f flv -flvflags no_duration_filesize"
RESTART_DELAY="5"

if [ -z "$HLS_SOURCE_URL" ]; then echo "Error: HLS_URL_STREAM2 environment variable is not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET" ]; then echo "Error: RTMP_TARGET_STREAM2 environment variable is not set." >&2; exit 1; fi

echo "Stream 2 starting: HLS ($HLS_SOURCE_URL) -> AI Ingest ($RTMP_TARGET)"
echo "FFMPEG options: -rw_timeout $RW_TIMEOUT -timeout $CONNECT_TIMEOUT $FFMPEG_INPUT_OPTS -i \"$HLS_SOURCE_URL\" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS"

while true; do
  ffmpeg \
    -rw_timeout "$RW_TIMEOUT" \
    -timeout "$CONNECT_TIMEOUT" \
    $FFMPEG_INPUT_OPTS \
    -i "$HLS_SOURCE_URL" \
    -map 0:v:0 -map 0:a:0 \
    $FFMPEG_CODEC_OPTS \
    $FFMPEG_OUTPUT_OPTS "$RTMP_TARGET"
  
  exit_code=$?
  echo "Stream 2 ffmpeg process terminated with exit code: $exit_code. Restarting in $RESTART_DELAY seconds..."
  sleep "$RESTART_DELAY"
done