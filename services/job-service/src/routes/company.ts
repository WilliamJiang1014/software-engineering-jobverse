import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, maskEmail, maskPhone } from '@jobverse/shared';
import { JobStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取企业列表
 * GET /api/v1/companies
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const page = 1;
    const limit = 20;
    const [items, total] = await prisma.$transaction([
      prisma.company.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          industry: true,
          scale: true,
          location: true,
          verifiedBySchool: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.company.count(),
    ]);
    res.json(successResponse({
      items,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
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

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        industry: true,
        scale: true,
        location: true,
        description: true,
        website: true,
        contactPerson: true,
        contactPhone: true,
        contactEmail: true,
        verifiedBySchool: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!company) {
      return res.status(404).json(ErrorResponses.notFound('企业不存在'));
    }
    const currentOpenJobs = await prisma.job.count({
      where: { companyId: id, status: JobStatus.APPROVED },
    });
    const historyPublishedJobs = await prisma.job.count({
      where: { companyId: id, status: { in: [JobStatus.OFFLINE, JobStatus.REJECTED] } },
    });
    res.json(successResponse({
      ...company,
      contactPhone: company.contactPhone ? maskPhone(company.contactPhone) : null,
      contactEmail: company.contactEmail ? maskEmail(company.contactEmail) : null,
      stats: {
        currentOpenJobs,
        historyPublishedJobs,
      },
    }));
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

    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '20');
    const [openItems, historyItems, total] = await prisma.$transaction([
      prisma.job.findMany({
        where: { companyId: id, status: JobStatus.APPROVED },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          status: true,
          createdAt: true,
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.findMany({
        where: { companyId: id, status: { in: [JobStatus.OFFLINE, JobStatus.REJECTED] } },
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          location: true,
          salaryMin: true,
          salaryMax: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { applications: true } },
        },
      }),
      prisma.job.count({ where: { companyId: id, status: JobStatus.APPROVED } }),
    ]);
    res.json(successResponse({
      items: openItems,
      historyItems,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  } catch (error) {
    console.error('获取企业岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as companyRouter };
