# API Gateway Dockerfile
FROM node:18-alpine AS base

# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app

COPY services/api-gateway/package.json ./
# 配置代理环境变量以加速 npm 包下载
RUN HTTP_PROXY=http://172.18.0.1:7890 \
    HTTPS_PROXY=http://172.18.0.1:7890 \
    http_proxy=http://172.18.0.1:7890 \
    https_proxy=http://172.18.0.1:7890 \
    pnpm install

FROM base AS builder
WORKDIR /app

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules

# 复制并构建共享包
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
# 配置代理环境变量以加速 npm 包下载
RUN HTTP_PROXY=http://172.18.0.1:7890 \
    HTTPS_PROXY=http://172.18.0.1:7890 \
    http_proxy=http://172.18.0.1:7890 \
    https_proxy=http://172.18.0.1:7890 \
    pnpm install && pnpm build

# 将共享包复制到 node_modules
WORKDIR /app
RUN mkdir -p node_modules/@jobverse && \
    cp -r packages/shared node_modules/@jobverse/shared

# 复制服务源码
COPY services/api-gateway/src ./src
COPY services/api-gateway/tsconfig.json ./
COPY services/api-gateway/package.json ./

# 构建服务
# 配置代理环境变量以加速 npm 包下载（如果需要）
RUN HTTP_PROXY=http://172.18.0.1:7890 \
    HTTPS_PROXY=http://172.18.0.1:7890 \
    http_proxy=http://172.18.0.1:7890 \
    https_proxy=http://172.18.0.1:7890 \
    pnpm build

FROM node:18-alpine AS runner
# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/index.js"]
