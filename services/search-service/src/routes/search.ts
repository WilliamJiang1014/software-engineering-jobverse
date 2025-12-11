import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, jobSearchSchema } from '@jobverse/shared';

const router: Router = Router();

/**
 * 搜索岗位
 * GET /api/v1/search/jobs
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const validationResult = jobSearchSchema.safeParse(req.query);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const { keyword, location, salaryMin, salaryMax, page, limit } = validationResult.data;

    // TODO: 实现实际的全文搜索逻辑（PostgreSQL全文搜索）

    // 模拟搜索结果
    const mockResults = [
      {
        id: '1',
        title: '前端开发工程师',
        company: { id: 'c1', name: 'XX科技有限公司', verifiedBySchool: true },
        location: '北京',
        salaryMin: 15000,
        salaryMax: 25000,
        tags: ['React', 'TypeScript'],
        status: 'APPROVED',
        createdAt: new Date(),
        _score: 0.95, // 搜索相关度分数
      },
    ];

    res.json(successResponse({
      items: mockResults,
      pagination: { page, limit, total: 1, totalPages: 1 },
      query: { keyword, location, salaryMin, salaryMax },
    }));
  } catch (error) {
    console.error('搜索失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 搜索建议/自动补全
 * GET /api/v1/search/suggest
 */
router.get('/suggest', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json(ErrorResponses.badRequest('搜索关键词不能为空'));
    }

    // TODO: 实现实际的搜索建议逻辑

    // 模拟搜索建议
    const mockSuggestions = [
      '前端开发工程师',
      '前端实习生',
      '高级前端工程师',
    ];

    res.json(successResponse(mockSuggestions));
  } catch (error) {
    console.error('获取搜索建议失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 热门搜索
 * GET /api/v1/search/hot
 */
router.get('/hot', async (_req: Request, res: Response) => {
  try {
    // TODO: 实现实际的热门搜索逻辑（从Redis获取）

    // 模拟热门搜索
    const mockHotSearches = [
      { keyword: '前端开发', count: 1000 },
      { keyword: 'Java开发', count: 800 },
      { keyword: '产品经理', count: 600 },
      { keyword: '数据分析', count: 500 },
      { keyword: 'UI设计', count: 400 },
    ];

    res.json(successResponse(mockHotSearches));
  } catch (error) {
    console.error('获取热门搜索失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as searchRouter };

