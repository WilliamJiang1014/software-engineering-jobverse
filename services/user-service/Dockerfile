# User Service Dockerfile
FROM node:18-alpine AS base

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

# 安装构建工具（用于编译 bcrypt 等原生模块）
RUN apk add --no-cache python3 make g++

COPY services/user-service/package.json ./
RUN pnpm install

FROM base AS builder
WORKDIR /app

# 安装构建工具（用于编译 bcrypt 等原生模块）
RUN apk add --no-cache python3 make g++

# 在 builder 阶段重新安装依赖，确保 bcrypt 原生模块正确编译
# 这样可以避免 pnpm 符号链接结构导致的原生模块路径问题
COPY services/user-service/package.json ./
RUN pnpm install --shamefully-hoist

# 复制 Prisma schema 并生成 Prisma Client
# 安装 OpenSSL 开发库，让 Prisma 能检测到 OpenSSL 3.x 并生成正确的二进制
COPY prisma ./prisma
RUN apk add --no-cache openssl-dev && \
    npx prisma generate --schema=./prisma/schema.prisma && \
    apk del openssl-dev

COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN pnpm install && pnpm build

WORKDIR /app
RUN mkdir -p node_modules/@jobverse && \
    cp -r packages/shared node_modules/@jobverse/shared

COPY services/user-service/src ./src
COPY services/user-service/tsconfig.json ./
COPY services/user-service/package.json ./

RUN pnpm build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# 安装运行时依赖
# - libc6-compat: bcrypt 需要
# - python3 make g++: 用于重新编译 bcrypt 原生模块
RUN apk add --no-cache libc6-compat python3 make g++

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 在 runner 阶段重新编译 bcrypt 原生模块（确保在运行环境中正确编译）
RUN cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm rebuild && \
    apk del python3 make g++

EXPOSE 3001

CMD ["node", "dist/index.js"]
