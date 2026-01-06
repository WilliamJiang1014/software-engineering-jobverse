import { PrismaClient, UserRole, JobStatus, ApplicationStatus, ReviewStatus, NotificationType, InterviewMode, InterviewStatus, ApplicationEventType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * 数据库种子数据初始化
 * 运行方式: pnpm db:seed 或 npx ts-node prisma/seed.ts
 */
async function main() {
  console.log('🌱 开始初始化数据库种子数据...');

  // 清空现有数据（按依赖顺序）
  console.log('🗑️  清空现有数据...');
  await prisma.applicationEvent.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.resume.deleteMany();
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

  // 额外创建更多学生用户用于演示
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

  const student4 = await prisma.user.create({
    data: {
      email: 'chenwei@tongji.edu.cn',
      passwordHash,
      role: UserRole.STUDENT,
      name: '陈伟',
      phone: '13912345678',
    },
  });

  const student5 = await prisma.user.create({
    data: {
      email: 'liumei@tongji.edu.cn',
      passwordHash,
      role: UserRole.STUDENT,
      name: '刘美',
      phone: '13923456789',
    },
  });

  const student6 = await prisma.user.create({
    data: {
      email: 'zhanghao@tongji.edu.cn',
      passwordHash,
      role: UserRole.STUDENT,
      name: '张浩',
      phone: '13934567890',
    },
  });

  // 创建更多企业用户
  const employer3 = await prisma.user.create({
    data: {
      email: 'hr@techcorp.com',
      passwordHash,
      role: UserRole.EMPLOYER,
      name: '赵HR',
      phone: '13812345678',
    },
  });

  const employer4 = await prisma.user.create({
    data: {
      email: 'recruit@startup.io',
      passwordHash,
      role: UserRole.EMPLOYER,
      name: '孙招聘',
      phone: '13823456789',
    },
  });

  const employer5 = await prisma.user.create({
    data: {
      email: 'hr@finance.com',
      passwordHash,
      role: UserRole.EMPLOYER,
      name: '周经理',
      phone: '13834567890',
    },
  });

  console.log(`✅ 已创建 ${12} 个用户`);

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

  const company4 = await prisma.company.create({
    data: {
      name: '腾讯科技（深圳）有限公司',
      industry: '互联网/社交',
      scale: '10000人以上',
      location: '深圳',
      description: '中国领先的互联网综合服务提供商，业务涵盖社交、游戏、金融、云服务等多个领域。为应届生提供完善的培养体系和广阔的发展平台。',
      website: 'https://careers.tencent.com',
      contactPerson: '招聘团队',
      contactPhone: '0755-86013388',
      contactEmail: 'campus@tencent.com',
      verifiedBySchool: true,
    },
  });

  const company5 = await prisma.company.create({
    data: {
      name: '阿里巴巴集团',
      industry: '互联网/电商',
      scale: '10000人以上',
      location: '杭州',
      description: '全球领先的数字经济体，业务涵盖电商、云计算、数字媒体、金融科技等。致力于为年轻人提供成长机会和职业发展空间。',
      website: 'https://campus.alibaba.com',
      contactPerson: '校园招聘',
      contactPhone: '0571-85022088',
      contactEmail: 'campus@alibaba-inc.com',
      verifiedBySchool: true,
    },
  });

  const company6 = await prisma.company.create({
    data: {
      name: '字节跳动',
      industry: '互联网/内容',
      scale: '5000-10000人',
      location: '北京',
      description: '全球化的移动互联网平台，旗下产品包括抖音、今日头条等。公司文化开放包容，重视技术创新和人才培养。',
      website: 'https://job.bytedance.com',
      contactPerson: 'HR团队',
      contactPhone: '010-82828888',
      contactEmail: 'campus@bytedance.com',
      verifiedBySchool: true,
    },
  });

  const company7 = await prisma.company.create({
    data: {
      name: '美团',
      industry: '互联网/本地生活',
      scale: '5000-10000人',
      location: '北京',
      description: '中国领先的生活服务电子商务平台，业务覆盖餐饮、外卖、酒店、旅游等多个领域。为应届生提供快速成长的机会。',
      website: 'https://zhaopin.meituan.com',
      contactPerson: '校园招聘',
      contactPhone: '010-52390000',
      contactEmail: 'campus@meituan.com',
      verifiedBySchool: true,
    },
  });

  const company8 = await prisma.company.create({
    data: {
      name: '小米科技',
      industry: '硬件/智能设备',
      scale: '1000-5000人',
      location: '北京',
      description: '以手机、智能硬件和IoT平台为核心的互联网公司。公司注重技术创新，为员工提供良好的工作环境和成长空间。',
      website: 'https://hr.xiaomi.com',
      contactPerson: '招聘团队',
      contactPhone: '010-60606666',
      contactEmail: 'hr@xiaomi.com',
      verifiedBySchool: true,
    },
  });

  const company9 = await prisma.company.create({
    data: {
      name: '滴滴出行',
      industry: '互联网/出行',
      scale: '5000-10000人',
      location: '北京',
      description: '全球领先的一站式多元化出行平台，业务涵盖网约车、出租车、代驾、顺风车等。致力于用科技改变出行。',
      website: 'https://job.didiglobal.com',
      contactPerson: '校园招聘',
      contactPhone: '010-53390000',
      contactEmail: 'campus@didiglobal.com',
      verifiedBySchool: true,
    },
  });

  const company10 = await prisma.company.create({
    data: {
      name: '创新工场',
      industry: '投资/孵化',
      scale: '200-500人',
      location: '北京',
      description: '专注于早期投资和创业孵化的投资机构，已孵化多个知名互联网公司。为有创业梦想的年轻人提供平台。',
      website: 'https://www.chuangxin.com',
      contactPerson: 'HR',
      contactPhone: '010-82828888',
      contactEmail: 'hr@chuangxin.com',
      verifiedBySchool: false,
    },
  });

  console.log(`✅ 已创建 ${10} 个企业`);

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

  await prisma.employerInfo.create({
    data: {
      userId: employer3.id,
      companyId: company4.id,
      position: '招聘经理',
    },
  });

  await prisma.employerInfo.create({
    data: {
      userId: employer4.id,
      companyId: company10.id,
      position: 'HR',
    },
  });

  await prisma.employerInfo.create({
    data: {
      userId: employer5.id,
      companyId: company5.id,
      position: '招聘专员',
    },
  });

  console.log(`✅ 已创建 ${5} 个企业用户关联`);

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

  // 更多真实岗位
  const job9 = await prisma.job.create({
    data: {
      companyId: company4.id,
      title: '前端开发工程师（React方向）',
      location: '深圳',
      salaryMin: 20000,
      salaryMax: 35000,
      description: '负责微信、QQ等社交产品的前端开发工作，参与产品需求讨论和技术方案设计。\n\n工作内容：\n1. 负责Web前端开发，使用React/Vue等现代前端框架\n2. 与产品、设计、后端团队协作，实现高质量的用户体验\n3. 优化前端性能，提升页面加载速度和交互流畅度\n4. 参与前端工程化建设，提升开发效率',
      requirements: '任职要求：\n1. 本科及以上学历，计算机相关专业\n2. 熟练掌握React、Vue等前端框架，有实际项目经验\n3. 熟悉TypeScript、ES6+语法\n4. 了解前端工程化工具（Webpack、Vite等）\n5. 有良好的代码规范和团队协作能力\n6. 有大型项目经验或开源项目贡献者优先',
      tags: ['React', 'TypeScript', '前端开发', 'Web前端'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job10 = await prisma.job.create({
    data: {
      companyId: company4.id,
      title: '后端开发工程师（Go/Python）',
      location: '深圳',
      salaryMin: 22000,
      salaryMax: 40000,
      description: '负责腾讯云、企业微信等产品的后端服务开发，参与系统架构设计和技术攻关。\n\n工作内容：\n1. 负责后端服务的设计与开发，支撑高并发业务场景\n2. 参与系统架构设计，优化系统性能和稳定性\n3. 与前端、算法团队协作，完成产品功能开发\n4. 参与技术选型和新技术调研',
      requirements: '任职要求：\n1. 本科及以上学历，计算机相关专业\n2. 熟悉Go/Python/Java等后端开发语言\n3. 熟悉分布式系统设计，了解微服务架构\n4. 熟悉数据库设计和SQL优化\n5. 有高并发系统开发经验者优先',
      tags: ['Go', 'Python', '后端开发', '分布式系统'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job11 = await prisma.job.create({
    data: {
      companyId: company5.id,
      title: 'Java开发工程师',
      location: '杭州',
      salaryMin: 18000,
      salaryMax: 32000,
      description: '负责阿里巴巴核心业务系统的Java后端开发，参与电商、支付、物流等业务模块建设。',
      requirements: '1. 本科及以上学历，计算机相关专业\n2. 熟练掌握Java开发，熟悉Spring、MyBatis等框架\n3. 熟悉MySQL、Redis等数据库\n4. 了解分布式系统、消息队列等中间件\n5. 有大型互联网公司实习经验者优先',
      tags: ['Java', 'Spring', '后端开发', '分布式'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job12 = await prisma.job.create({
    data: {
      companyId: company5.id,
      title: '算法工程师（推荐系统）',
      location: '杭州',
      salaryMin: 25000,
      salaryMax: 45000,
      description: '负责淘宝、天猫等电商平台的推荐算法研发，优化用户购物体验和平台GMV。',
      requirements: '1. 硕士及以上学历，计算机/数学/统计相关专业\n2. 熟悉机器学习、深度学习算法\n3. 熟悉Python、TensorFlow/PyTorch\n4. 有推荐系统、广告算法经验者优先\n5. 有顶会论文发表者优先',
      tags: ['算法', '机器学习', '推荐系统', 'Python'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job13 = await prisma.job.create({
    data: {
      companyId: company6.id,
      title: '前端开发工程师',
      location: '北京',
      salaryMin: 20000,
      salaryMax: 35000,
      description: '负责抖音、今日头条等产品的前端开发，参与产品迭代和用户体验优化。',
      requirements: '1. 本科及以上学历\n2. 熟悉React、Vue等前端框架\n3. 熟悉TypeScript、ES6+\n4. 有移动端H5开发经验者优先',
      tags: ['React', 'TypeScript', '前端开发'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job14 = await prisma.job.create({
    data: {
      companyId: company6.id,
      title: '产品经理（内容方向）',
      location: '北京',
      salaryMin: 22000,
      salaryMax: 40000,
      description: '负责内容产品的需求分析和产品设计，与开发团队协作推进产品迭代。',
      requirements: '1. 本科及以上学历\n2. 有产品设计或项目管理经验\n3. 熟悉内容类产品\n4. 具备良好的数据分析和用户研究能力',
      tags: ['产品经理', '内容产品', '数据分析'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job15 = await prisma.job.create({
    data: {
      companyId: company7.id,
      title: '数据分析师',
      location: '北京',
      salaryMin: 18000,
      salaryMax: 30000,
      description: '负责美团各业务线的数据分析，为业务决策提供数据支持和策略建议。',
      requirements: '1. 本科及以上学历，统计学/数学/计算机相关专业\n2. 熟悉SQL、Python/R\n3. 有数据分析或商业分析经验\n4. 有互联网行业经验者优先',
      tags: ['数据分析', 'Python', 'SQL', '商业分析'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job16 = await prisma.job.create({
    data: {
      companyId: company8.id,
      title: 'Android开发工程师',
      location: '北京',
      salaryMin: 20000,
      salaryMax: 35000,
      description: '负责MIUI系统和小米应用商店等产品的Android开发。',
      requirements: '1. 本科及以上学历\n2. 熟悉Android开发，熟悉Kotlin/Java\n3. 有Android应用开发经验\n4. 有系统级开发经验者优先',
      tags: ['Android', 'Kotlin', '移动开发'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job17 = await prisma.job.create({
    data: {
      companyId: company9.id,
      title: 'Go开发工程师',
      location: '北京',
      salaryMin: 22000,
      salaryMax: 38000,
      description: '负责滴滴出行平台的后端服务开发，支撑高并发出行业务。',
      requirements: '1. 本科及以上学历\n2. 熟悉Go语言开发\n3. 熟悉分布式系统设计\n4. 有高并发系统开发经验者优先',
      tags: ['Go', '后端开发', '分布式系统'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  const job18 = await prisma.job.create({
    data: {
      companyId: company10.id,
      title: '全栈开发工程师',
      location: '北京',
      salaryMin: 15000,
      salaryMax: 25000,
      description: '负责创业项目的全栈开发，参与产品从0到1的建设过程。',
      requirements: '1. 本科及以上学历\n2. 熟悉前后端开发\n3. 有创业热情，能快速学习\n4. 有全栈项目经验者优先',
      tags: ['全栈开发', 'Node.js', 'React'],
      status: JobStatus.APPROVED,
      expiresAt: futureDate,
    },
  });

  console.log(`✅ 已创建 ${18} 个岗位`);

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

  // 为新岗位创建审核记录
  await prisma.review.create({
    data: {
      jobId: job9.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '岗位信息完整，薪资合理，已通过审核。',
      reviewedAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job10.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job11.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job12.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job13.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job14.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job15.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job16.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job17.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.review.create({
    data: {
      jobId: job18.id,
      reviewerId: schoolAdmin.id,
      status: ReviewStatus.APPROVED,
      comment: '审核通过',
      reviewedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ 已创建 ${17} 条审核记录`);

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
      feedback: '感谢您的投递，经过评估，我们认为您的技能与岗位要求存在一定差距，希望您能找到更合适的机会。',
    },
  });

  // 创建更多投递记录
  const application7 = await prisma.application.create({
    data: {
      userId: student4.id,
      jobId: job9.id,
      status: ApplicationStatus.VIEWED,
      resume: '陈伟的简历：计算机科学与技术专业，有React项目经验...',
      coverLetter: '我对腾讯的前端开发岗位非常感兴趣，希望能加入贵公司。',
      appliedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  const application8 = await prisma.application.create({
    data: {
      userId: student4.id,
      jobId: job13.id,
      status: ApplicationStatus.INTERVIEWING,
      resume: '陈伟的简历：计算机科学与技术专业，有React项目经验...',
      coverLetter: '我对字节跳动的前端岗位很感兴趣。',
      appliedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  const application9 = await prisma.application.create({
    data: {
      userId: student5.id,
      jobId: job11.id,
      status: ApplicationStatus.VIEWED,
      resume: '刘美的简历：软件工程专业，熟悉Java和Spring框架...',
      coverLetter: '希望能在阿里巴巴这样的大平台学习和成长。',
      appliedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const application10 = await prisma.application.create({
    data: {
      userId: student5.id,
      jobId: job15.id,
      status: ApplicationStatus.ACCEPTED,
      resume: '刘美的简历：软件工程专业，有数据分析项目经验...',
      coverLetter: '我对数据分析工作很感兴趣，希望能加入美团。',
      feedback: '恭喜您通过面试！我们很期待您的加入。',
      employerNote: '候选人综合素质优秀，数据分析能力强，已发offer。',
      appliedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
    },
  });

  const application11 = await prisma.application.create({
    data: {
      userId: student6.id,
      jobId: job10.id,
      status: ApplicationStatus.INTERVIEWING,
      resume: '张浩的简历：计算机专业，熟悉Go和Python...',
      coverLetter: '我对后端开发很感兴趣，希望能加入腾讯。',
      appliedAt: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
    },
  });

  const application12 = await prisma.application.create({
    data: {
      userId: student6.id,
      jobId: job17.id,
      status: ApplicationStatus.VIEWED,
      resume: '张浩的简历：计算机专业，熟悉Go语言...',
      appliedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
    },
  });

  const application13 = await prisma.application.create({
    data: {
      userId: student.id,
      jobId: job9.id,
      status: ApplicationStatus.VIEWED,
      resume: '张三的简历内容...',
      appliedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  const application14 = await prisma.application.create({
    data: {
      userId: student2.id,
      jobId: job11.id,
      status: ApplicationStatus.REJECTED,
      resume: '李四的简历内容...',
      feedback: '感谢您的投递，经过评估，我们认为您目前的技术水平与岗位要求还有一定差距，建议您继续提升相关技能。',
      appliedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ 已创建 ${14} 条投递记录`);

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

  await prisma.bookmark.create({
    data: {
      userId: student4.id,
      jobId: job9.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student4.id,
      jobId: job13.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student5.id,
      jobId: job12.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student6.id,
      jobId: job10.id,
    },
  });

  await prisma.bookmark.create({
    data: {
      userId: student6.id,
      jobId: job17.id,
    },
  });

  console.log(`✅ 已创建 ${10} 条收藏记录`);

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

  // ============================================
  // 10. 创建简历
  // ============================================
  console.log('📄 创建简历...');

  await prisma.resume.create({
    data: {
      userId: student.id,
      name: '技术岗简历',
      content: '个人信息：\n姓名：张三\n学历：本科\n专业：计算机科学与技术\n\n项目经验：\n1. 在线购物系统（React + Node.js）\n2. 个人博客系统（Vue + Express）\n\n技能：React, Vue, TypeScript, Node.js',
      isDefault: true,
    },
  });

  await prisma.resume.create({
    data: {
      userId: student2.id,
      name: 'Java开发简历',
      content: '个人信息：\n姓名：李四\n学历：本科\n专业：软件工程\n\n项目经验：\n1. 企业管理系统（Java + Spring Boot）\n2. 电商平台后端（Java + MySQL）\n\n技能：Java, Spring, MySQL, Redis',
      isDefault: true,
    },
  });

  await prisma.resume.create({
    data: {
      userId: student3.id,
      name: '全栈开发简历',
      content: '个人信息：\n姓名：王五\n学历：本科\n专业：计算机科学\n\n项目经验：\n1. 社交平台（React + Node.js + MongoDB）\n2. 在线教育平台（Vue + Python）\n\n技能：React, Node.js, Python, MongoDB',
      isDefault: true,
    },
  });

  await prisma.resume.create({
    data: {
      userId: student4.id,
      name: '前端开发简历',
      content: '个人信息：\n姓名：陈伟\n学历：本科\n专业：计算机科学与技术\n\n项目经验：\n1. 电商平台前端（React + TypeScript）\n2. 数据可视化平台（Vue + ECharts）\n\n技能：React, Vue, TypeScript, Webpack',
      isDefault: true,
    },
  });

  await prisma.resume.create({
    data: {
      userId: student4.id,
      name: '全栈简历',
      content: '个人信息：\n姓名：陈伟\n学历：本科\n专业：计算机科学与技术\n\n项目经验：\n1. 全栈项目（React + Node.js + PostgreSQL）\n2. 微服务项目（Spring Cloud）\n\n技能：React, Node.js, Spring, PostgreSQL',
      isDefault: false,
    },
  });

  await prisma.resume.create({
    data: {
      userId: student5.id,
      name: '数据分析简历',
      content: '个人信息：\n姓名：刘美\n学历：本科\n专业：统计学\n\n项目经验：\n1. 用户行为分析（Python + Pandas）\n2. 销售数据可视化（SQL + Tableau）\n\n技能：Python, SQL, R, 数据分析',
      isDefault: true,
    },
  });

  await prisma.resume.create({
    data: {
      userId: student6.id,
      name: '后端开发简历',
      content: '个人信息：\n姓名：张浩\n学历：本科\n专业：软件工程\n\n项目经验：\n1. 高并发系统（Go + Redis）\n2. 微服务架构（Go + gRPC）\n\n技能：Go, Python, Redis, 分布式系统',
      isDefault: true,
    },
  });

  console.log(`✅ 已创建 ${7} 份简历`);

  // ============================================
  // 11. 创建面试记录
  // ============================================
  console.log('💼 创建面试记录...');

  const interview1 = await prisma.interview.create({
    data: {
      applicationId: application3.id,
      employerId: employer2.id,
      scheduledAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3天后
      mode: InterviewMode.ONLINE,
      locationOrLink: 'https://meeting.zoom.us/j/123456789',
      note: '请提前10分钟进入会议室，准备好项目介绍。',
      status: InterviewStatus.CONFIRMED,
    },
  });

  const interview2 = await prisma.interview.create({
    data: {
      applicationId: application8.id,
      employerId: employer3.id,
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5天后
      mode: InterviewMode.ONLINE,
      locationOrLink: '腾讯会议：123456789',
      note: '技术面试，请准备算法题和项目介绍。',
      status: InterviewStatus.PENDING,
    },
  });

  const interview3 = await prisma.interview.create({
    data: {
      applicationId: application11.id,
      employerId: employer3.id,
      scheduledAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7天后
      mode: InterviewMode.OFFLINE,
      locationOrLink: '深圳市南山区科技园',
      note: '现场面试，请携带简历和作品集。',
      status: InterviewStatus.CONFIRMED,
    },
  });

  const interview4 = await prisma.interview.create({
    data: {
      applicationId: application10.id,
      employerId: employer1.id,
      scheduledAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5天前（已完成）
      mode: InterviewMode.ONLINE,
      locationOrLink: '腾讯会议：987654321',
      note: '已通过面试',
      status: InterviewStatus.CONFIRMED,
    },
  });

  console.log(`✅ 已创建 ${4} 条面试记录`);

  // ============================================
  // 12. 创建通知记录
  // ============================================
  console.log('🔔 创建通知记录...');

  // 学生投递成功的通知
  await prisma.notification.create({
    data: {
      userId: student.id,
      type: NotificationType.APPLY_SUCCESS,
      title: '投递成功',
      content: `您已成功投递岗位"${job1.title}"，请耐心等待企业查看。`,
      resourceType: 'APPLICATION',
      resourceId: application1.id,
      isRead: false,
      createdAt: application1.appliedAt,
    },
  });

  await prisma.notification.create({
    data: {
      userId: student4.id,
      type: NotificationType.APPLY_SUCCESS,
      title: '投递成功',
      content: `您已成功投递岗位"${job9.title}"，请耐心等待企业查看。`,
      resourceType: 'APPLICATION',
      resourceId: application7.id,
      isRead: false,
      createdAt: application7.appliedAt,
    },
  });

  // 企业收到新投递的通知
  await prisma.notification.create({
    data: {
      userId: employer1.id,
      type: NotificationType.NEW_APPLICATION,
      title: '收到新投递',
      content: `收到来自"${student.name}"的投递，岗位：${job1.title}`,
      resourceType: 'APPLICATION',
      resourceId: application1.id,
      isRead: false,
      createdAt: application1.appliedAt,
    },
  });

  await prisma.notification.create({
    data: {
      userId: employer3.id,
      type: NotificationType.NEW_APPLICATION,
      title: '收到新投递',
      content: `收到来自"${student4.name}"的投递，岗位：${job9.title}`,
      resourceType: 'APPLICATION',
      resourceId: application7.id,
      isRead: true,
      readAt: new Date(application7.appliedAt.getTime() + 2 * 60 * 60 * 1000),
      createdAt: application7.appliedAt,
    },
  });

  // 状态更新通知
  await prisma.notification.create({
    data: {
      userId: student.id,
      type: NotificationType.STATUS_UPDATE,
      title: '投递状态更新',
      content: `您的投递"${job2.title}"已被企业查看。`,
      resourceType: 'APPLICATION',
      resourceId: application2.id,
      isRead: false,
      createdAt: new Date(application2.appliedAt.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: student.id,
      type: NotificationType.STATUS_UPDATE,
      title: '投递状态更新',
      content: `您的投递"${job3.title}"已进入面试环节。`,
      resourceType: 'APPLICATION',
      resourceId: application3.id,
      isRead: false,
      createdAt: new Date(application3.appliedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 面试邀请通知
  await prisma.notification.create({
    data: {
      userId: student.id,
      type: NotificationType.INTERVIEW,
      title: '面试邀请',
      content: `企业邀请您参加"${job3.title}"的面试，时间：${interview1.scheduledAt.toLocaleString('zh-CN')}`,
      resourceType: 'INTERVIEW',
      resourceId: interview1.id,
      isRead: false,
      createdAt: interview1.createdAt,
    },
  });

  await prisma.notification.create({
    data: {
      userId: student4.id,
      type: NotificationType.INTERVIEW,
      title: '面试邀请',
      content: `企业邀请您参加"${job13.title}"的面试，请及时确认。`,
      resourceType: 'INTERVIEW',
      resourceId: interview2.id,
      isRead: false,
      createdAt: interview2.createdAt,
    },
  });

  // 审核结果通知
  await prisma.notification.create({
    data: {
      userId: employer1.id,
      type: NotificationType.REVIEW_RESULT,
      title: '审核结果',
      content: `您的岗位"${job1.title}"已通过审核，现已上线。`,
      resourceType: 'REVIEW',
      resourceId: job1.id,
      isRead: false,
      createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.notification.create({
    data: {
      userId: employer1.id,
      type: NotificationType.REVIEW_RESULT,
      title: '审核结果',
      content: `您的岗位"${job6.title}"待审核，请耐心等待。`,
      resourceType: 'REVIEW',
      resourceId: job6.id,
      isRead: true,
      readAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // 录用通知
  await prisma.notification.create({
    data: {
      userId: student5.id,
      type: NotificationType.STATUS_UPDATE,
      title: '恭喜！您已被录用',
      content: `恭喜您！企业已向您发出录用通知，岗位：${job15.title}。`,
      resourceType: 'APPLICATION',
      resourceId: application10.id,
      isRead: false,
      createdAt: new Date(application10.appliedAt.getTime() + 8 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ 已创建 ${12} 条通知记录`);

  // ============================================
  // 13. 创建投递事件时间线
  // ============================================
  console.log('📅 创建投递事件时间线...');

  // application1 的时间线
  await prisma.applicationEvent.create({
    data: {
      applicationId: application1.id,
      type: ApplicationEventType.APPLIED,
      actorRole: UserRole.STUDENT,
      actorId: student.id,
      metadata: { status: 'APPLIED' },
      createdAt: application1.appliedAt,
    },
  });

  // application2 的时间线
  await prisma.applicationEvent.create({
    data: {
      applicationId: application2.id,
      type: ApplicationEventType.APPLIED,
      actorRole: UserRole.STUDENT,
      actorId: student.id,
      metadata: { status: 'APPLIED' },
      createdAt: application2.appliedAt,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application2.id,
      type: ApplicationEventType.VIEWED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer1.id,
      metadata: { fromStatus: 'APPLIED', toStatus: 'VIEWED' },
      createdAt: new Date(application2.appliedAt.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  // application3 的时间线
  await prisma.applicationEvent.create({
    data: {
      applicationId: application3.id,
      type: ApplicationEventType.APPLIED,
      actorRole: UserRole.STUDENT,
      actorId: student.id,
      metadata: { status: 'APPLIED' },
      createdAt: application3.appliedAt,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application3.id,
      type: ApplicationEventType.STATUS_CHANGED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer2.id,
      metadata: { fromStatus: 'VIEWED', toStatus: 'INTERVIEWING' },
      createdAt: new Date(application3.appliedAt.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application3.id,
      type: ApplicationEventType.INTERVIEW_CREATED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer2.id,
      metadata: { interviewId: interview1.id, scheduledAt: interview1.scheduledAt },
      createdAt: interview1.createdAt,
    },
  });

  // application5 的时间线（已录用）
  await prisma.applicationEvent.create({
    data: {
      applicationId: application5.id,
      type: ApplicationEventType.APPLIED,
      actorRole: UserRole.STUDENT,
      actorId: student2.id,
      metadata: { status: 'APPLIED' },
      createdAt: application5.appliedAt,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application5.id,
      type: ApplicationEventType.STATUS_CHANGED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer2.id,
      metadata: { fromStatus: 'INTERVIEWING', toStatus: 'ACCEPTED' },
      createdAt: new Date(application5.appliedAt.getTime() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // application6 的时间线（已拒绝）
  await prisma.applicationEvent.create({
    data: {
      applicationId: application6.id,
      type: ApplicationEventType.APPLIED,
      actorRole: UserRole.STUDENT,
      actorId: student3.id,
      metadata: { status: 'APPLIED' },
      createdAt: application6.appliedAt,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application6.id,
      type: ApplicationEventType.STATUS_CHANGED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer1.id,
      metadata: { fromStatus: 'VIEWED', toStatus: 'REJECTED' },
      createdAt: new Date(application6.appliedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  // application10 的时间线（已录用）
  await prisma.applicationEvent.create({
    data: {
      applicationId: application10.id,
      type: ApplicationEventType.APPLIED,
      actorRole: UserRole.STUDENT,
      actorId: student5.id,
      metadata: { status: 'APPLIED' },
      createdAt: application10.appliedAt,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application10.id,
      type: ApplicationEventType.VIEWED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer1.id,
      metadata: { fromStatus: 'APPLIED', toStatus: 'VIEWED' },
      createdAt: new Date(application10.appliedAt.getTime() + 1 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application10.id,
      type: ApplicationEventType.STATUS_CHANGED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer1.id,
      metadata: { fromStatus: 'VIEWED', toStatus: 'INTERVIEWING' },
      createdAt: new Date(application10.appliedAt.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application10.id,
      type: ApplicationEventType.INTERVIEW_CREATED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer1.id,
      metadata: { interviewId: interview4.id },
      createdAt: interview4.createdAt,
    },
  });

  await prisma.applicationEvent.create({
    data: {
      applicationId: application10.id,
      type: ApplicationEventType.STATUS_CHANGED,
      actorRole: UserRole.EMPLOYER,
      actorId: employer1.id,
      metadata: { fromStatus: 'INTERVIEWING', toStatus: 'ACCEPTED' },
      createdAt: new Date(application10.appliedAt.getTime() + 8 * 24 * 60 * 60 * 1000),
    },
  });

  console.log(`✅ 已创建 ${15} 条投递事件记录`);

  console.log('\n✨ 数据库种子数据初始化完成！');
  console.log('\n📋 测试账号信息：');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('学生账号（密码：jobverse123）:');
  console.log('  - student@jobverse.test (张三)');
  console.log('  - student2@jobverse.test (李四)');
  console.log('  - student3@jobverse.test (王五)');
  console.log('  - chenwei@tongji.edu.cn (陈伟)');
  console.log('  - liumei@tongji.edu.cn (刘美)');
  console.log('  - zhanghao@tongji.edu.cn (张浩)');
  console.log('\n企业账号（密码：jobverse123）:');
  console.log('  - employer1@jobverse.test (XX科技有限公司 - 李经理)');
  console.log('  - employer2@jobverse.test (YY互联网公司 - 王总)');
  console.log('  - hr@techcorp.com (腾讯科技 - 赵HR)');
  console.log('  - recruit@startup.io (创新工场 - 孙招聘)');
  console.log('  - hr@finance.com (阿里巴巴 - 周经理)');
  console.log('\n学校管理员:');
  console.log('  - school@jobverse.test / jobverse123 (就业中心-张老师)');
  console.log('\n平台管理员:');
  console.log('  - admin@jobverse.test / jobverse123 (平台管理员)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📊 数据统计：');
  console.log(`  - 用户：12个（6个学生，5个企业，1个学校管理员，1个平台管理员）`);
  console.log(`  - 企业：10个（包含腾讯、阿里巴巴、字节跳动、美团等知名企业）`);
  console.log(`  - 岗位：18个（涵盖前端、后端、算法、产品、数据分析等多个方向）`);
  console.log(`  - 投递记录：14条（包含不同状态：已投递、已查看、面试中、已录用、已拒绝）`);
  console.log(`  - 面试记录：4条（包含线上和线下面试，不同状态）`);
  console.log(`  - 通知记录：12条（投递成功、新投递、状态更新、面试邀请、审核结果等）`);
  console.log(`  - 简历：7份（每个学生至少1份简历）`);
  console.log(`  - 收藏记录：10条`);
  console.log(`  - 审核记录：17条`);
  console.log(`  - 投递事件时间线：15条`);
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

