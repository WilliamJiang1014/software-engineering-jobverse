import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses } from '@jobverse/shared';

const router: Router = Router();

/**
 * 获取我的投递记录
 * GET /api/v1/applications
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // TODO: 实现实际的投递记录查询逻辑

    const mockApplications = [
      {
        id: 'app-1',
        jobId: 'job-1',
        job: {
          id: 'job-1',
          title: '前端开发工程师',
          company: { id: 'c1', name: 'XX科技有限公司' },
        },
        status: 'APPLIED',
        appliedAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    res.json(successResponse({
      items: mockApplications,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));
  } catch (error) {
    console.error('获取投递记录失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取我的收藏
 * GET /api/v1/applications/bookmarks
 */
router.get('/bookmarks', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'];

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // TODO: 实现实际的收藏查询逻辑

    const mockBookmarks = [
      {
        id: 'bm-1',
        jobId: 'job-1',
        job: {
          id: 'job-1',
          title: '前端开发工程师',
          company: { id: 'c1', name: 'XX科技有限公司' },
          location: '北京',
          salaryMin: 15000,
          salaryMax: 25000,
        },
        createdAt: new Date(),
      },
    ];

    res.json(successResponse({
      items: mockBookmarks,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));
  } catch (error) {
    console.error('获取收藏失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as applicationRouter };

