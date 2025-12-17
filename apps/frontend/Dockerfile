# Frontend Dockerfile
FROM node:18-alpine AS base

RUN npm install -g pnpm

FROM base AS builder
WORKDIR /app

# 复制前端应用所有文件
COPY apps/frontend ./

ENV NEXT_TELEMETRY_DISABLED 1
# Next.js 需要在构建时嵌入 NEXT_PUBLIC_* 环境变量
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

# 安装依赖并构建
RUN pnpm install && pnpm build

FROM node:18-alpine AS runner
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

