# Review Service Dockerfile
FROM node:18-alpine AS base

# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY services/review-service/package.json ./
RUN HTTP_PROXY=http://172.18.0.1:7890 HTTPS_PROXY=http://172.18.0.1:7890 http_proxy=http://172.18.0.1:7890 https_proxy=http://172.18.0.1:7890 pnpm install

FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN HTTP_PROXY=http://172.18.0.1:7890 HTTPS_PROXY=http://172.18.0.1:7890 http_proxy=http://172.18.0.1:7890 https_proxy=http://172.18.0.1:7890 pnpm install && pnpm build

WORKDIR /app
RUN mkdir -p node_modules/@jobverse && \
    cp -r packages/shared node_modules/@jobverse/shared

# 复制 Prisma schema 并生成 Client
# 配置代理环境变量以加速 Prisma 二进制下载
COPY prisma ./prisma
RUN HTTP_PROXY=http://172.18.0.1:7890 \
    HTTPS_PROXY=http://172.18.0.1:7890 \
    http_proxy=http://172.18.0.1:7890 \
    https_proxy=http://172.18.0.1:7890 \
    npx prisma generate --schema=./prisma/schema.prisma

COPY services/review-service/src ./src
COPY services/review-service/tsconfig.json ./
COPY services/review-service/package.json ./

RUN pnpm build

FROM node:18-alpine AS runner
# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

ENV NODE_ENV=production
ENV TZ=Asia/Shanghai

# 安装 OpenSSL 3.x 和时区数据供 Prisma 使用
RUN apk add --no-cache openssl tzdata && \
    cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && \
    echo "Asia/Shanghai" > /etc/timezone

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3004

CMD ["node", "dist/index.js"]
