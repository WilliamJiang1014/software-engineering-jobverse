# Frontend Dockerfile
FROM node:18-alpine AS base

# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN npm install -g pnpm

# Development stage
FROM base AS dev
WORKDIR /app
COPY apps/frontend/package.json ./
RUN HTTP_PROXY=http://172.18.0.1:7890 HTTPS_PROXY=http://172.18.0.1:7890 http_proxy=http://172.18.0.1:7890 https_proxy=http://172.18.0.1:7890 pnpm install
CMD ["pnpm", "dev"]

FROM base AS builder
WORKDIR /app

# 复制前端应用所有文件
COPY apps/frontend ./

ENV NEXT_TELEMETRY_DISABLED 1
# Next.js 需要在构建时嵌入 NEXT_PUBLIC_* 环境变量
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 安装依赖并构建
RUN HTTP_PROXY=http://172.18.0.1:7890 HTTPS_PROXY=http://172.18.0.1:7890 http_proxy=http://172.18.0.1:7890 https_proxy=http://172.18.0.1:7890 pnpm install && pnpm build

FROM node:18-alpine AS runner
# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 8080

ENV PORT 8080
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

