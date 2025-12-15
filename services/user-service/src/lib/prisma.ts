import { PrismaClient } from '@prisma/client';

/**
 * Prisma Client 单例
 * 使用根目录的 schema.prisma
 * 注意：Prisma Client 需要在根目录运行 pnpm db:generate 生成
 */
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// 优雅关闭
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

