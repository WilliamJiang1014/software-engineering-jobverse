import { PrismaClient } from '@prisma/client';

// Prisma Client 单例，使用根目录 schema.prisma
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

