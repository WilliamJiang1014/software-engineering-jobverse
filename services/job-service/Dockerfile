# Job Service Dockerfile
FROM node:18-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY services/job-service/package.json ./
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

# 复制 Prisma schema 并生成 Client
COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma

COPY services/job-service/src ./src
COPY services/job-service/tsconfig.json ./
COPY services/job-service/package.json ./

RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装 OpenSSL 3.x 供 Prisma 使用
RUN apk add --no-cache openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3002

CMD ["node", "dist/index.js"]
