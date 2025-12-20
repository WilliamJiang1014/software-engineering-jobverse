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
    const { action, resourceType, userId } = req.query;

    const where: any = {};
    if (action) where.action = action;
    if (resourceType) where.resourceType = resourceType;
    if (userId) where.userId = userId;

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
    const [totalJobs, pendingJobs, approvedJobs, rejectedJobs] = await Promise.all([
      prisma.job.count(),
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
        job: true,
      },
    });

    let avgReviewTime = 0;
    if (reviews.length > 0) {
      const totalHours = reviews.reduce((sum, review) => {
        if (review.reviewedAt && review.job.createdAt) {
          const hours = (review.reviewedAt.getTime() - review.job.createdAt.getTime()) / (1000 * 60 * 60);
          return sum + hours;
        }
        return sum;
      }, 0);
      avgReviewTime = totalHours / reviews.length;
    }

    // 每日数据趋势（最近7天）
    const dailyStats = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayStart.getDate() + 1);

      const [dayJobs, dayApplications, dayUsers] = await Promise.all([
        prisma.job.count({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        }),
        prisma.application.count({
          where: {
            appliedAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        }),
        prisma.user.count({
          where: {
            createdAt: {
              gte: dayStart,
              lt: dayEnd,
            },
          },
        }),
      ]);

      dailyStats.push({
        date: `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
        jobs: dayJobs,
        applications: dayApplications,
        users: dayUsers,
      });
    }

    // 热门企业 TOP5（按岗位数和投递数）
    const topCompaniesData = await prisma.company.findMany({
      include: {
        _count: {
          select: {
            jobs: true,
          },
        },
        jobs: {
          include: {
            _count: {
              select: {
                applications: true,
              },
            },
          },
        },
      },
      orderBy: {
        jobs: {
          _count: 'desc',
        },
      },
      take: 5,
    });

    const topCompanies = topCompaniesData.map((company, index) => {
      const totalApplications = company.jobs.reduce(
        (sum, job) => sum + job._count.applications,
        0
      );
      return {
        rank: index + 1,
        name: company.name,
        jobs: company._count.jobs,
        applications: totalApplications,
      };
    });

    // 热门岗位 TOP5（按投递数）
    const topJobsData = await prisma.job.findMany({
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

    const topJobs = topJobsData.map((job, index) => ({
      rank: index + 1,
      title: job.title,
      company: job.company.name,
      applications: job._count.applications,
    }));

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
      dailyStats,
      topCompanies,
      topJobs,
    }));
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as auditRouter };

