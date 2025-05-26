#!/bin/ash

YOUTUBE_URL="${YOUTUBE_URL_STREAM1}"
RTMP_TARGET="${RTMP_TARGET_STREAM1}"

LOCAL_VIDEO_PATH="/app/data/youtube_video.mp4"
YTDLP_FORMAT="bv[vcodec~=^h264][height<=1080]+ba[acodec~=^aac]/b[vcodec~=^h264][height<=1080]/bv*+ba/b"
FFMPEG_INPUT_OPTS="-re"
FFMPEG_CODEC_OPTS="-c copy"
FFMPEG_OUTPUT_OPTS="-f flv"
DOWNLOAD_ATTEMPTS="3"
RESTART_DELAY="1"

if [ -z "$YOUTUBE_URL" ]; then echo "Error: YOUTUBE_URL_STREAM1 environment variable is not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET" ]; then echo "Error: RTMP_TARGET_STREAM1 environment variable is not set." >&2; exit 1; fi

mkdir -p "$(dirname "$LOCAL_VIDEO_PATH")"

if [ ! -f "$LOCAL_VIDEO_PATH" ]; then
  echo "Local file '$LOCAL_VIDEO_PATH' not found. Downloading from YouTube: $YOUTUBE_URL"
  success=false
  for i in $(seq 1 "$DOWNLOAD_ATTEMPTS"); do
    echo "Download attempt $i/$DOWNLOAD_ATTEMPTS..."
    yt-dlp --no-progress -f "$YTDLP_FORMAT" -o "$LOCAL_VIDEO_PATH.tmp" "$YOUTUBE_URL" && \
    mv "$LOCAL_VIDEO_PATH.tmp" "$LOCAL_VIDEO_PATH" && \
    echo "Download success: $LOCAL_VIDEO_PATH" && \
    success=true && break
    echo "Download failed (attempt $i). Retrying in 5 seconds..." >&2
    sleep 5
  done
  if [ "$success" = false ]; then
    echo "Final download failed: $YOUTUBE_URL" >&2
    rm -f "$LOCAL_VIDEO_PATH.tmp"
    exit 1
  fi
else
  echo "Using local file: $LOCAL_VIDEO_PATH"
fi

echo "Stream 1 starting: local file ($LOCAL_VIDEO_PATH) -> $RTMP_TARGET"
echo "FFMPEG options: $FFMPEG_INPUT_OPTS -i \"$LOCAL_VIDEO_PATH\" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS"

while true; do
  ffmpeg $FFMPEG_INPUT_OPTS -i "$LOCAL_VIDEO_PATH" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS "$RTMP_TARGET"
  echo "Stream 1 ffmpeg process terminated. Restarting in $RESTART_DELAY seconds..."
  sleep "$RESTART_DELAY"
done