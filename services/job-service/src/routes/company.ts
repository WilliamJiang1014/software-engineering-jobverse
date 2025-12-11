import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses } from '@jobverse/shared';

const router: Router = Router();

/**
 * 获取企业列表
 * GET /api/v1/companies
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    // TODO: 实现实际的企业列表查询逻辑

    const mockCompanies = [
      {
        id: 'c1',
        name: 'XX科技有限公司',
        industry: '互联网/IT',
        scale: '201-500人',
        location: '北京',
        verifiedBySchool: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    res.json(successResponse({
      items: mockCompanies,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));
  } catch (error) {
    console.error('获取企业列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取企业详情
 * GET /api/v1/companies/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: 实现实际的企业查询逻辑

    const mockCompany = {
      id,
      name: 'XX科技有限公司',
      industry: '互联网/IT',
      scale: '201-500人',
      location: '北京',
      description: '一家专注于互联网技术的科技公司...',
      website: 'https://example.com',
      verifiedBySchool: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    res.json(successResponse(mockCompany));
  } catch (error) {
    console.error('获取企业详情失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取企业发布的岗位
 * GET /api/v1/companies/:id/jobs
 */
router.get('/:id/jobs', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // TODO: 实现实际的岗位查询逻辑

    const mockJobs = [
      {
        id: '1',
        companyId: id,
        title: '前端开发工程师',
        location: '北京',
        salaryMin: 15000,
        salaryMax: 25000,
        status: 'APPROVED',
        createdAt: new Date(),
      },
    ];

    res.json(successResponse({
      items: mockJobs,
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    }));
  } catch (error) {
    console.error('获取企业岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as companyRouter };

