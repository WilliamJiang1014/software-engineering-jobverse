import { Router, Request, Response } from 'express';
import { JobStatus, Prisma } from '@prisma/client';
import { successResponse, ErrorResponses, jobSearchSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

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

    const { keyword, location, salaryMin, salaryMax, tags, sortBy, page, limit } =
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

    if (andFilters.length > 0) {
      where.AND = andFilters;
    }

    const skip = (page - 1) * limit;

    const orderBy: Prisma.JobOrderByWithRelationInput | Prisma.JobOrderByWithRelationInput[] =
      sortBy === 'salary'
        ? [{ salaryMax: 'desc' }, { salaryMin: 'desc' }, { createdAt: 'desc' }]
        : sortBy === 'time'
        ? { createdAt: 'desc' }
        : keyword
        ? [{ title: 'desc' }, { createdAt: 'desc' }]
        : { createdAt: 'desc' };

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
        orderBy,
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    res.json(
      successResponse({
        items: jobs,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        query: { keyword, location, salaryMin, salaryMax, sortBy },
      })
    );
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

    const query = q.trim();
    const suggestions = await prisma.job.findMany({
      where: {
        status: JobStatus.APPROVED,
        title: { contains: query, mode: 'insensitive' },
      },
      select: { title: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    let titles = suggestions.map((s) => s.title);
    if (titles.length < 5) {
      const tokens = query.split(/[\s/_-]+/).filter((token) => token.length > 1);
      if (tokens.length > 0) {
        const loose = await prisma.job.findMany({
          where: {
            status: JobStatus.APPROVED,
            OR: tokens.map((token) => ({
              title: { contains: token, mode: 'insensitive' },
            })),
          },
          select: { title: true },
          orderBy: { createdAt: 'desc' },
          take: 5,
        });
        titles = titles.concat(loose.map((item) => item.title));
      }
    }

    const uniqueTitles = Array.from(new Set(titles)).slice(0, 5);

    res.json(successResponse(uniqueTitles));
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
    // 简单热门搜索：取最近发布的岗位标签/标题词频，前端展示关键词
    const recentJobs = await prisma.job.findMany({
      where: { status: JobStatus.APPROVED },
      select: { title: true, tags: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const counter = new Map<string, number>();

    recentJobs.forEach((job) => {
      job.tags.forEach((tag) => counter.set(tag, (counter.get(tag) || 0) + 1));
      job.title.split(/\s|\//).forEach((token) => {
        if (token.trim().length > 1) {
          counter.set(token.trim(), (counter.get(token.trim()) || 0) + 1);
        }
      });
    });

    const sorted = Array.from(counter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([keyword, count]) => ({ keyword, count }));

    // 若数据不足，回退默认关键词
    const fallback = [
      { keyword: '前端开发', count: 0 },
      { keyword: 'Java开发', count: 0 },
      { keyword: '产品经理', count: 0 },
      { keyword: '数据分析', count: 0 },
      { keyword: 'UI设计', count: 0 },
    ];

    res.json(successResponse(sorted.length > 0 ? sorted : fallback));
  } catch (error) {
    console.error('获取热门搜索失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as searchRouter };
