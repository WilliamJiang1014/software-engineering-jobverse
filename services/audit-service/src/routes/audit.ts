import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取审计日志列表
 * GET /api/v1/audit/logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;
    const { action, resourceType, userId, startDate, endDate } = req.query;

    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;

    // 按时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        // 格式：YYYY-MM-DD
        const [year, month, day] = (startDate as string).split('-').map(Number);
        const startDateTime = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.createdAt.gte = startDateTime;
      }
      if (endDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        const [year, month, day] = (endDate as string).split('-').map(Number);
        const endDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // 获取用户信息
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];
    const users = userIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: userIds as string[] } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    const items = logs.map((log) => ({
      id: log.id,
      userId: log.userId,
      user: log.userId ? userMap.get(log.userId) || null : null,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));

    res.json(successResponse({
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('获取审计日志失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 导出审计日志为 CSV
 * GET /api/v1/audit/logs/export
 * 注意：必须在 /logs/:id 之前定义，避免路由冲突
 */
router.get('/logs/export', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const { action, resourceType, userId, startDate, endDate } = req.query;

    // 构建查询条件
    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;

    // 按时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        // 格式：YYYY-MM-DD
        const [year, month, day] = (startDate as string).split('-').map(Number);
        const startDateTime = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.createdAt.gte = startDateTime;
      }
      if (endDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        const [year, month, day] = (endDate as string).split('-').map(Number);
        const endDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // 获取所有符合条件的日志（不分页）
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 获取用户信息
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];
    const users = userIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: userIds as string[] } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    // 生成 CSV 内容
    const csvHeaders = ['操作时间', '操作类型', '资源类型', '资源ID', '操作人', 'IP地址', '详细信息'];
    const csvRows = logs.map((log) => {
      const user = log.userId ? userMap.get(log.userId) : null;
      const row = [
        log.createdAt.toISOString(),
        log.action,
        log.resourceType,
        log.resourceId || '',
        user ? (user.name || user.email) : '系统',
        log.ipAddress || '',
        log.details ? JSON.stringify(log.details) : '',
      ];
      // CSV 转义：如果字段包含逗号、引号或换行符，需要用引号包裹，并转义引号
      return row.map((field) => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    // 添加 BOM 以支持 Excel 正确显示中文
    res.write('\ufeff');
    res.end(csvContent);
  } catch (error) {
    console.error('导出审计日志失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取单条审计日志详情
 * GET /api/v1/audit/logs/:id
 */
router.get('/logs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const log = await prisma.auditLog.findUnique({
      where: { id },
    });

    let user = null;
    if (log?.userId) {
      user = await prisma.user.findUnique({
        where: { id: log.userId },
        select: { id: true, name: true, email: true },
      });
    }

    if (!log) {
      return res.status(404).json(ErrorResponses.notFound('日志不存在'));
    }

    res.json(successResponse({
      id: log.id,
      userId: log.userId,
      user: user,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.createdAt,
    }));
  } catch (error) {
    console.error('获取日志详情失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 记录审计日志（内部接口，供其他服务调用）
 * POST /api/v1/audit/logs
 */
router.post('/logs', async (req: Request, res: Response) => {
  try {
    const { userId, action, resourceType, resourceId, details } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.headers['x-real-ip'];
    const userAgent = req.headers['user-agent'];

    if (!action || !resourceType) {
      return res.status(400).json(ErrorResponses.badRequest('action 和 resourceType 不能为空'));
    }

    const log = await prisma.auditLog.create({
      data: {
        userId,
        action,
        resourceType,
        resourceId,
        details: details ? JSON.parse(JSON.stringify(details)) : null,
        ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
        userAgent: userAgent as string,
      },
    });

    res.status(201).json(successResponse({
      id: log.id,
      userId: log.userId,
      action: log.action,
      resourceType: log.resourceType,
      resourceId: log.resourceId,
      details: log.details,
      createdAt: log.createdAt,
    }, '记录成功'));
  } catch (error) {
    console.error('记录审计日志失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取统计数据
 * GET /api/v1/audit/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // 岗位统计
    // 总岗位数：统计所有状态的岗位（用于百分比计算）
    // 已审核通过的岗位数：用于显示学生可见的岗位数
    const [totalJobs, pendingJobs, approvedJobs, rejectedJobs] = await Promise.all([
      prisma.job.count(), // 统计所有状态的岗位（用于百分比计算）
      prisma.job.count({ where: { status: 'PENDING_REVIEW' } }),
      prisma.job.count({ where: { status: 'APPROVED' } }),
      prisma.job.count({ where: { status: 'REJECTED' } }),
    ]);

    // 用户统计
    const totalUsers = await prisma.user.count();

    // 企业统计
    const verifiedCompanies = await prisma.company.count({
      where: { verifiedBySchool: true },
    });

    // 投递统计
    const [totalApplications, todayApplications] = await Promise.all([
      prisma.application.count(),
      prisma.application.count({
        where: {
          appliedAt: {
            gte: todayStart,
          },
        },
      }),
    ]);

    // 本周统计
    const [weeklyJobs, weeklyApplications, weeklyUsers] = await Promise.all([
      prisma.job.count({
        where: {
          createdAt: {
            gte: weekStart,
          },
        },
      }),
      prisma.application.count({
        where: {
          appliedAt: {
            gte: weekStart,
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: weekStart,
          },
        },
      }),
    ]);

    // 平均审核时长（计算最近30天已审核岗位的平均审核时长）
    // 审核时长 = 审核完成时间 - 岗位状态变为PENDING_REVIEW的时间
    // 由于审核记录是在审核时才创建的，我们需要使用岗位的updatedAt作为审核开始时间的近似值
    // 或者查找岗位状态变为PENDING_REVIEW的审计日志
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const reviews = await prisma.review.findMany({
      where: {
        reviewedAt: {
          not: null,
          gte: thirtyDaysAgo,
        },
        status: {
          in: ['APPROVED', 'REJECTED'],
        },
      },
      include: {
        job: {
          select: {
            id: true,
            status: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
    });

    let avgReviewTime = 0;
    if (reviews.length > 0) {
      // 查找每个岗位状态变为PENDING_REVIEW的时间
      // 由于没有单独记录，我们使用岗位的updatedAt作为近似值
      // 但更准确的方法是查找审计日志中岗位状态变为PENDING_REVIEW的记录
      const validReviews = reviews.filter(review => {
        // 确保reviewedAt存在
        return review.reviewedAt !== null;
      });

      if (validReviews.length > 0) {
        const totalHours = validReviews.reduce((sum, review) => {
          if (review.reviewedAt) {
            // 使用岗位的updatedAt作为审核开始时间的近似值
            // 当岗位状态变为PENDING_REVIEW时，updatedAt会被更新
            // 如果岗位的updatedAt晚于reviewedAt，说明可能有问题，使用createdAt作为fallback
            const reviewStartTime = review.job.updatedAt < review.reviewedAt 
              ? review.job.updatedAt 
              : review.job.createdAt;
            
            const hours = (review.reviewedAt.getTime() - reviewStartTime.getTime()) / (1000 * 60 * 60);
            // 确保审核时长在合理范围内（0-720小时，即0-30天）
            if (hours >= 0 && hours <= 720) {
              return sum + hours;
            }
          }
          return sum;
        }, 0);
        
        if (totalHours > 0) {
          avgReviewTime = totalHours / validReviews.length;
        }
      }
    }

    res.json(successResponse({
      totalJobs,
      pendingJobs,
      approvedJobs,
      rejectedJobs,
      totalUsers,
      totalApplications,
      todayApplications,
      weeklyJobs,
      weeklyApplications,
      weeklyUsers,
      avgReviewTime: Math.round(avgReviewTime * 10) / 10, // 保留一位小数
      verifiedCompanies,
    }));
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取热门企业TOP5（按投递数）
 * GET /api/v1/audit/stats/top-companies
 */
router.get('/stats/top-companies', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    // 查询每个企业的岗位数和总投递数
    const topCompanies = await prisma.$queryRaw<Array<{
      companyId: string;
      companyName: string;
      jobsCount: bigint;
      applicationsCount: bigint;
    }>>`
      SELECT 
        c.id as "companyId",
        c.name as "companyName",
        COUNT(DISTINCT j.id)::bigint as "jobsCount",
        COUNT(a.id)::bigint as "applicationsCount"
      FROM companies c
      LEFT JOIN jobs j ON j.company_id = c.id AND j.status = 'APPROVED'
      LEFT JOIN applications a ON a.job_id = j.id
      GROUP BY c.id, c.name
      HAVING COUNT(a.id) > 0
      ORDER BY "applicationsCount" DESC
      LIMIT 5
    `;

    const result = topCompanies.map((item, index) => ({
      rank: index + 1,
      name: item.companyName,
      jobs: Number(item.jobsCount),
      applications: Number(item.applicationsCount),
    }));

    res.json(successResponse(result));
  } catch (error) {
    console.error('获取热门企业失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取热门岗位TOP5（按投递数）
 * GET /api/v1/audit/stats/top-jobs
 */
router.get('/stats/top-jobs', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    // 查询投递数最多的岗位
    const topJobs = await prisma.job.findMany({
      where: {
        status: 'APPROVED',
      },
      include: {
        company: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        applications: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const result = topJobs.map((job, index) => ({
      rank: index + 1,
      title: job.title,
      company: job.company.name,
      applications: job._count.applications,
    }));

    res.json(successResponse(result));
  } catch (error) {
    console.error('获取热门岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取每日数据趋势（近7天）
 * GET /api/v1/audit/stats/daily-trends
 */
router.get('/stats/daily-trends', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // 生成最近7天的日期数组
    const dates: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      date.setHours(0, 0, 0, 0);
      dates.push(date);
    }

    // 查询每日数据
    const dailyStats = await Promise.all(
      dates.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(date.getDate() + 1);

        const [jobs, applications, users] = await Promise.all([
          prisma.job.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay,
              },
            },
          }),
          prisma.application.count({
            where: {
              appliedAt: {
                gte: date,
                lt: nextDay,
              },
            },
          }),
          prisma.user.count({
            where: {
              createdAt: {
                gte: date,
                lt: nextDay,
              },
            },
          }),
        ]);

        return {
          date: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          jobs,
          applications,
          users,
        };
      })
    );

    res.json(successResponse(dailyStats));
  } catch (error) {
    console.error('获取每日数据趋势失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 导出审计日志为 CSV
 * GET /api/v1/audit/logs/export
 */
router.get('/logs/export', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const { action, resourceType, userId, startDate, endDate } = req.query;

    // 构建查询条件
    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;

    // 按时间范围筛选
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        // 格式：YYYY-MM-DD
        const [year, month, day] = (startDate as string).split('-').map(Number);
        const startDateTime = new Date(year, month - 1, day, 0, 0, 0, 0);
        where.createdAt.gte = startDateTime;
      }
      if (endDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        const [year, month, day] = (endDate as string).split('-').map(Number);
        const endDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);
        where.createdAt.lte = endDateTime;
      }
    }

    // 获取所有符合条件的日志（不分页）
    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 获取用户信息
    const userIds = [...new Set(logs.map(log => log.userId).filter(Boolean))];
    const users = userIds.length > 0 
      ? await prisma.user.findMany({
          where: { id: { in: userIds as string[] } },
          select: { id: true, name: true, email: true },
        })
      : [];
    const userMap = new Map(users.map(u => [u.id, u]));

    // 生成 CSV 内容
    const csvHeaders = ['操作时间', '操作类型', '资源类型', '资源ID', '操作人', 'IP地址', '详细信息'];
    const csvRows = logs.map((log) => {
      const user = log.userId ? userMap.get(log.userId) : null;
      const row = [
        log.createdAt.toISOString(),
        log.action,
        log.resourceType,
        log.resourceId || '',
        user ? (user.name || user.email) : '系统',
        log.ipAddress || '',
        log.details ? JSON.stringify(log.details) : '',
      ];
      // CSV 转义：如果字段包含逗号、引号或换行符，需要用引号包裹，并转义引号
      return row.map((field) => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      }).join(',');
    });

    const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');

    // 设置响应头
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.csv"`);

    // 添加 BOM 以支持 Excel 正确显示中文
    res.write('\ufeff');
    res.end(csvContent);
  } catch (error) {
    console.error('导出审计日志失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as auditRouter };

