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

MAX_RETRIES=5
INITIAL_RETRY_DELAY=15
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
if [ -z "$HLS_SOURCE_URL" ]; then echo "Error: HLS_URL_STREAM2 not set." >&2; exit 1; fi
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

stream_to_livepeer() {
    echo "=== Starting stream to Livepeer ==="
    local retry_count=0
    local retry_delay=$INITIAL_RETRY_DELAY
    
    while true; do
        echo "[LP] Streaming to: $RTMP_TARGET_LP (attempt $((retry_count + 1)))"
        
        ffmpeg -re \
            -stream_loop -1 \
            -i "$STREAMING_VIDEO_FILE" \
            -c copy \
            -bufsize 3000k \
            -maxrate 1500k \
            -f flv "$RTMP_TARGET_LP" \
            -loglevel error \
            2>&1 | while IFS= read -r line; do echo "[LP] $line"; done
        
        local exit_code=${PIPESTATUS[0]}
        
        if [ $exit_code -eq 0 ]; then
            echo "[LP] Stream ended normally"
            retry_count=0
            retry_delay=$INITIAL_RETRY_DELAY
        else
            echo "[LP] Stream failed with exit code: $exit_code"
            retry_count=$((retry_count + 1))
            
            if [ $retry_count -ge $MAX_RETRIES ]; then
                echo "[LP] Max retries reached, resetting counter but continuing..."
                retry_count=0
                retry_delay=$MAX_RETRY_DELAY
            else
                retry_delay=$(calculate_backoff $retry_count)
            fi
        fi
        
        echo "[LP] Waiting ${retry_delay}s before retry..."
        sleep $retry_delay
    done
}

check_hls_with_retry() {
    local url="$1"
    local max_retries=30
    local retry_count=0
    
    while [ $retry_count -lt $max_retries ]; do
        if curl -s -L -f -o /dev/null --max-time 10 "$url"; then
            echo "[HLS] Stream is available!"
            return 0
        fi
        
        retry_count=$((retry_count + 1))
        echo "[HLS] Not ready yet (attempt $retry_count/$max_retries)..."
        sleep 5
    done
    
    echo "[HLS] ERROR: Stream not available after $max_retries attempts"
    return 1
}

stream_to_ai() {
    echo "=== Starting stream to AI ingest ==="
    local retry_count=0
    local retry_delay=$INITIAL_RETRY_DELAY
    local consecutive_failures=0
    
    echo "[AI] Waiting 90s for Livepeer HLS to initialize..."
    sleep 90
    
    while true; do
        echo "[AI] Checking HLS availability: $HLS_SOURCE_URL"
        
        if check_hls_with_retry "$HLS_SOURCE_URL"; then
            echo "[AI] Starting stream to: $RTMP_TARGET_AI (attempt $((retry_count + 1)))"
            
            local error_count=0
            
            ffmpeg -rw_timeout 10000000 -timeout 10000000 \
                -reconnect 1 -reconnect_at_eof 1 -reconnect_streamed 1 \
                -reconnect_delay_max 10 \
                -re \
                -i "$HLS_SOURCE_URL" \
                -c copy \
                -f flv "$RTMP_TARGET_AI" \
                -loglevel error \
                2>&1 | while IFS= read -r line; do
                    if [[ "$line" =~ "Connection reset by peer" ]] || [[ "$line" =~ "Broken pipe" ]] || [[ "$line" =~ "Error writing trailer" ]]; then
                        echo "[AI] CRITICAL: $line"
                    elif [[ "$line" =~ "HTTP error" ]] || [[ "$line" =~ "Failed to reload" ]]; then
                        if [ $error_count -lt $ERROR_LOG_LIMIT ]; then
                            echo "[AI] $line"
                            error_count=$((error_count + 1))
                        elif [ $error_count -eq $ERROR_LOG_LIMIT ]; then
                            echo "[AI] [Suppressing further HTTP/reload errors...]"
                            error_count=$((error_count + 1))
                        fi
                    else
                        echo "[AI] $line"
                    fi
                done
            
            local exit_code=${PIPESTATUS[0]}
            
            if [ $exit_code -eq 0 ]; then
                echo "[AI] Stream ended normally"
                consecutive_failures=0
                retry_count=0
                retry_delay=$INITIAL_RETRY_DELAY
            else
                echo "[AI] Stream failed with exit code: $exit_code"
                consecutive_failures=$((consecutive_failures + 1))
                retry_count=$((retry_count + 1))
                
                if [ $consecutive_failures -ge 3 ]; then
                    echo "[AI] Multiple consecutive failures detected, waiting longer..."
                    retry_delay=$MAX_RETRY_DELAY
                    consecutive_failures=0
                elif [ $retry_count -ge $MAX_RETRIES ]; then
                    echo "[AI] Max retries reached, resetting counter but continuing..."
                    retry_count=0
                    retry_delay=$MAX_RETRY_DELAY
                else
                    retry_delay=$(calculate_backoff $retry_count)
                fi
            fi
            
            echo "[AI] Waiting ${retry_delay}s before retry..."
            sleep $retry_delay
        else
            echo "[AI] HLS not available, waiting 60s..."
            sleep 60
            consecutive_failures=$((consecutive_failures + 1))
            
            if [ $consecutive_failures -ge 5 ]; then
                echo "[AI] HLS has been unavailable for extended period, waiting 5 minutes..."
                sleep 300
                consecutive_failures=0
            fi
        fi
    done
}

health_check() {
    while true; do
        sleep 300
        
        if ! kill -0 $LP_PID 2>/dev/null; then
            echo "[HEALTH] Livepeer stream process died, restarting..."
            stream_to_livepeer &
            LP_PID=$!
        fi
        
        if ! kill -0 $AI_PID 2>/dev/null; then
            echo "[HEALTH] AI stream process died, restarting..."
            stream_to_ai &
            AI_PID=$!
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
echo "Started Livepeer streaming (PID: $LP_PID)"

sleep 10

stream_to_ai &
AI_PID=$!
echo "Started AI streaming (PID: $AI_PID)"

health_check &
HEALTH_PID=$!
echo "Started health checker (PID: $HEALTH_PID)"

echo "All processes started. Monitoring streams for 24/7 operation."
echo "Press Ctrl+C to stop."

wait 