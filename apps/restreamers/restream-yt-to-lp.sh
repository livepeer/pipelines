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

LOCAL_VIDEO_PATH="/app/data/youtube_video.mp4"
COOKIES_FILE="/app/cookies.txt"

USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
FORMAT_SELECTOR="best[ext=mp4][protocol^=https]/best[protocol^=https]/best"
FFMPEG_INPUT_OPTS="-re"
FFMPEG_CODEC_OPTS="-c copy"
FFMPEG_OUTPUT_OPTS="-f flv"
RESTART_DELAY="10"

if [ -z "$YOUTUBE_URL" ]; then echo "Error: YOUTUBE_URL_STREAM1 environment variable is not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET" ]; then echo "Error: RTMP_TARGET_STREAM1 environment variable is not set." >&2; exit 1; fi

mkdir -p "$(dirname "$LOCAL_VIDEO_PATH")"

if [ ! -f "$LOCAL_VIDEO_PATH" ]; then
  echo "Local file '$LOCAL_VIDEO_PATH' not found. Downloading from YouTube: $YOUTUBE_URL"
  
  ytdlp_cmd="yt-dlp --no-progress"
  
  # Add cookies if file exists
  if [ -f "$COOKIES_FILE" ]; then
    echo "Using cookies file: $COOKIES_FILE"
    ytdlp_cmd="$ytdlp_cmd --cookies \"$COOKIES_FILE\""
  else
    echo "No cookies file found at $COOKIES_FILE - proceeding without cookies"
  fi
  
  # Output directly to the final path
  ytdlp_cmd="$ytdlp_cmd -o \"$LOCAL_VIDEO_PATH\" \"$YOUTUBE_URL\""
  
  echo "Running: $ytdlp_cmd"
  if ! eval "$ytdlp_cmd"; then
    echo "Download failed for $YOUTUBE_URL. Please check the URL and network." >&2
    rm -f "$LOCAL_VIDEO_PATH" # Attempt to clean up partially downloaded file
    exit 1
  fi
  echo "Download success: $LOCAL_VIDEO_PATH"
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