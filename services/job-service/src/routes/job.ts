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

    res.json(
      successResponse({
        items: jobs,
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

    res.json(successResponse(job));
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
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // TODO: 实现实际的收藏逻辑

    res.status(201).json(successResponse({ jobId: id }, '收藏成功'));
  } catch (error) {
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
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // TODO: 实现实际的取消收藏逻辑

    res.json(successResponse(null, '取消收藏成功'));
  } catch (error) {
    console.error('取消收藏失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as jobRouter };

