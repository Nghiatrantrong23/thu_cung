FROM node:24-bookworm-slim AS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci --omit=dev

FROM node:24-bookworm-slim
ENV NODE_ENV=development
WORKDIR /app/server
COPY --from=dependencies /app/server/node_modules ./node_modules
COPY server/package*.json ./
COPY server/src ./src
COPY server/scripts ./scripts
COPY migrations /app/migrations
COPY thu_cung.sql /app/thu_cung.sql
USER node
EXPOSE 5000
CMD ["node", "src/server.js"]
