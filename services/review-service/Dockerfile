# Review Service Dockerfile
FROM node:18-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY services/review-service/package.json ./
RUN pnpm install

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN pnpm install && pnpm build

WORKDIR /app
RUN mkdir -p node_modules/@jobverse && \
    cp -r packages/shared node_modules/@jobverse/shared

COPY services/review-service/src ./src
COPY services/review-service/tsconfig.json ./
COPY services/review-service/package.json ./

RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3004

CMD ["node", "dist/index.js"]
