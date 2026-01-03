#!/bin/sh

echo "🚀 开始数据库初始化..."

# 生成 Prisma Client（必须先生成才能连接）
# 配置代理环境变量以加速 Prisma 二进制下载
echo "🔧 生成 Prisma Client..."
export HTTP_PROXY=http://172.18.0.1:7890
export HTTPS_PROXY=http://172.18.0.1:7890
export http_proxy=http://172.18.0.1:7890
export https_proxy=http://172.18.0.1:7890
if ! npx prisma generate --schema=./prisma/schema.prisma; then
  echo "❌ Prisma Client 生成失败"
  exit 1
fi

# 等待数据库就绪
echo "⏳ 等待数据库连接..."
RETRIES=30
DB_READY=0
while [ $RETRIES -gt 0 ] && [ $DB_READY -eq 0 ]; do
  if node scripts/check-db.js > /dev/null 2>&1; then
    DB_READY=1
  else
    echo "等待数据库... ($RETRIES 次重试剩余)"
    RETRIES=$((RETRIES-1))
    sleep 2
  fi
done

if [ $DB_READY -eq 0 ]; then
  echo "❌ 数据库连接失败，请检查数据库服务是否正常运行"
  exit 1
fi

echo "✅ 数据库连接成功"

# 运行 Prisma 迁移或 db push
echo "📦 同步数据库结构..."
if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations 2>/dev/null)" ]; then
  echo "使用迁移模式..."
  if ! npx prisma migrate deploy --schema=./prisma/schema.prisma; then
    echo "⚠️  迁移失败，尝试使用 db push..."
    if ! npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate; then
      echo "❌ 数据库同步失败"
      exit 1
    fi
  fi
else
  echo "使用 db push 模式..."
  if ! npx prisma db push --schema=./prisma/schema.prisma --accept-data-loss --skip-generate; then
    echo "❌ 数据库同步失败"
    exit 1
  fi
fi

# 检查是否需要运行种子数据
echo "🌱 检查是否需要初始化种子数据..."
USER_COUNT=$(node scripts/check-db.js 2>/dev/null || echo "0")

if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
  echo "📊 数据库为空，开始初始化种子数据..."
  if ! node prisma/seed.js; then
    echo "⚠️  种子数据初始化失败，但继续执行"
  else
    echo "✅ 种子数据初始化完成"
  fi
else
  echo "ℹ️  数据库已有数据（用户数: $USER_COUNT），跳过种子数据初始化"
fi

echo "🎉 数据库初始化完成！"

