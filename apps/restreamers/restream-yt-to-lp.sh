#!/bin/ash

YOUTUBE_URL="${YOUTUBE_URL_STREAM1}"
RTMP_TARGET="${RTMP_TARGET_STREAM1}"

LOCAL_VIDEO_PATH="/app/data/youtube_video.mp4"
COOKIES_FILE="/app/youtube_cookies.txt"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
FORMAT_SELECTOR="best[ext=mp4][protocol^=https]/best[protocol^=https]/best"
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
    # Clean up any existing temp files first
    rm -f "$LOCAL_VIDEO_PATH.tmp"*
    # Use a unique temp filename to avoid conflicts
    temp_file="$LOCAL_VIDEO_PATH.tmp.$$"
    
    # Build yt-dlp command with optional cookies
    ytdlp_cmd="yt-dlp --no-progress --user-agent \"$USER_AGENT\" --no-check-certificates --merge-output-format mp4 --no-playlist --format \"$FORMAT_SELECTOR\" --no-part --force-overwrites --no-continue --max-downloads 1"
    
    # Add cookies if file exists
    if [ -f "$COOKIES_FILE" ]; then
      echo "Using cookies file: $COOKIES_FILE"
      ytdlp_cmd="$ytdlp_cmd --cookies \"$COOKIES_FILE\""
    else
      echo "No cookies file found at $COOKIES_FILE - proceeding without cookies"
    fi
    
    ytdlp_cmd="$ytdlp_cmd -o \"$temp_file\" \"$YOUTUBE_URL\""
    
    echo "Running: $ytdlp_cmd"
    if eval $ytdlp_cmd; then
      if [ -f "$temp_file" ]; then
        mv "$temp_file" "$LOCAL_VIDEO_PATH" && \
        echo "Download success: $LOCAL_VIDEO_PATH" && \
        success=true && break
      else
        echo "Download completed but file not found: $temp_file" >&2
        # Check if file was created with different extension
        found_file=$(find "$(dirname "$temp_file")" -name "$(basename "$temp_file")*" -type f | head -1)
        if [ -n "$found_file" ]; then
          echo "Found file with different name: $found_file"
          mv "$found_file" "$LOCAL_VIDEO_PATH" && \
          echo "Download success: $LOCAL_VIDEO_PATH" && \
          success=true && break
        fi
      fi
    fi
    echo "Download failed (attempt $i). Retrying in 5 seconds..." >&2
    rm -f "$temp_file"*
    sleep 5
  done
  if [ "$success" = false ]; then
    echo "Final download failed: $YOUTUBE_URL" >&2
    rm -f "$LOCAL_VIDEO_PATH.tmp"*
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