FROM alpine:latest

RUN apk add --no-cache ffmpeg bash

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["/entrypoint.sh"] 