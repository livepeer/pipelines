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

DOWNLOAD_DIR="/app/data"
COOKIES_FILE="/app/cookies.txt"

USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
FORMAT_SELECTOR="bestvideo[height<=360][vcodec^=avc][ext=mp4]+bestaudio[acodec=aac][ext=m4a]/bestvideo[height<=360][vcodec^=avc][ext=mp4]+bestaudio/bestvideo[height<=360][ext=mp4]+bestaudio/best[ext=mp4][height<=360]/best[height<=360]"
FFMPEG_INPUT_OPTS="-re"
FFMPEG_CODEC_OPTS="-c copy"
FFMPEG_OUTPUT_OPTS="-f flv"

KEYFRAME_GOP_SIZE="60" # Keyframe interval (GOP size). e.g., 60 for 2s at 30fps. Adjust as needed.
PRE_ENCODE_VIDEO_OPTS="-c:v libx264 -g $KEYFRAME_GOP_SIZE -preset veryfast -tune zerolatency -pix_fmt yuv420p"
PRE_ENCODE_AUDIO_OPTS="-c:a aac -ar 44100 -b:a 128k"

RESTART_DELAY="10"

if [ -z "$YOUTUBE_URL" ]; then echo "Error: YOUTUBE_URL_STREAM1 environment variable is not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET" ]; then echo "Error: RTMP_TARGET_STREAM1 environment variable is not set." >&2; exit 1; fi

mkdir -p "$DOWNLOAD_DIR"

set -- yt-dlp --no-progress --get-filename -f "$FORMAT_SELECTOR" --merge-output-format mp4
if [ -f "$COOKIES_FILE" ]; then
  set -- "$@" --cookies "$COOKIES_FILE"
fi
set -- "$@" -o "${DOWNLOAD_DIR}/%(title)s.%(ext)s" "$YOUTUBE_URL"

echo "Determining filename using command: $@"
ACTUAL_VIDEO_FILE=$("$@")

if [ -z "$ACTUAL_VIDEO_FILE" ]; then
  echo "Error: yt-dlp --get-filename failed to determine video filename for $YOUTUBE_URL." >&2
  echo "yt-dlp command was: $@" >&2
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
    rm -f "$ACTUAL_VIDEO_FILE"
    exit 1
  fi
  echo "Download success: $ACTUAL_VIDEO_FILE"
else
  echo "Using local file: $ACTUAL_VIDEO_FILE"
fi

# Prepare filename for the streamable version
SOURCE_BASENAME=$(basename "$ACTUAL_VIDEO_FILE")
SOURCE_EXTENSION="${SOURCE_BASENAME##*.}"
SOURCE_FILENAME_NO_EXT="${SOURCE_BASENAME%.*}"
STREAMING_VIDEO_FILE="${DOWNLOAD_DIR}/${SOURCE_FILENAME_NO_EXT}_streamable.${SOURCE_EXTENSION}"

echo "Pre-processing video for streaming: $ACTUAL_VIDEO_FILE -> $STREAMING_VIDEO_FILE"
echo "Pre-processing options: $PRE_ENCODE_VIDEO_OPTS $PRE_ENCODE_AUDIO_OPTS"

ffmpeg -i "$ACTUAL_VIDEO_FILE" $PRE_ENCODE_VIDEO_OPTS $PRE_ENCODE_AUDIO_OPTS "$STREAMING_VIDEO_FILE"
if [ $? -ne 0 ]; then
  echo "Error: ffmpeg pre-processing failed for $ACTUAL_VIDEO_FILE." >&2
  exit 1
fi
echo "Pre-processing complete: $STREAMING_VIDEO_FILE"


echo "Stream 1 starting: processed local file ($STREAMING_VIDEO_FILE) -> $RTMP_TARGET"
echo "FFMPEG options for streaming: $FFMPEG_INPUT_OPTS -i \\"$STREAMING_VIDEO_FILE\\" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS"

while true; do
  ffmpeg $FFMPEG_INPUT_OPTS -i "$STREAMING_VIDEO_FILE" $FFMPEG_CODEC_OPTS $FFMPEG_OUTPUT_OPTS "$RTMP_TARGET"
  echo "Stream 1 ffmpeg process terminated. Restarting in $RESTART_DELAY seconds..."
  sleep "$RESTART_DELAY"
done