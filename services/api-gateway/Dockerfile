# API Gateway Dockerfile
FROM node:18-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY services/api-gateway/package.json ./
RUN pnpm install

FROM base AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制并构建共享包
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN pnpm install && pnpm build

# 将共享包复制到 node_modules
WORKDIR /app
RUN mkdir -p node_modules/@jobverse && \
    cp -r packages/shared node_modules/@jobverse/shared

# 复制服务源码
COPY services/api-gateway/src ./src
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/package.json ./

# 构建服务
RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
