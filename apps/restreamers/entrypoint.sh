#!/bin/bash
set -euo pipefail

YOUTUBE_URL="${YOUTUBE_URL_STREAM1}"
RTMP_TARGET_LP="${RTMP_TARGET_STREAM1}"
HLS_SOURCE_URL="${HLS_URL_STREAM2}"
RTMP_TARGET_AI="${RTMP_TARGET_STREAM2}"

DOWNLOAD_DIR="/app/data"
COOKIES_FILE="/app/cookies.txt"
PID_FILE="/app/stream.pid"
LOG_DIR="/app/logs"

mkdir -p "$DOWNLOAD_DIR" "$LOG_DIR"

if [ -n "${YOUTUBE_COOKIES_BASE64:-}" ]; then
    echo "Creating cookies file from environment variable..."
    echo "$YOUTUBE_COOKIES_BASE64" | base64 -d > "$COOKIES_FILE"
elif [ -n "${YOUTUBE_COOKIES:-}" ]; then
    echo "Creating cookies file from plain text environment variable..."
    echo "$YOUTUBE_COOKIES" > "$COOKIES_FILE"
fi

if [ -z "$YOUTUBE_URL" ]; then echo "Error: YOUTUBE_URL_STREAM1 not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET_LP" ]; then echo "Error: RTMP_TARGET_STREAM1 not set." >&2; exit 1; fi
if [ -z "$HLS_SOURCE_URL" ]; then echo "Error: HLS_URL_STREAM2 not set." >&2; exit 1; fi
if [ -z "$RTMP_TARGET_AI" ]; then echo "Error: RTMP_TARGET_STREAM2 not set." >&2; exit 1; fi

FORMAT_SELECTOR="bestvideo[height<=360][vcodec^=avc][ext=mp4]+bestaudio[acodec=aac][ext=m4a]/bestvideo[height<=360][vcodec^=avc][ext=mp4]+bestaudio/bestvideo[height<=360][ext=mp4]+bestaudio/best[ext=mp4][height<=360]/best[height<=360]"

KEYFRAME_GOP_SIZE="60"  # 2 seconds at 30fps
PRE_ENCODE_VIDEO_OPTS="-c:v libx264 -g $KEYFRAME_GOP_SIZE -keyint_min $KEYFRAME_GOP_SIZE -preset veryfast -tune zerolatency -pix_fmt yuv420p -crf 28 -profile:v baseline -level 3.0 -sc_threshold 0"
PRE_ENCODE_AUDIO_OPTS="-c:a aac -ar 44100 -b:a 128k"

prepare_video() {
    echo "=== Preparing video from YouTube ==="
    
    set -- yt-dlp --no-progress --get-filename -f "$FORMAT_SELECTOR" --merge-output-format mp4
    if [ -f "$COOKIES_FILE" ]; then
        set -- "$@" --cookies "$COOKIES_FILE"
    fi
    set -- "$@" -o "${DOWNLOAD_DIR}/%(title)s.%(ext)s" "$YOUTUBE_URL"
    
    echo "Determining filename..."
    ACTUAL_VIDEO_FILE=$("$@")
    
    if [ -z "$ACTUAL_VIDEO_FILE" ]; then
        echo "Error: Failed to determine video filename" >&2
        return 1
    fi
    
    if [ ! -f "$ACTUAL_VIDEO_FILE" ]; then
        echo "Downloading from YouTube: $YOUTUBE_URL"
        
        set -- yt-dlp --no-progress -f "$FORMAT_SELECTOR" --merge-output-format mp4
        if [ -f "$COOKIES_FILE" ]; then
            set -- "$@" --cookies "$COOKIES_FILE"
        fi
        set -- "$@" -o "$ACTUAL_VIDEO_FILE" "$YOUTUBE_URL"
        
        if ! "$@"; then
            echo "Download failed" >&2
            return 1
        fi
    fi
    
    SOURCE_BASENAME=$(basename "$ACTUAL_VIDEO_FILE")
    SOURCE_FILENAME_NO_EXT="${SOURCE_BASENAME%.*}"
    STREAMING_VIDEO_FILE="${DOWNLOAD_DIR}/${SOURCE_FILENAME_NO_EXT}_streamable.mp4"
    
    echo "Pre-processing video for streaming..."
    ffmpeg -i "$ACTUAL_VIDEO_FILE" \
        $PRE_ENCODE_VIDEO_OPTS \
        $PRE_ENCODE_AUDIO_OPTS \
        -movflags +faststart \
        -y "$STREAMING_VIDEO_FILE"
    
    if [ $? -ne 0 ]; then
        echo "Error: Pre-processing failed" >&2
        return 1
    fi
    
    echo "Video prepared: $STREAMING_VIDEO_FILE"
    export STREAMING_VIDEO_FILE
    return 0
}

stream_to_livepeer() {
    echo "=== Starting stream to Livepeer ==="
    
    while true; do
        echo "[LP] Streaming to: $RTMP_TARGET_LP"
        
        ffmpeg -re \
            -stream_loop -1 \
            -i "$STREAMING_VIDEO_FILE" \
            -c copy \
            -bufsize 3000k \
            -maxrate 1500k \
            -f flv "$RTMP_TARGET_LP" \
            2>&1 | while IFS= read -r line; do echo "[LP] $line"; done
        
        echo "[LP] Stream ended, restarting in 10s..."
        sleep 10
    done
}

check_hls_with_retry() {
    local url="$1"
    local max_retries=60
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if wget -q -O /dev/null --timeout=5 "$url"; then
            if ffprobe -v quiet -print_format json -show_streams "$url" 2>/dev/null | grep -q "codec_type"; then
                echo "[HLS] Stream is available!"
                return 0
            fi
        fi
        
        retry_count=$((retry_count + 1))
        echo "[HLS] Not ready yet (attempt $retry_count/$max_retries)..."
        sleep 5
    done
    
    return 1
}

stream_to_ai() {
    echo "=== Starting stream to AI ingest ==="
    
    echo "[AI] Waiting 60s for Livepeer HLS to initialize..."
    sleep 60
    
    while true; do
        echo "[AI] Checking HLS availability: $HLS_SOURCE_URL"
        
        if check_hls_with_retry "$HLS_SOURCE_URL"; then
            echo "[AI] Starting stream to: $RTMP_TARGET_AI"
            
            ffmpeg \
                -rw_timeout 10000000 \
                -timeout 10000000 \
                -reconnect 1 \
                -reconnect_at_eof 1 \
                -reconnect_streamed 1 \
                -reconnect_delay_max 5 \
                -re \
                -i "$HLS_SOURCE_URL" \
                -c copy \
                -f flv "$RTMP_TARGET_AI" \
                2>&1 | while IFS= read -r line; do echo "[AI] $line"; done
            
            echo "[AI] Stream ended, waiting 15s before retry..."
            sleep 15
        else
            echo "[AI] HLS not available, waiting 30s..."
            sleep 30
        fi
    done
}

# Cleanup function
cleanup() {
    echo "Cleaning up..."
    if [ -f "$PID_FILE" ]; then
        local pid=$(cat "$PID_FILE" 2>/dev/null)
        if [ -n "$pid" ]; then
            kill "$pid" 2>/dev/null || true
            # Also kill all child processes
            pkill -P "$pid" 2>/dev/null || true
        fi
        rm -f "$PID_FILE"
    fi
    exit 0
}

trap cleanup INT TERM EXIT

echo "=== Unified YouTube -> Livepeer -> AI Streaming ==="
echo "YouTube URL: $YOUTUBE_URL"
echo "Livepeer RTMP: $RTMP_TARGET_LP"
echo "HLS Source: $HLS_SOURCE_URL"
echo "AI RTMP: $RTMP_TARGET_AI"

if ! prepare_video; then
    echo "Failed to prepare video"
    exit 1
fi

stream_to_livepeer &
LP_PID=$!
echo $LP_PID > "$PID_FILE"
echo "Started Livepeer streaming (PID: $LP_PID)"

sleep 10

stream_to_ai 