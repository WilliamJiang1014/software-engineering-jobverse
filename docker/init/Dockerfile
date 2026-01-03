# 数据库初始化服务 Dockerfile
FROM node:18-alpine

# 配置 Alpine 使用国内镜像源（阿里云）
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.aliyun.com/g' /etc/apk/repositories

RUN npm install -g pnpm

WORKDIR /app

# 安装构建工具（用于 Prisma）
RUN apk add --no-cache openssl openssl-dev python3 make g++

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN HTTP_PROXY=http://172.18.0.1:7890 HTTPS_PROXY=http://172.18.0.1:7890 http_proxy=http://172.18.0.1:7890 https_proxy=http://172.18.0.1:7890 pnpm install --shamefully-hoist

# 重新编译 bcrypt 原生模块（Alpine Linux 需要）
RUN cd node_modules/.pnpm/bcrypt@5.1.1/node_modules/bcrypt && npm rebuild

# 复制 Prisma schema
COPY prisma ./prisma

# 复制共享包（如果需要）
COPY packages/shared ./packages/shared
WORKDIR /app/packages/shared
RUN HTTP_PROXY=http://172.18.0.1:7890 HTTPS_PROXY=http://172.18.0.1:7890 http_proxy=http://172.18.0.1:7890 https_proxy=http://172.18.0.1:7890 pnpm install && pnpm build

WORKDIR /app

# 复制初始化脚本
COPY scripts/db-init.sh ./scripts/db-init.sh
COPY scripts/check-db.js ./scripts/check-db.js
# 转换行尾符并设置执行权限
RUN sed -i 's/\r$//' ./scripts/db-init.sh && chmod +x ./scripts/db-init.sh

# 设置环境变量
ENV DATABASE_URL=${DATABASE_URL}

# 运行初始化脚本
CMD ["sh", "./scripts/db-init.sh"]

