#!/bin/bash
set -euo pipefail

SOURCE_URL="${SOURCE_URL}"
RTMP_TARGET_LP="${RTMP_TARGET_LP}"
RTMP_TARGET_AI="${RTMP_TARGET_AI}"

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

if [ -z "$SOURCE_URL" ]; then echo "Error: YOUTUBE_URL_STREAM1 not set." >&2; exit 1; fi
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

is_youtube_url() {
    local url="$1"
    if [[ "$url" =~ ^https?://(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com) ]]; then
        return 0
    else
        return 1
    fi
}

prepare_video() {
    echo "=== Preparing video from source ==="
    
    if is_youtube_url "$SOURCE_URL"; then
        echo "Detected YouTube URL, using yt-dlp..."
        prepare_video_youtube
    else
        echo "Detected direct video URL, downloading directly..."
        prepare_video_direct
    fi
}

prepare_video_youtube() {
    set -- yt-dlp --no-progress --get-filename -f "$FORMAT_SELECTOR" --merge-output-format mp4
    if [ -f "$COOKIES_FILE" ]; then
        set -- "$@" --cookies "$COOKIES_FILE"
    fi
    set -- "$@" -o "${DOWNLOAD_DIR}/%(title)s.%(ext)s" "$SOURCE_URL"
    
    echo "Determining filename..."
    ACTUAL_VIDEO_FILE=$("$@")
    
    if [ -z "$ACTUAL_VIDEO_FILE" ]; then
        echo "Error: Failed to determine video filename" >&2
        return 1
    fi
    
    if [ ! -f "$ACTUAL_VIDEO_FILE" ]; then
        echo "Downloading from YouTube: $SOURCE_URL"
        echo "Note: Will download 60fps if no 30fps available, then convert to 30fps"
        
        set -- yt-dlp --no-progress -f "$FORMAT_SELECTOR" --merge-output-format mp4
        if [ -f "$COOKIES_FILE" ]; then
            set -- "$@" --cookies "$COOKIES_FILE"
        fi
        set -- "$@" -o "$ACTUAL_VIDEO_FILE" "$SOURCE_URL"
        
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

prepare_video_direct() {
    # Extract filename from URL
    FILENAME=$(basename "$SOURCE_URL" | cut -d'?' -f1)
    if [ -z "$FILENAME" ] || [[ "$FILENAME" != *.* ]]; then
        FILENAME="video.mp4"
    fi
    
    ACTUAL_VIDEO_FILE="${DOWNLOAD_DIR}/${FILENAME}"
    SOURCE_FILENAME_NO_EXT="${FILENAME%.*}"
    STREAMING_VIDEO_FILE="${DOWNLOAD_DIR}/${SOURCE_FILENAME_NO_EXT}_streamable.mp4"
    
    if [ ! -f "$ACTUAL_VIDEO_FILE" ]; then
        echo "Downloading from direct URL: $SOURCE_URL"
        
        # Use wget to download the file
        if ! wget -O "$ACTUAL_VIDEO_FILE" "$SOURCE_URL"; then
            echo "Direct download failed, trying with curl..." >&2
            if ! curl -L -o "$ACTUAL_VIDEO_FILE" "$SOURCE_URL"; then
                echo "Download failed with both wget and curl" >&2
                return 1
            fi
        fi
        
        if [ ! -f "$ACTUAL_VIDEO_FILE" ] || [ ! -s "$ACTUAL_VIDEO_FILE" ]; then
            echo "Error: Downloaded file is empty or doesn't exist" >&2
            return 1
        fi
    fi
    
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
        echo "[DUAL] Livepeer RTMP: $RTMP_TARGET_LP (with audio)"
        echo "[DUAL] AI RTMP: $RTMP_TARGET_AI (video only, no audio)"
        
        # Use multiple outputs to send the same stream to both RTMP endpoints
        # Livepeer gets video + audio, AI gets video only (-an)
        ffmpeg -re \
            -stream_loop -1 \
            -i "$STREAMING_VIDEO_FILE" \
            -c:v copy \
            -c:a copy \
            -bufsize 3000k \
            -maxrate 1500k \
            -f flv "$RTMP_TARGET_LP" \
            -c:v copy \
            -an \
            -bufsize 3000k \
            -maxrate 1500k \
            -f flv "$RTMP_TARGET_AI" \
            -loglevel info \
            -reconnect 1 \
            -reconnect_at_eof 1 \
            -reconnect_streamed 1 \
            -reconnect_delay_max 30 \
            2>&1 | while IFS= read -r line; do 
                if [[ "$line" =~ "Connection reset by peer" ]] || [[ "$line" =~ "Broken pipe" ]] || [[ "$line" =~ "Error writing trailer" ]]; then
                    echo "[DUAL] CRITICAL: $line"
                elif [[ "$line" =~ "HTTP error" ]] || [[ "$line" =~ "Failed to" ]]; then
                    echo "[DUAL] WARNING: $line"
                else
                    echo "[DUAL] $line"
                fi
            done
        
        local exit_code=${PIPESTATUS[0]}
        
        if [ $exit_code -eq 0 ]; then
            echo "[DUAL] Stream ended normally"
            consecutive_failures=0
            retry_count=0
            retry_delay=$INITIAL_RETRY_DELAY
        else
            echo "[DUAL] Stream failed with exit code: $exit_code"
            consecutive_failures=$((consecutive_failures + 1))
            retry_count=$((retry_count + 1))
            
            if [ $consecutive_failures -ge 3 ]; then
                echo "[DUAL] Multiple consecutive failures detected, using longer delay..."
                retry_delay=$MAX_RETRY_DELAY
                consecutive_failures=0
            elif [ $retry_count -ge $MAX_RETRIES ]; then
                echo "[DUAL] Max retries reached, resetting counter but continuing..."
                retry_count=0
                retry_delay=$MAX_RETRY_DELAY
            else
                retry_delay=$(calculate_backoff $retry_count)
            fi
            
            echo "[DUAL] Performing health check before retry..."
            if [ -f "$STREAMING_VIDEO_FILE" ]; then
                echo "[DUAL] Source video file is accessible"
            else
                echo "[DUAL] ERROR: Source video file is missing, attempting to re-prepare..."
                if ! prepare_video; then
                    echo "[DUAL] Failed to re-prepare video, waiting longer..."
                    retry_delay=$((retry_delay * 2))
                fi
            fi
        fi
        
        echo "[DUAL] Waiting ${retry_delay}s before retry..."
        sleep $retry_delay
    done
}

monitor_stream_health() {
    echo "=== Starting stream health monitor ==="
    local last_check=0
    local health_check_interval=60  # Check every 60 seconds
    local network_failures=0
    local max_network_failures=3
    
    while true; do
        sleep $health_check_interval
        
        current_time=$(date +%s)
        
        if ! ping -c 1 -W 5 8.8.8.8 >/dev/null 2>&1; then
            network_failures=$((network_failures + 1))
            echo "[MONITOR] Network connectivity issue detected ($network_failures/$max_network_failures)"
            
            if [ $network_failures -ge $max_network_failures ]; then
                echo "[MONITOR] Multiple network failures, restarting stream..."
                if kill -0 $STREAM_PID 2>/dev/null; then
                    kill $STREAM_PID 2>/dev/null || true
                    sleep 5
                fi
                network_failures=0
            fi
        else
            network_failures=0
        fi
        
        if ! kill -0 $STREAM_PID 2>/dev/null; then
            echo "[MONITOR] Stream process (PID: $STREAM_PID) has died, restarting..."
            
            pkill -f "ffmpeg.*$RTMP_TARGET_LP" 2>/dev/null || true
            pkill -f "ffmpeg.*$RTMP_TARGET_AI" 2>/dev/null || true
            sleep 5
            
            echo "[MONITOR] Testing RTMP endpoint connectivity..."
            LP_HOST=$(echo "$RTMP_TARGET_LP" | sed 's|rtmp://||' | cut -d'/' -f1 | cut -d':' -f1)
            AI_HOST=$(echo "$RTMP_TARGET_AI" | sed 's|rtmp://||' | cut -d'/' -f1 | cut -d':' -f1)
            
            if ! nc -z -w5 "$LP_HOST" 1935 2>/dev/null; then
                echo "[MONITOR] WARNING: Livepeer RTMP endpoint ($LP_HOST:1935) not reachable"
            fi
            
            if ! nc -z -w5 "$AI_HOST" 1935 2>/dev/null; then
                echo "[MONITOR] WARNING: AI RTMP endpoint ($AI_HOST:1935) not reachable"
            fi
            
            stream_dual_to_rtmp &
            STREAM_PID=$!
            echo "[MONITOR] Restarted stream process (new PID: $STREAM_PID)"
        else
            echo "[MONITOR] Stream process is healthy (PID: $STREAM_PID)"
        fi
        
        available_space=$(df "$DOWNLOAD_DIR" | awk 'NR==2 {print $4}')
        if [ "$available_space" -lt 1048576 ]; then  # Less than 1GB
            echo "[MONITOR] WARNING: Low disk space ($available_space KB available)"
        fi
        
        if [ ! -f "$STREAMING_VIDEO_FILE" ] || [ ! -r "$STREAMING_VIDEO_FILE" ]; then
            echo "[MONITOR] ERROR: Source video file missing or unreadable, attempting recovery..."
            if ! prepare_video; then
                echo "[MONITOR] Failed to recover video file"
            fi
        fi
        
        if [ $((current_time - last_check)) -ge 300 ]; then  # Every 5 minutes
            echo "[MONITOR] Status: Stream running, network OK, disk space: ${available_space}KB"
            last_check=$current_time
        fi
    done
}

cleanup() {
    echo "Cleaning up..."
    
    if [ -n "${MONITOR_PID:-}" ]; then
        kill $MONITOR_PID 2>/dev/null || true
    fi
    
    if [ -n "${STREAM_PID:-}" ]; then
        kill $STREAM_PID 2>/dev/null || true
    fi
    
    pkill -f "ffmpeg.*$RTMP_TARGET_LP" 2>/dev/null || true
    pkill -f "ffmpeg.*$RTMP_TARGET_AI" 2>/dev/null || true
    
    jobs -p | xargs -r kill 2>/dev/null || true
    wait
    exit 0
}

trap cleanup INT TERM EXIT

echo "=== Source to Dual RTMP Streaming ==="
echo "Source URL: $SOURCE_URL"
echo "Livepeer RTMP: $RTMP_TARGET_LP"
echo "AI RTMP: $RTMP_TARGET_AI"

if ! prepare_video; then
    echo "Failed to prepare video"
    exit 1
fi

stream_dual_to_rtmp &
STREAM_PID=$!
echo "Started dual streaming (PID: $STREAM_PID)"

# Start health monitor in background
monitor_stream_health &
MONITOR_PID=$!
echo "Started stream monitor (PID: $MONITOR_PID)"

echo "All processes started. Press Ctrl+C to stop."
echo "Stream status: Livepeer (with audio) + AI (video only)"

wait 