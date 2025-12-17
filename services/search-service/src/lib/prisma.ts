import { PrismaClient } from '@prisma/client';

// Prisma Client 单例
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});
