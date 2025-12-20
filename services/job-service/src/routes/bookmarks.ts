import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取我的收藏
 * GET /api/v1/bookmarks
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

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
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
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.bookmark.count({
        where: { userId },
      }),
    ]);

    const items = bookmarks.map((bookmark) => ({
      id: bookmark.id,
      jobId: bookmark.jobId,
      job: {
        id: bookmark.job.id,
        title: bookmark.job.title,
        location: bookmark.job.location,
        salaryMin: bookmark.job.salaryMin,
        salaryMax: bookmark.job.salaryMax,
        tags: bookmark.job.tags,
        company: bookmark.job.company,
      },
      createdAt: bookmark.createdAt,
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
    console.error('获取收藏失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as bookmarkRouter };

