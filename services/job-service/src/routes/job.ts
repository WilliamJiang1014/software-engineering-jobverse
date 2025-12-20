import { Router, Request, Response } from 'express';
import { JobStatus, Prisma } from '@prisma/client';
import { successResponse, ErrorResponses, jobSearchSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取岗位列表/搜索岗位
 * GET /api/v1/jobs
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const validationResult = jobSearchSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const { keyword, location, salaryMin, salaryMax, tags, companyId, page, limit } =
      validationResult.data;

    const where: Prisma.JobWhereInput = {
      status: JobStatus.APPROVED,
    };

    const andFilters: Prisma.JobWhereInput[] = [];

    if (keyword) {
      andFilters.push({
        OR: [
          { title: { contains: keyword, mode: 'insensitive' } },
          { description: { contains: keyword, mode: 'insensitive' } },
          { requirements: { contains: keyword, mode: 'insensitive' } },
        ],
      });
    }

    if (location) {
      andFilters.push({ location: { contains: location, mode: 'insensitive' } });
    }

    if (salaryMin) {
      andFilters.push({
        OR: [
          { salaryMax: { gte: salaryMin } },
          { salaryMax: null },
        ],
      });
    }

    if (salaryMax) {
      andFilters.push({
        OR: [
          { salaryMin: { lte: salaryMax } },
          { salaryMin: null },
        ],
      });
    }

    if (tags && tags.length > 0) {
      andFilters.push({ tags: { hasSome: tags } });
    }

    if (companyId) {
      andFilters.push({ companyId });
    }

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const skip = (page - 1) * limit;
    const userId = req.headers['x-user-id'] as string | undefined;

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where,
        include: {
          company: {
            select: {
              id: true,
              name: true,
              verifiedBySchool: true,
              industry: true,
              scale: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    // 如果用户已登录，检查每个岗位是否已收藏和已投递
    let jobsWithBookmark = jobs;
    if (userId) {
      const jobIds = jobs.map(job => job.id);
      const [bookmarks, applications] = await Promise.all([
        prisma.bookmark.findMany({
          where: {
            userId,
            jobId: { in: jobIds },
          },
          select: { jobId: true },
        }),
        prisma.application.findMany({
          where: {
            userId,
            jobId: { in: jobIds },
          },
          select: { jobId: true },
        }),
      ]);
      const bookmarkedJobIds = new Set(bookmarks.map(b => b.jobId));
      const appliedJobIds = new Set(applications.map(a => a.jobId));
      
      jobsWithBookmark = jobs.map(job => ({
        ...job,
        isBookmarked: bookmarkedJobIds.has(job.id),
        isApplied: appliedJobIds.has(job.id),
      }));
    } else {
      jobsWithBookmark = jobs.map(job => ({
        ...job,
        isBookmarked: false,
        isApplied: false,
      }));
    }

    res.json(
      successResponse({
        items: jobsWithBookmark,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('获取岗位列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取岗位详情
 * GET /api/v1/jobs/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string | undefined;
    
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            industry: true,
            scale: true,
            verifiedBySchool: true,
            location: true,
          },
        },
      },
    });

    if (!job || job.status !== JobStatus.APPROVED) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在或未上线'));
    }

    // 检查用户是否已收藏该岗位和已投递
    let isBookmarked = false;
    let isApplied = false;
    if (userId) {
      const [bookmark, application] = await Promise.all([
        prisma.bookmark.findUnique({
          where: {
            userId_jobId: {
              userId,
              jobId: id,
            },
          },
        }),
        prisma.application.findUnique({
          where: {
            userId_jobId: {
              userId,
              jobId: id,
            },
          },
        }),
      ]);
      isBookmarked = !!bookmark;
      isApplied = !!application;
    }

    res.json(successResponse({
      ...job,
      isBookmarked,
      isApplied,
    }));
  } catch (error) {
    console.error('获取岗位详情失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 投递岗位
 * POST /api/v1/jobs/:id/apply
 */
router.post('/:id/apply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 1. 检查岗位是否存在且已发布
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job || job.status !== JobStatus.APPROVED) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在或不可投递'));
    }

    // 2. 检查是否已投递
    const existingApplication = await prisma.application.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: id,
        },
      },
    });

    if (existingApplication) {
      return res.status(400).json(ErrorResponses.badRequest('您已投递过该岗位'));
    }

    // 3. 创建投递记录
    const { resume, coverLetter } = req.body;
    const application = await prisma.application.create({
      data: {
        userId,
        jobId: id,
        resume,
        coverLetter,
      },
    });

    res.status(201).json(successResponse(application, '投递成功'));
  } catch (error) {
    console.error('投递失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 收藏岗位
 * POST /api/v1/jobs/:id/bookmark
 */
router.post('/:id/bookmark', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 检查岗位是否存在
    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job || job.status !== JobStatus.APPROVED) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在或不可收藏'));
    }

    // 检查是否已收藏
    const existingBookmark = await prisma.bookmark.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: id,
        },
      },
    });

    if (existingBookmark) {
      return res.status(400).json(ErrorResponses.badRequest('您已收藏过该岗位'));
    }

    // 创建收藏记录
    const bookmark = await prisma.bookmark.create({
      data: {
        userId,
        jobId: id,
      },
    });

    res.status(201).json(successResponse({
      id: bookmark.id,
      jobId: id,
      createdAt: bookmark.createdAt,
    }, '收藏成功'));
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json(ErrorResponses.badRequest('您已收藏过该岗位'));
    }
    console.error('收藏失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 取消收藏
 * DELETE /api/v1/jobs/:id/bookmark
 */
router.delete('/:id/bookmark', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const bookmark = await prisma.bookmark.findUnique({
      where: {
        userId_jobId: {
          userId,
          jobId: id,
        },
      },
    });

    if (!bookmark) {
      return res.status(404).json(ErrorResponses.notFound('收藏记录不存在'));
    }

    await prisma.bookmark.delete({
      where: {
        userId_jobId: {
          userId,
          jobId: id,
        },
      },
    });

    res.json(successResponse(null, '取消收藏成功'));
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as jobRouter };

