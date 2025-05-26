#!/bin/bash
# Assumes the following environment variables are set before running:
# - YOUTUBE_URL_STREAM1
# - RTMP_TARGET_STREAM1
# - HLS_URL_STREAM2
# - RTMP_TARGET_STREAM2
# - FLY_APP_NAME (Final, sanitized name for the Fly app)
# - FLY_ORG      (Your Fly.io organization slug)
# - FLY_REGION   (The Fly.io region for deployment)

set -e 

if ! command -v flyctl &> /dev/null; then
    echo "Error: flyctl command not found. Please install it." >&2
    echo "See: https://fly.io/docs/hands-on/install-flyctl/" >&2
    exit 1
fi

required_vars=(
    "YOUTUBE_URL_STREAM1"
    "RTMP_TARGET_STREAM1"
    "HLS_URL_STREAM2"
    "RTMP_TARGET_STREAM2"
    "FLY_APP_NAME"
    "FLY_ORG"
    "FLY_REGION"
)

missing_vars=0
for var_name in "${required_vars[@]}"; do
    if [ -z "${!var_name}" ]; then 
        echo "Error: Required environment variable $var_name is not set." >&2
        missing_vars=1
    fi
done

if [ "$missing_vars" -eq 1 ]; then
    echo "Please set all required environment variables before running the script." >&2
    exit 1
fi

echo "--- Configuration ---"
echo "Fly App Name:     $FLY_APP_NAME"
echo "Fly Organization: $FLY_ORG"
echo "Fly Region:       $FLY_REGION"
echo "Stream 1 YouTube: $YOUTUBE_URL_STREAM1"
echo "Stream 1 RTMP:    $RTMP_TARGET_STREAM1"
echo "Stream 2 HLS:     $HLS_URL_STREAM2"
echo "Stream 2 RTMP:    $RTMP_TARGET_STREAM2"
echo "---------------------"
read -r -p "Proceed with deployment? (y/N): " confirm
if [[ ! "$confirm" =~ ^[yY](es)?$ ]]; then
    echo "Deployment cancelled."
    exit 0
fi

echo_step() {
    echo ""
    echo "-----> $1"
}

echo_step "Ensuring Fly App '$FLY_APP_NAME' (org: $FLY_ORG)..."
if ! flyctl status -a "$FLY_APP_NAME" --org "$FLY_ORG" > /dev/null 2>&1; then
    echo "       App '$FLY_APP_NAME' not found. Creating it..."
    flyctl apps create "$FLY_APP_NAME" --org "$FLY_ORG" --machines
else
    echo "       App '$FLY_APP_NAME' already exists."
fi

echo_step "Setting secrets for app '$FLY_APP_NAME'..."
flyctl secrets set -a "$FLY_APP_NAME" \
    YOUTUBE_URL_STREAM1="$YOUTUBE_URL_STREAM1" \
    RTMP_TARGET_STREAM1="$RTMP_TARGET_STREAM1" \
    HLS_URL_STREAM2="$HLS_URL_STREAM2" \
    RTMP_TARGET_STREAM2="$RTMP_TARGET_STREAM2" \
    PYTHONUNBUFFERED="1"

echo_step "Deploying app '$FLY_APP_NAME' to region '$FLY_REGION'..."
flyctl deploy -a "$FLY_APP_NAME" --region "$FLY_REGION" --ha=false

echo ""
echo "🎉 Deployment process initiated for app '$FLY_APP_NAME'."
echo "   Monitor status with: flyctl status -a $FLY_APP_NAME"
echo "   View logs with:    flyctl logs -a $FLY_APP_NAME"
