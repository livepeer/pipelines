FROM alpine:latest

RUN apk add --no-cache python3 py3-pip ffmpeg ca-certificates

RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app
RUN mkdir -p /app/data

COPY restream-yt-to-lp.sh /app/restream-yt-to-lp.sh
COPY restream-lp-to-dd.sh /app/restream-lp-to-dd.sh

RUN chmod +x /app/restream-yt-to-lp.sh && \
    chmod +x /app/restream-lp-to-dd.sh