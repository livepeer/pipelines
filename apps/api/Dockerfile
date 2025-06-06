FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./

RUN pnpm install

COPY . .

RUN pnpm run build:ts

FROM node:20-alpine AS runner

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs
RUN adduser -S app -u 1001

WORKDIR /app

RUN npm install -g pnpm

COPY package.json ./

RUN pnpm install --prod

COPY --from=builder --chown=app:nodejs /app/dist ./dist

USER app

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

ENTRYPOINT ["dumb-init", "--"]

CMD ["./node_modules/.bin/fastify", "start", "-l", "info", "--address", "0.0.0.0", "dist/app.js"] 