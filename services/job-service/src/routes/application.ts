import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取我的投递记录
 * GET /api/v1/applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
        where: { userId },
        include: {
          job: {
            include: {
              company: {
                select: {
                  id: true,
                  name: true,
                  verifiedBySchool: true,
                },
              },
            },
          },
        },
        orderBy: {
          appliedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.application.count({
        where: { userId },
      }),
    ]);

    const items = applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      job: {
        id: app.job.id,
        title: app.job.title,
        location: app.job.location,
        salaryMin: app.job.salaryMin,
        salaryMax: app.job.salaryMax,
        company: app.job.company,
      },
      status: app.status,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
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
    console.error('获取投递记录失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取学生个人统计数据
 * GET /api/v1/applications/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const [totalApplications, pendingApplications, acceptedApplications, totalBookmarks] = await Promise.all([
      prisma.application.count({ where: { userId } }),
      prisma.application.count({ where: { userId, status: 'APPLIED' } }),
      prisma.application.count({ where: { userId, status: 'ACCEPTED' } }),
      prisma.bookmark.count({ where: { userId } }),
    ]);

    // 获取最近5条投递记录
    const recentApplications = await prisma.application.findMany({
      where: { userId },
      include: {
        job: {
          include: {
            company: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
      take: 5,
    });

    const recentApplicationsData = recentApplications.map((app) => ({
      id: app.id,
      jobTitle: app.job.title,
      company: app.job.company.name,
      status: app.status,
      date: app.appliedAt.toISOString().split('T')[0],
    }));

    res.json(successResponse({
      totalApplications,
      pendingApplications,
      acceptedApplications,
      totalBookmarks,
      recentApplications: recentApplicationsData,
    }));
  } catch (error) {
    console.error('获取学生统计数据失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as applicationRouter };
