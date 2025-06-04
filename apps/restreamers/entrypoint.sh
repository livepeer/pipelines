#!/bin/bash
set -euo pipefail

YOUTUBE_URL="${YOUTUBE_URL_STREAM1}"
RTMP_TARGET_LP="${RTMP_TARGET_STREAM1}"
RTMP_TARGET_AI="${RTMP_TARGET_STREAM2}"

DOWNLOAD_DIR="/app/data"
COOKIES_FILE="/app/cookies.txt"
PID_FILE="/app/stream.pid"
LOG_DIR="/app/logs"

MAX_RETRIES=5
INITIAL_RETRY_DELAY=5
MAX_RETRY_DELAY=300
ERROR_LOG_LIMIT=10

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
if [ -z "$RTMP_TARGET_AI" ]; then echo "Error: RTMP_TARGET_STREAM2 not set." >&2; exit 1; fi

FORMAT_SELECTOR="bestvideo[height<=360][vcodec^=avc][dynamic_range!=HDR][ext=mp4]+bestaudio[acodec=aac][ext=m4a]/bestvideo[height<=360][vcodec^=avc][ext=mp4]+bestaudio[acodec=aac][ext=m4a]/bestvideo[height<=360][vcodec^=avc]+bestaudio/bestvideo[height<=360]+bestaudio/best[height<=360]"

KEYFRAME_GOP_SIZE="60"  # 2 seconds at 30fps
PRE_ENCODE_VIDEO_OPTS="-c:v libx264 -g $KEYFRAME_GOP_SIZE -keyint_min $KEYFRAME_GOP_SIZE -preset veryfast -tune zerolatency -pix_fmt yuv420p -crf 28 -profile:v baseline -level 3.0 -sc_threshold 0 -r 30 -vsync cfr -vf scale=in_range=limited:out_range=limited"
PRE_ENCODE_AUDIO_OPTS="-c:a aac -ar 44100 -b:a 128k"

calculate_backoff() {
    local retry_count=$1
    local delay=$((INITIAL_RETRY_DELAY * (2 ** retry_count)))
    if [ $delay -gt $MAX_RETRY_DELAY ]; then
        delay=$MAX_RETRY_DELAY
    fi
    echo $delay
}

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
        echo "Note: Will download 60fps if no 30fps available, then convert to 30fps"
        
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
    
    echo "Pre-processing video for streaming (converting to 30fps SDR)..."
    echo "This may take a while for 60fps HDR content..."
    
    ffmpeg -i "$ACTUAL_VIDEO_FILE" \
        -vf "scale=in_range=limited:out_range=limited,format=yuv420p" \
        -color_primaries bt709 \
        -color_trc bt709 \
        -colorspace bt709 \
        $PRE_ENCODE_VIDEO_OPTS \
        $PRE_ENCODE_AUDIO_OPTS \
        -movflags +faststart \
        -y "$STREAMING_VIDEO_FILE"
    
    if [ $? -ne 0 ]; then
        echo "Error: Pre-processing failed" >&2
        return 1
    fi
    
    echo "Video prepared: $STREAMING_VIDEO_FILE (30fps SDR)"
    export STREAMING_VIDEO_FILE
    return 0
}

stream_dual_to_rtmp() {
    echo "=== Starting dual stream to both RTMP endpoints ==="
    local retry_count=0
    local retry_delay=$INITIAL_RETRY_DELAY
    local consecutive_failures=0
    
    while true; do
        echo "[DUAL] Streaming to both endpoints (attempt $((retry_count + 1)))"
        echo "[DUAL] Livepeer RTMP: $RTMP_TARGET_LP"
        echo "[DUAL] AI RTMP: $RTMP_TARGET_AI"
        
        timeout 3600 ffmpeg -re \
            -stream_loop -1 \
            -i "$STREAMING_VIDEO_FILE" \
            -c:v copy \
            -c:a copy \
            -bufsize 2000k \
            -maxrate 1200k \
            -rtmp_live 1 \
            -rtmp_buffer 1000 \
            -rtmp_conn_timeout 10 \
            -f flv "$RTMP_TARGET_LP" \
            -c:v copy \
            -c:a copy \
            -bufsize 2000k \
            -maxrate 1200k \
            -rtmp_live 1 \
            -rtmp_buffer 1000 \
            -rtmp_conn_timeout 10 \
            -f flv "$RTMP_TARGET_AI" \
            -loglevel warning \
            2>&1 | while IFS= read -r line; do
                echo "[DUAL] $line"
                if [[ "$line" =~ "Error muxing a packet" ]] || [[ "$line" =~ "Connection reset by peer" ]] || [[ "$line" =~ "Broken pipe" ]] || [[ "$line" =~ "I/O error" ]]; then
                    echo "[DUAL] CRITICAL ERROR detected: $line"
                    pkill -f "ffmpeg.*$RTMP_TARGET_LP.*$RTMP_TARGET_AI" 2>/dev/null || true
                fi
            done
        
        local exit_code=$?
        
        if [ $exit_code -eq 0 ]; then
            echo "[DUAL] Stream ended normally"
            consecutive_failures=0
            retry_count=0
            retry_delay=$INITIAL_RETRY_DELAY
        elif [ $exit_code -eq 124 ]; then
            echo "[DUAL] Stream timeout after 1 hour (normal rotation)"
            consecutive_failures=0
            retry_count=0
            retry_delay=5
        else
            echo "[DUAL] Stream failed with exit code: $exit_code"
            consecutive_failures=$((consecutive_failures + 1))
            retry_count=$((retry_count + 1))
            
            if [ $consecutive_failures -ge 3 ]; then
                echo "[DUAL] Multiple consecutive failures, increasing delay..."
                retry_delay=$MAX_RETRY_DELAY
                consecutive_failures=0
            elif [ $retry_count -ge $MAX_RETRIES ]; then
                echo "[DUAL] Max retries reached, resetting counter but continuing..."
                retry_count=0
                retry_delay=$MAX_RETRY_DELAY
            else
                retry_delay=$(calculate_backoff $retry_count)
            fi
        fi
        
        echo "[DUAL] Waiting ${retry_delay}s before retry..."
        sleep $retry_delay
    done
}

health_check() {
    while true; do
        sleep 60  # Check every 5 minutes
        
        if ! kill -0 $STREAM_PID 2>/dev/null; then
            echo "[HEALTH] Dual stream process died, restarting..."
            stream_dual_to_rtmp &
            STREAM_PID=$!
        fi
    done
}

cleanup() {
    echo "Cleaning up..."
    jobs -p | xargs -r kill 2>/dev/null || true
    wait
    exit 0
}

trap cleanup INT TERM EXIT

echo "=== YouTube to Independent Dual RTMP Streaming ==="
echo "YouTube URL: $YOUTUBE_URL"
echo "Livepeer RTMP: $RTMP_TARGET_LP"
echo "AI RTMP: $RTMP_TARGET_AI"
echo "Strategy: Single process with enhanced error handling"

if ! prepare_video; then
    echo "Failed to prepare video"
    exit 1
fi

stream_dual_to_rtmp &
STREAM_PID=$!
echo "Started dual streaming (PID: $STREAM_PID)"

health_check &
HEALTH_PID=$!
echo "Started health check (PID: $HEALTH_PID)"

echo "Stream started. Press Ctrl+C to stop."

wait 