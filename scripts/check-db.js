// 检查数据库连接和用户数量
const { PrismaClient } = require('@prisma/client');

// 从环境变量获取 DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL 环境变量未设置');
  process.exit(1);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

async function checkDatabase() {
  try {
    await prisma.$connect();
    // 尝试查询用户表（如果表不存在会报错，但我们可以捕获）
    try {
      const userCount = await prisma.user.count();
      console.log(userCount);
    } catch (e) {
      // 表可能还不存在，返回 0
      console.log('0');
    }
    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    // 连接失败
    console.error('数据库连接错误:', error.message);
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

checkDatabase();

