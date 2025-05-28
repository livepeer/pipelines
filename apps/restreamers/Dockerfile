FROM alpine:latest

RUN apk add --no-cache python3 py3-pip ffmpeg ca-certificates wget bash

RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

WORKDIR /app
RUN mkdir -p /app/data /app/logs

COPY entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

ENTRYPOINT ["/app/entrypoint.sh"]