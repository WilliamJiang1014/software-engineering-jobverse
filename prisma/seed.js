const { PrismaClient, UserRole, JobStatus, ApplicationStatus, ReviewStatus } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

/**
 * 数据库种子数据初始化
 * 运行方式: node prisma/seed.js
 */
async function main() {
  console.log('🌱 开始初始化数据库种子数据...');

  // 清空现有数据（按依赖顺序）
  console.log('🗑️  清空现有数据...');
  await prisma.auditLog.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.application.deleteMany();
  await prisma.review.deleteMany();
  await prisma.riskRule.deleteMany();
  await prisma.job.deleteMany();
  await prisma.employerInfo.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();

  // 统一密码：jobverse123
  const passwordHash = await bcrypt.hash('jobverse123', 10);

  // ============================================
  // 1. 创建用户
  // ============================================
  console.log('👤 创建用户...');
  
  const student = await prisma.user.create({
    data: {
      email: 'student@jobverse.test',
      passwordHash,
      role: UserRole.STUDENT,
      name: '张三',
      phone: '13800138001',
    },
  });

  const employer1 = await prisma.user.create({
    data: {
      email: 'employer1@jobverse.test',
      passwordHash,
      role: UserRole.EMPLOYER,
      name: '李经理',
      phone: '13800138002',
    },
  });

  const employer2 = await prisma.user.create({
    data: {
      email: 'employer2@jobverse.test',
      passwordHash,
      role: UserRole.EMPLOYER,
      name: '王总',
      phone: '13800138003',
    },
  });

  const schoolAdmin = await prisma.user.create({
    data: {
      email: 'school@jobverse.test',
      passwordHash,
      role: UserRole.SCHOOL_ADMIN,
      name: '就业中心-张老师',
      phone: '13800138004',
    },
  });

  const platformAdmin = await prisma.user.create({
    data: {
      email: 'admin@jobverse.test',
      passwordHash,
      role: UserRole.PLATFORM_ADMIN,
      name: '平台管理员',
      phone: '13800138005',
    },
  });

  // 额外创建几个学生用户用于演示
  const student2 = await prisma.user.create({
    data: {
      email: 'student2@jobverse.test',
      passwordHash,
      role: UserRole.STUDENT,
      name: '李四',
      phone: '13800138006',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@jobverse.test',
      passwordHash,
      role: UserRole.STUDENT,
      name: '王五',
      phone: '13800138007',
    },
  });

  console.log(`✅ 已创建 ${7} 个用户`);

  // ============================================
  // 2. 创建企业
  // ============================================
  console.log('🏢 创建企业...');

  const company1 = await prisma.company.create({
    data: {
      name: 'XX科技有限公司',
      industry: '互联网/IT',
      scale: '201-500人',
      location: '北京',
      description: '一家专注于互联网技术的科技公司，致力于为高校学生提供优质的实习和就业机会。公司成立于2015年，拥有完善的技术团队和良好的企业文化。',
      website: 'https://example.com',
      verifiedBySchool: true, // 已通过学校认证
    },
  });

  const company2 = await prisma.company.create({
    data: {
      name: 'YY互联网公司',
      industry: '互联网/电商',
      scale: '501-1000人',
      location: '上海',
      description: '国内领先的互联网公司，业务涵盖电商、金融、云计算等多个领域。我们重视人才培养，为应届毕业生提供完善的成长路径。',
      website: 'https://example2.com',
      verifiedBySchool: true,
    },
  });

  const company3 = await prisma.company.create({
    data: {
      name: 'ZZ创新科技',
      industry: '人工智能/大数据',
      scale: '50-200人',
      location: '深圳',
      description: '专注于人工智能和大数据技术的创新型企业，团队年轻有活力，适合有创新精神的应届毕业生加入。',
      website: 'https://example3.com',
      verifiedBySchool: false, // 未认证
    },
  });

  console.log(`✅ 已创建 ${3} 个企业`);

  // ============================================
  // 3. 创建企业用户关联
  // ============================================
  console.log('🔗 创建企业用户关联...');

  await prisma.employerInfo.create({
    data: {
      userId: employer1.id,
      companyId: company1.id,
      position: '招聘经理',
    },
  });

  await prisma.employerInfo.create({
    data: {
      userId: employer2.id,
      companyId: company2.id,
      position: 'HR总监',
    },
  });

  console.log(`✅ 已创建 ${2} 个企业用户关联`);

  // ============================================
  // 4. 创建岗位
  // ============================================
  console.log('💼 创建岗位...');

  const now = new Date();
  const futureDate = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90天后过期

  // 公司1的岗位（已审核通过）
  const job1 = await prisma.job.create({
    data: {
      companyId: company1.id,
      title: '前端开发工程师',
      location: '北京',
      salaryMin: 15000,
      salaryMax: 25000,
      description: '负责公司前端产品的开发和维护，参与产品需求讨论和技术方案设计。\n\n工作内容：\n1. 负责Web前端开发，使用React/Vue等框架\n2. 与UI设计师协作，实现高质量的页面效果\n3. 优化前端性能，提升用户体验\n4. 参与技术选型和架构设计',
      requirements: '任职要求：\n1. 本科及以上学历，计算机相关专业\n2. 熟悉React、Vue等前端框架\n3. 熟悉TypeScript、ES6+语法\n4. 有良好的代码规范和团队协作能力\n5. 有实习或项目经验者优先',
      tags: ['React', 'TypeScript', '前端开发'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job2 = await prisma.job.create({
    data: {
      companyId: company1.id,
      title: '后端开发工程师',
      location: '北京',
      salaryMin: 18000,
      salaryMax: 30000,
      description: '负责后端服务的设计与开发，参与系统架构设计和技术攻关。',
      requirements: '1. 熟悉Node.js/Python/Java等后端技术\n2. 熟悉数据库设计和SQL优化\n3. 了解微服务架构\n4. 有良好的问题分析和解决能力',
      tags: ['Node.js', 'PostgreSQL', '后端开发'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  // 公司2的岗位
  const job3 = await prisma.job.create({
    data: {
      companyId: company2.id,
      title: '产品经理',
      location: '上海',
      salaryMin: 20000,
      salaryMax: 35000,
      description: '负责产品规划、需求分析和项目管理，与开发团队协作推进产品迭代。',
      requirements: '1. 本科及以上学历\n2. 有产品设计或项目管理经验\n3. 熟悉B端产品设计\n4. 具备良好的沟通和协调能力',
      tags: ['产品经理', 'B端', '数据分析'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job4 = await prisma.job.create({
    data: {
      companyId: company2.id,
      title: 'Java开发工程师',
      location: '上海',
      salaryMin: 16000,
      salaryMax: 28000,
      description: '负责Java后端服务开发，参与核心业务系统建设。',
      requirements: '1. 熟悉Java开发，了解Spring框架\n2. 熟悉MySQL/PostgreSQL数据库\n3. 了解分布式系统设计\n4. 有良好的编程基础',
      tags: ['Java', 'Spring', '后端开发'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  // 公司3的岗位（未认证企业）
  const job5 = await prisma.job.create({
    data: {
      companyId: company3.id,
      title: 'AI算法工程师',
      location: '深圳',
      salaryMin: 22000,
      salaryMax: 40000,
      description: '负责AI算法研发，参与机器学习模型的训练和优化。',
      requirements: '1. 硕士及以上学历，计算机/数学相关专业\n2. 熟悉Python、TensorFlow/PyTorch\n3. 有机器学习/深度学习项目经验\n4. 有论文发表者优先',
      tags: ['AI', '机器学习', 'Python'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  // 待审核的岗位
  const job6 = await prisma.job.create({
    data: {
      companyId: company1.id,
      title: 'UI设计师',
      location: '北京',
      salaryMin: 12000,
      salaryMax: 20000,
      description: '负责产品UI设计，参与设计规范制定和用户体验优化。',
      requirements: '1. 熟悉Figma/Sketch等设计工具\n2. 有良好的视觉设计能力\n3. 了解前端实现原理\n4. 有作品集',
      tags: ['UI设计', 'Figma', '用户体验'],
      status: JobStatus.PENDING_REVIEW,
      expiresAt: futureDate,
    },
  });

  // 草稿状态的岗位
  const job7 = await prisma.job.create({
    data: {
      companyId: company2.id,
      title: '数据分析师',
      location: '上海',
      salaryMin: 15000,
      salaryMax: 25000,
      description: '负责业务数据分析，为业务决策提供数据支持。',
      requirements: '1. 熟悉SQL、Python\n2. 有数据分析经验\n3. 了解统计学基础\n4. 有商业分析思维',
      tags: ['数据分析', 'Python', 'SQL'],
      status: JobStatus.DRAFT,
      expiresAt: futureDate,
    },
  });

  // 已驳回的岗位
  const job8 = await prisma.job.create({
    data: {
      companyId: company3.id,
      title: '测试工程师',
      location: '深圳',
      salaryMin: 10000,
      salaryMax: 18000,
      description: '负责产品测试，编写测试用例和执行测试。',
      requirements: '1. 熟悉测试理论和方法\n2. 了解自动化测试\n3. 有测试经验者优先',
      tags: ['测试', 'QA'],
      status: JobStatus.REJECTED,
      expiresAt: futureDate,
    },
  });

  console.log(`✅ 已创建 ${8} 个岗位`);

  // ============================================
  // 5. 创建审核记录
  // ============================================
  console.log('📋 创建审核记录...');

  // 已审核通过的岗位
  await prisma.review.create({
    data: {
      jobId: job1.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '岗位信息完整，符合要求，已通过审核。',
      reviewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5天前
    },
  });

  await prisma.review.create({
    data: {
      jobId: job2.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job3.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job4.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job5.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 已驳回的岗位
  await prisma.review.create({
    data: {
      jobId: job8.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.REJECTED,
      comment: '岗位描述不够详细，薪资范围偏低，建议修改后重新提交。',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  // 待审核的岗位
  await prisma.review.create({
    data: {
      jobId: job6.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.PENDING,
      comment: null,
      reviewedAt: null,
    },
  });

  console.log(`✅ 已创建 ${7} 条审核记录`);

  // ============================================
  // 6. 创建投递记录
  // ============================================
  console.log('📮 创建投递记录...');

  const application1 = await prisma.application.create({
    data: {
      userId: student.id,
      jobId: job1.id,
      status: ApplicationStatus.APPLIED,
      resume: '张三的简历内容...',
      coverLetter: '尊敬的HR，我对贵公司的前端开发岗位非常感兴趣...',
    },
  });

  const application2 = await prisma.application.create({
    data: {
      userId: student.id,
      jobId: job2.id,
      status: ApplicationStatus.VIEWED,
      resume: '张三的简历内容...',
    },
  });

  const application3 = await prisma.application.create({
    data: {
      userId: student.id,
      jobId: job3.id,
      status: ApplicationStatus.INTERVIEWING,
      resume: '张三的简历内容...',
    },
  });

  const application4 = await prisma.application.create({
    data: {
      userId: student2.id,
      jobId: job1.id,
      status: ApplicationStatus.VIEWED,
      resume: '李四的简历内容...',
    },
  });

  const application5 = await prisma.application.create({
    data: {
      userId: student2.id,
      jobId: job4.id,
      status: ApplicationStatus.ACCEPTED,
      resume: '李四的简历内容...',
    },
  });

  const application6 = await prisma.application.create({
    data: {
      userId: student3.id,
      jobId: job2.id,
      status: ApplicationStatus.REJECTED,
      resume: '王五的简历内容...',
    },
  });

  console.log(`✅ 已创建 ${6} 条投递记录`);

  // ============================================
  // 7. 创建收藏记录
  // ============================================
  console.log('⭐ 创建收藏记录...');

  await prisma.bookmark.create({
    data: {
      userId: student.id,
      jobId: job4.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student.id,
      jobId: job5.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student2.id,
      jobId: job1.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student2.id,
      jobId: job3.id,
    },
  });

  console.log(`✅ 已创建 ${4} 条收藏记录`);

  // ============================================
  // 8. 创建风控规则
  // ============================================
  console.log('🛡️  创建风控规则...');

  await prisma.riskRule.create({
    data: {
      ruleType: 'sensitive_word',
      content: '传销|诈骗|非法|虚假|骗局|高薪诱惑|日赚|月入过万',
      action: 'block',
      enabled: true,
    },
  });

  await prisma.riskRule.create({
    data: {
      ruleType: 'sensitive_word',
      content: '刷单|刷信誉|兼职刷单|网络兼职',
      action: 'mark',
      enabled: true,
    },
  });

  await prisma.riskRule.create({
    data: {
      ruleType: 'duplicate_detection',
      content: JSON.stringify({ similarity_threshold: 0.9, min_length: 20 }),
      action: 'mark',
      enabled: true,
    },
  });

  await prisma.riskRule.create({
    data: {
      ruleType: 'content_quality',
      content: JSON.stringify({ min_description_length: 50, min_requirements_length: 30 }),
      action: 'mark',
      enabled: true,
    },
  });

  console.log(`✅ 已创建 ${4} 条风控规则`);

  // ============================================
  // 9. 创建审计日志（示例）
  // ============================================
  console.log('📝 创建审计日志...');

  await prisma.auditLog.create({
    data: {
      userId: employer1.id,
      action: 'JOB_CREATE',
      resourceType: 'job',
      resourceId: job1.id,
      details: { title: job1.title, companyId: company1.id },
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0...',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: schoolAdmin.id,
      action: 'JOB_APPROVE',
      resourceType: 'job',
      resourceId: job1.id,
      details: { status: 'APPROVED', comment: '审核通过' },
      ipAddress: '192.168.1.101',
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: student.id,
      action: 'JOB_APPLY',
      resourceType: 'application',
      resourceId: application1.id,
      details: { jobId: job1.id },
      ipAddress: '192.168.1.102',
    },
  });

  console.log(`✅ 已创建 ${3} 条审计日志`);

  console.log('\n✨ 数据库种子数据初始化完成！');
  console.log('\n📋 测试账号信息：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('学生账号:');
  console.log('  - student@jobverse.test / jobverse123');
  console.log('  - student2@jobverse.test / jobverse123');
  console.log('  - student3@jobverse.test / jobverse123');
  console.log('\n企业账号:');
  console.log('  - employer1@jobverse.test / jobverse123 (XX科技有限公司)');
  console.log('  - employer2@jobverse.test / jobverse123 (YY互联网公司)');
  console.log('\n学校管理员:');
  console.log('  - school@jobverse.test / jobverse123');
  console.log('\n平台管理员:');
  console.log('  - admin@jobverse.test / jobverse123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据初始化失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });