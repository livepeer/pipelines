FROM node:20-slim AS base

WORKDIR /usr/src/app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ffmpeg \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

FROM base AS build
WORKDIR /usr/src/app
COPY . .
RUN npm install
RUN npm run build --if-present

FROM base AS release
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=build /usr/src/app/dist ./dist

ENV PORT=8080
EXPOSE ${PORT}

CMD ["npm", "run", "start"]