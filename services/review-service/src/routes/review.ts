import { Router, Request, Response } from 'express';
import { JobStatus, ReviewStatus } from '@prisma/client';
import { successResponse, ErrorResponses, reviewSchema, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import axios from 'axios';

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

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;

    // 查询待审核的岗位
    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where: {
          status: JobStatus.PENDING_REVIEW,
        },
        include: {
          company: {
            select: {
              id: true,
              name: true,
              verifiedBySchool: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
        skip,
        take: limit,
      }),
      prisma.job.count({
        where: {
          status: JobStatus.PENDING_REVIEW,
        },
      }),
    ]);

    const items = jobs.map((job) => ({
      id: job.id,
      title: job.title,
      company: {
        id: job.company.id,
        name: job.company.name,
        verifiedBySchool: job.company.verifiedBySchool,
      },
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      status: job.status,
      isHighRisk: job.isHighRisk,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
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
    console.error('获取待审核列表失败:', error);
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

    if (typeof verified !== 'boolean') {
      return res.status(400).json(ErrorResponses.badRequest('verified 必须是布尔值'));
    }

    const company = await prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      return res.status(404).json(ErrorResponses.notFound('企业不存在'));
    }

    const updatedCompany = await prisma.company.update({
      where: { id },
      data: { verifiedBySchool: verified },
    });

    // 记录审计日志
    try {
      const userId = req.headers['x-user-id'] as string;
      const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006';
      const action = verified ? 'COMPANY_VERIFY' : 'COMPANY_UNVERIFY';
      
      await axios.post(
        `${auditServiceUrl}/api/v1/audit/logs`,
        {
          userId,
          action,
          resourceType: 'COMPANY',
          resourceId: id,
          details: {
            name: company.name,
            verified,
          },
        },
        { timeout: 5000 }
      );
    } catch (auditError: any) {
      console.warn('记录审计日志失败:', auditError.message);
    }

    res.json(successResponse({
      companyId: id,
      verifiedBySchool: updatedCompany.verifiedBySchool,
    }, '更新成功'));
  } catch (error) {
    console.error('更新企业认证状态失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取企业认证列表
 * GET /api/v1/review/companies
 */
router.get('/companies', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          industry: true,
          scale: true,
          location: true,
          verifiedBySchool: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.company.count(),
    ]);

    res.json(successResponse({
      items: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('获取企业列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取历史审核记录
 * GET /api/v1/review/history
 */
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;
    const { status, companyId, startDate, endDate } = req.query;

    // 构建查询条件
    const where: any = {};

    // 按状态筛选
    if (status) {
      where.status = status as ReviewStatus;
    }

    // 按企业ID筛选
    if (companyId) {
      where.job = {
        companyId: companyId as string,
      };
    }

    // 只查询已审核的记录（有 reviewedAt），并按时间范围筛选
    where.reviewedAt = { not: null };
    if (startDate || endDate) {
      const reviewedAtCondition: any = { not: null };
      if (startDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        // 格式：YYYY-MM-DD
        const [year, month, day] = (startDate as string).split('-').map(Number);
        const startDateTime = new Date(year, month - 1, day, 0, 0, 0, 0);
        reviewedAtCondition.gte = startDateTime;
      }
      if (endDate) {
        // 手动解析日期字符串，使用本地时区，避免时区问题
        const [year, month, day] = (endDate as string).split('-').map(Number);
        const endDateTime = new Date(year, month - 1, day, 23, 59, 59, 999);
        reviewedAtCondition.lte = endDateTime;
      }
      where.reviewedAt = reviewedAtCondition;
    }

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where,
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
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: {
          reviewedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.review.count({ where }),
    ]);

    const items = reviews.map((review) => ({
      id: review.id,
      jobId: review.jobId,
      job: {
        id: review.job.id,
        title: review.job.title,
        company: review.job.company,
        location: review.job.location,
      },
      status: review.status,
      comment: review.comment,
      reviewedAt: review.reviewedAt,
      reviewer: review.reviewer,
      createdAt: review.createdAt,
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
    console.error('获取历史审核记录失败:', error);
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

    const job = await prisma.job.findUnique({
      where: { id },
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
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!job) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }

    res.json(successResponse({
      id: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      description: job.description,
      requirements: job.requirements,
      tags: job.tags,
      status: job.status,
      isHighRisk: job.isHighRisk,
      expiresAt: job.expiresAt,
      reviews: job.reviews.map((review) => ({
        id: review.id,
        status: review.status,
        comment: review.comment,
        reviewedAt: review.reviewedAt,
        reviewer: review.reviewer,
        createdAt: review.createdAt,
      })),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    }));
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
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const validationResult = reviewSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const { status, comment } = validationResult.data;

    // 检查岗位是否存在
    const job = await prisma.job.findUnique({
      where: { id },
      include: { company: true },
    });

    if (!job) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }

    if (job.status !== JobStatus.PENDING_REVIEW) {
      return res.status(400).json(ErrorResponses.badRequest('该岗位不在待审核状态'));
    }

    // 使用事务处理审核和岗位状态更新
    const result = await prisma.$transaction(async (tx) => {
      // 创建审核记录
      const review = await tx.review.create({
        data: {
          jobId: id,
          reviewerId: userId,
          status: status as ReviewStatus,
          comment,
          reviewedAt: new Date(),
        },
        include: {
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 更新岗位状态
      let newJobStatus: JobStatus;
      if (status === 'APPROVED') {
        newJobStatus = JobStatus.APPROVED;
      } else if (status === 'REJECTED') {
        newJobStatus = JobStatus.REJECTED;
      } else {
        // RETURNED 状态，退回为草稿
        newJobStatus = JobStatus.DRAFT;
      }

      await tx.job.update({
        where: { id },
        data: { status: newJobStatus },
      });

      // 如果是学校管理员审核通过，设置企业认证标识
      if (status === 'APPROVED' && userRole === 'SCHOOL_ADMIN') {
        await tx.company.update({
          where: { id: job.companyId },
          data: { verifiedBySchool: true },
        });
      }

      return review;
    });

    // 记录审计日志
    try {
      const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006';
      const action = status === 'APPROVED' ? 'JOB_APPROVE' : status === 'REJECTED' ? 'JOB_REJECT' : 'JOB_RETURN';
      
      await axios.post(
        `${auditServiceUrl}/api/v1/audit/logs`,
        {
          userId,
          action,
          resourceType: 'JOB',
          resourceId: id,
          details: {
            title: job.title,
            companyName: job.company.name,
            status,
            comment,
          },
        },
        { timeout: 5000 }
      );
    } catch (auditError: any) {
      // 审计日志记录失败不影响主流程，只记录警告
      console.warn('记录审计日志失败:', auditError.message);
    }

    res.json(successResponse({
      id: result.id,
      jobId: id,
      reviewerId: userId,
      status: result.status,
      comment: result.comment,
      reviewedAt: result.reviewedAt,
      reviewer: result.reviewer,
      createdAt: result.createdAt,
    }, '审核完成'));
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as reviewRouter };

