#!/bin/ash

if [ -n "$YOUTUBE_COOKIES_BASE64" ]; then
    echo "Creating cookies file from environment variable..."
    echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > /app/cookies.txt
    echo "Cookies file created successfully"
elif [ -n "$YOUTUBE_COOKIES" ]; then
    echo "Creating cookies file from plain text environment variable..."
    echo "$YOUTUBE_COOKIES" > /app/cookies.txt
    echo "Cookies file created successfully"
fi

YOUTUBE_URL="${YOUTUBE_URL_STREAM1}"
RTMP_TARGET="${RTMP_TARGET_STREAM1}"

DOWNLOAD_DIR="/app/data" # Define download directory
COOKIES_FILE="/app/cookies.txt"

USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
FORMAT_SELECTOR="bestvideo[vcodec^=avc][ext=mp4]+bestaudio[acodec=aac][ext=m4a]/bestvideo[vcodec^=avc][ext=mp4]+bestaudio/bestvideo[ext=mp4]+bestaudio/best[ext=mp4]/best"
FFMPEG_INPUT_OPTS="-re"
FFMPEG_CODEC_OPTS="-c:v libx264 -preset veryfast -tune zerolatency -g 60 -keyint_min 60 -c:a copy"
FFMPEG_OUTPUT_OPTS="-f flv"
RESTART_DELAY="10"

if [ -z "$YOUTUBE_URL" ]; then echo "Error: YOUTUBE_URL_STREAM1 environment variable is not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET" ]; then echo "Error: RTMP_TARGET_STREAM1 environment variable is not set." >&2; exit 1; fi

mkdir -p "$DOWNLOAD_DIR" # Ensure download directory exists

# Determine the actual video file path
set -- yt-dlp --no-progress --get-filename -f "$FORMAT_SELECTOR" --merge-output-format mp4
if [ -f "$COOKIES_FILE" ]; then
  set -- "$@" --cookies "$COOKIES_FILE"
fi
set -- "$@" -o "${DOWNLOAD_DIR}/%(title)s.%(ext)s" "$YOUTUBE_URL"

echo "Determining filename using command: $@"
ACTUAL_VIDEO_FILE=$("$@")

if [ -z "$ACTUAL_VIDEO_FILE" ]; then
  echo "Error: yt-dlp --get-filename failed to determine video filename for $YOUTUBE_URL." >&2
  echo "yt-dlp command was: $@" >&2 # Log the command arguments
  exit 1
fi
echo "Determined video file path: $ACTUAL_VIDEO_FILE"


if [ ! -f "$ACTUAL_VIDEO_FILE" ]; then
  echo "Local file '$ACTUAL_VIDEO_FILE' not found. Downloading from YouTube: $YOUTUBE_URL"
  
  set -- yt-dlp --no-progress -f "$FORMAT_SELECTOR" --merge-output-format mp4
  if [ -f "$COOKIES_FILE" ]; then
    echo "Using cookies file: $COOKIES_FILE"
    set -- "$@" --cookies "$COOKIES_FILE"
  else
    echo "No cookies file found at $COOKIES_FILE - proceeding without cookies"
  fi
  set -- "$@" -o "$ACTUAL_VIDEO_FILE" "$YOUTUBE_URL"
  
  echo "Running command: $@"
  if ! "$@"; then
    echo "Download failed for $YOUTUBE_URL. Please check the URL and network." >&2
    rm -f "$ACTUAL_VIDEO_FILE" # Attempt to clean up partially downloaded file
    exit 1
  fi
  echo "Download success: $ACTUAL_VIDEO_FILE"
else
  echo "Using local file: $ACTUAL_VIDEO_FILE"
fi

echo "Stream 1 starting: local file ($ACTUAL_VIDEO_FILE) -> $RTMP_TARGET"
echo "FFMPEG options: $FFMPEG_INPUT_OPTS -i \\"$ACTUAL_VIDEO_FILE\\" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS"

while true; do
  ffmpeg $FFMPEG_INPUT_OPTS -i "$ACTUAL_VIDEO_FILE" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS "$RTMP_TARGET"
  echo "Stream 1 ffmpeg process terminated. Restarting in $RESTART_DELAY seconds..."
  sleep "$RESTART_DELAY"
done