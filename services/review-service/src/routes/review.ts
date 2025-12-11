import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, reviewSchema } from '@jobverse/shared';

const router: Router = Router();

/**
 * 获取待审核岗位列表
 * GET /api/v1/review/pending
 */
router.get('/pending', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    // TODO: 实现实际的待审核列表查询逻辑

    const mockPendingJobs = [
      {
        id: 'job-1',
        title: '前端开发工程师',
        company: { id: 'c1', name: 'XX科技有限公司' },
        status: 'PENDING_REVIEW',
        submittedAt: new Date(),
        createdAt: new Date(),
      },
    ];

    res.json(successResponse({
      items: mockPendingJobs,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));
  } catch (error) {
    console.error('获取待审核列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取岗位审核详情
 * GET /api/v1/review/jobs/:id
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    // TODO: 实现实际的岗位详情查询逻辑

    const mockJob = {
      id,
      title: '前端开发工程师',
      company: { id: 'c1', name: 'XX科技有限公司', verifiedBySchool: false },
      location: '北京',
      salaryMin: 15000,
      salaryMax: 25000,
      description: '职位描述...',
      requirements: '任职要求...',
      tags: ['React', 'TypeScript'],
      status: 'PENDING_REVIEW',
      reviews: [
        {
          id: 'r1',
          status: 'PENDING',
          comment: null,
          reviewedAt: null,
          createdAt: new Date(),
        },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json(successResponse(mockJob));
  } catch (error) {
    console.error('获取岗位详情失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 审核岗位
 * POST /api/v1/review/jobs/:id
 */
router.post('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.headers['x-user-id'];
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const validationResult = reviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const { status, comment } = validationResult.data;

    // TODO: 实现实际的审核逻辑

    const mockReview = {
      id: 'review-id',
      jobId: id,
      reviewerId: userId,
      status,
      comment,
      reviewedAt: new Date(),
      createdAt: new Date(),
    };

    res.json(successResponse(mockReview, '审核完成'));
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 管理企业 Verified 标识
 * PUT /api/v1/review/companies/:id/verify
 */
router.put('/companies/:id/verify', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const { verified } = req.body;

    // TODO: 实现实际的企业认证逻辑

    res.json(successResponse({ companyId: id, verifiedBySchool: verified }, '更新成功'));
  } catch (error) {
    console.error('更新企业认证状态失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as reviewRouter };

