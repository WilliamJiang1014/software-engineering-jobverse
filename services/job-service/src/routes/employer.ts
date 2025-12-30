import { Router, Request, Response } from 'express';
import { JobStatus, ApplicationStatus, ApplicationEventType, Prisma } from '@prisma/client';
import { successResponse, ErrorResponses, createJobSchema, updateJobSchema, updateCompanySchema, NotificationType } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import axios from 'axios';
import { calculateCompanyRisk } from '../utils/risk';
import { createNotification } from '../utils/notification';

const router: Router = Router();

// Helper: 获取当前用户的公司ID
const getCompanyId = async (userId: string): Promise<string | null> => {
  const employerInfo = await prisma.employerInfo.findUnique({
    where: { userId },
  });
  return employerInfo?.companyId || null;
};

/**
 * 获取企业自己的公司信息
 * GET /api/v1/employer/company
 */
router.get('/company', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        name: true,
        industry: true,
        scale: true,
        location: true,
        description: true,
        website: true,
        logo: true,
        contactPerson: true,
        contactPhone: true,
        contactEmail: true,
        verifiedBySchool: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!company) {
      return res.status(404).json(ErrorResponses.notFound('公司不存在'));
    }

    // 计算企业风险信息
    const riskInfo = await calculateCompanyRisk(companyId);

    res.json(successResponse({
      ...company,
      riskInfo: riskInfo || {
        riskLevel: 'low' as const,
        riskScore: 100,
        riskMessage: '',
        riskDetails: [],
        riskFactors: [],
      },
    }));
  } catch (error) {
    console.error('获取企业信息失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 更新企业信息
 * PUT /api/v1/employer/company
 */
router.put('/company', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    // 验证请求数据
    const validatedData = updateCompanySchema.parse(req.body);

    const company = await prisma.company.update({
      where: { id: companyId },
      data: validatedData,
    });

    res.json(successResponse(company));
  } catch (error: any) {
    if (error.issues) {
      return res.status(400).json(ErrorResponses.badRequest('参数错误', error.message));
    }
    console.error('更新企业信息失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取企业工作台仪表盘数据
 * GET /api/v1/employer/dashboard
 */
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    // 并行获取所有统计数据
    const [
      activeJobs,
      totalApplications,
      pendingApplications,
      acceptedApplications,
      recentCandidates,
      jobStats
    ] = await prisma.$transaction([
      // 1. 发布岗位总数
      prisma.job.count({ where: { companyId } }),
      
      // 2. 收到简历总数
      prisma.application.count({ where: { job: { companyId } } }),
      
      // 3. 待处理简历 (APPLIED)
      prisma.application.count({ where: { job: { companyId }, status: ApplicationStatus.APPLIED } }),
      
      // 4. 已录用简历 (ACCEPTED)
      prisma.application.count({ where: { job: { companyId }, status: ApplicationStatus.ACCEPTED } }),
      
      // 5. 最新候选人 (5条)
      prisma.application.findMany({
        where: { job: { companyId } },
        take: 5,
        orderBy: { appliedAt: 'desc' },
        select: {
          id: true,
          status: true,
          appliedAt: true,
          user: {
            select: {
              name: true,
              avatar: true
            }
          },
          job: {
            select: {
              title: true
            }
          }
        }
      }),

      // 6. 岗位数据 (最近发布或有最新投递简历的 5 个岗位)
      prisma.$queryRaw`
        SELECT j.id, j.title, CAST(COUNT(a.id) AS INTEGER) as "applicationCount"
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.company_id = ${companyId}
        GROUP BY j.id
        ORDER BY GREATEST(j.created_at, COALESCE(MAX(a.applied_at), j.created_at)) DESC
        LIMIT 5
      `
    ]);

    res.json(successResponse({
      stats: {
        activeJobs,
        totalApplications,
        pendingApplications,
        acceptedApplications
      },
      recentCandidates: recentCandidates.map(c => ({
        id: c.id,
        name: c.user.name || '未命名',
        jobTitle: c.job.title,
        status: c.status,
        date: c.appliedAt
      })),
      jobStats: (jobStats as any[]).map(j => ({
        id: j.id,
        title: j.title,
        applications: j.applicationCount,
        views: 0 // 暂时不支持浏览量统计
      }))
    }));

  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取企业发布的岗位列表
 * GET /api/v1/employer/jobs
 */
router.get('/jobs', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [jobs, total] = await prisma.$transaction([
      prisma.job.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: {
            select: { applications: true }
          }
        }
      }),
      prisma.job.count({ where: { companyId } }),
    ]);

    res.json(successResponse({
      items: jobs,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }));
  } catch (error) {
    console.error('获取岗位列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 创建岗位
 * POST /api/v1/employer/jobs
 */
router.post('/jobs', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const validationResult = createJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const newJob = await prisma.job.create({
      data: {
        ...validationResult.data,
        companyId,
        status: JobStatus.DRAFT, // 默认为草稿
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 默认30天有效期
      },
    });

    // 记录审计日志
    try {
      const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006';
      
      await axios.post(
        `${auditServiceUrl}/api/v1/audit/logs`,
        {
          userId,
          action: 'JOB_CREATE',
          resourceType: 'JOB',
          resourceId: newJob.id,
          details: {
            title: newJob.title,
            companyId,
          },
        },
        { timeout: 5000 }
      );
    } catch (auditError: any) {
      console.warn('记录审计日志失败:', auditError.message);
    }

    res.status(201).json(successResponse(newJob, '创建成功'));
  } catch (error) {
    console.error('创建岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取岗位详情
 * GET /api/v1/employer/jobs/:id
 */
router.get('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const job = await prisma.job.findUnique({
      where: { id },
    });

    if (!job) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }

    if (job.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权查看此岗位'));
    }

    res.json(successResponse(job));
  } catch (error) {
    console.error('获取岗位详情失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 编辑岗位
 * PUT /api/v1/employer/jobs/:id
 */
router.put('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    // 检查权限
    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }
    if (existingJob.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权编辑此岗位'));
    }

    const validationResult = updateJobSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json(
        ErrorResponses.badRequest('参数验证失败', validationResult.error.message)
      );
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: validationResult.data,
    });

    res.json(successResponse(updatedJob, '更新成功'));
  } catch (error) {
    console.error('更新岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 提交审核
 * POST /api/v1/employer/jobs/:id/submit
 */
router.post('/jobs/:id/submit', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }
    if (existingJob.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权操作此岗位'));
    }

    // 调用风控检测（敏感词、重复检测、内容质量）
    try {
      const riskServiceUrl = process.env.RISK_SERVICE_URL || 'http://risk-service:3005';
      const contentToCheck = [
        existingJob.title,
        existingJob.description,
        existingJob.requirements,
      ].filter(Boolean).join(' ');

      const riskCheckResponse = await axios.post(
        `${riskServiceUrl}/api/v1/risk/check`,
        { 
          content: contentToCheck, 
          type: 'job',
          jobId: existingJob.id,
          title: existingJob.title,
          description: existingJob.description,
          requirements: existingJob.requirements,
        },
        { timeout: 10000 } // 增加超时时间，因为重复检测需要查询数据库
      );

      if (riskCheckResponse.data?.code === 200 && riskCheckResponse.data?.data) {
        const { passed, risks, suggestions, riskSummary } = riskCheckResponse.data.data;
        
        if (!passed) {
          // 阻止：明确告知涉及的敏感词
          const blockedKeywords = riskSummary?.blockedKeywords || [];
          const errorMessage = blockedKeywords.length > 0
            ? `您的岗位内容包含敏感词：${blockedKeywords.join('、')}，请修改后重新提交`
            : suggestions?.join('; ') || '内容未通过风控检测，请检查岗位内容';
          
          return res.status(400).json(
            ErrorResponses.badRequest(
              '内容未通过风控检测，无法提交审核',
              errorMessage
            )
          );
        }

        // 如果有标记为高风险的风险，设置高风险标记
        if (risks && risks.length > 0) {
          const markRisks = risks.filter((r: { action: string }) => r.action === 'mark');
          if (markRisks.length > 0) {
            console.log(`岗位 ${id} 提交时检测到高风险内容:`, markRisks);
            // 设置高风险标记
            await prisma.job.update({
              where: { id },
              data: { isHighRisk: true },
            });
          }
        }
      }
    } catch (riskError: any) {
      // 风控服务不可用时，记录日志但不阻止提交（可根据需求调整）
      console.warn('敏感词检测服务不可用，跳过检测:', riskError.message);
    }

    const updatedJob = await prisma.job.update({
      where: { id },
      data: { status: JobStatus.PENDING_REVIEW },
    });

    res.json(successResponse(updatedJob, '已提交审核'));
  } catch (error) {
    console.error('提交审核失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取所有候选人（全公司）
 * GET /api/v1/employer/candidates
 */
router.get('/candidates', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const applications = await prisma.application.findMany({
      where: { 
        job: { companyId } 
      },
      select: {
        id: true,
        userId: true,
        jobId: true,
        status: true,
        resume: true,
        coverLetter: true,
        appliedAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          }
        },
        job: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.json(successResponse({ items: applications }));
  } catch (error) {
    console.error('获取所有候选人失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 删除岗位
 * DELETE /api/v1/employer/jobs/:id
 */
router.delete('/jobs/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { password } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    if (!password) {
      return res.status(400).json(ErrorResponses.badRequest('请输入密码'));
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    // 1. 验证岗位权限
    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }
    if (existingJob.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权操作此岗位'));
    }

    // 2. 验证密码 (调用 User Service)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json(ErrorResponses.notFound('用户不存在'));
    }

    // 使用 fetch 调用 user-service 验证密码
    try {
      const authResponse = await fetch('http://user-service:3001/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, password })
      });

      if (!authResponse.ok) {
        return res.status(403).json(ErrorResponses.forbidden('密码错误，无法删除'));
      }
    } catch (err) {
      console.error('调用 User Service 验证密码失败:', err);
      return res.status(500).json(ErrorResponses.internalError('验证服务暂时不可用'));
    }

    // 3. 软删除岗位：标记为 OFFLINE，保留历史记录
    await prisma.job.update({ where: { id }, data: { status: JobStatus.OFFLINE } });

    res.json(successResponse(null, '岗位已删除'));
  } catch (error) {
    console.error('删除岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取某岗位的候选人列表
 * GET /api/v1/employer/jobs/:id/candidates
 */
router.get('/jobs/:id/candidates', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const existingJob = await prisma.job.findUnique({ where: { id } });
    if (!existingJob) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }
    if (existingJob.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权查看此岗位的候选人'));
    }

    const applications = await prisma.application.findMany({
      where: { jobId: id },
      select: {
        id: true,
        userId: true,
        jobId: true,
        status: true,
        resume: true,
        coverLetter: true,
        appliedAt: true,
        updatedAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatar: true,
          }
        }
      },
      orderBy: { appliedAt: 'desc' }
    });

    res.json(successResponse({ items: applications }));
  } catch (error) {
    console.error('获取候选人列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 更新候选人状态
 * PUT /api/v1/employer/candidates/:id/status
 * Body: { status, feedback?, employerNote? }
 */
router.put('/candidates/:id/status', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params; // Application ID
    const { status, feedback, employerNote } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    if (!Object.values(ApplicationStatus).includes(status)) {
       return res.status(400).json(ErrorResponses.badRequest('无效的状态'));
    }

    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }

    const application = await prisma.application.findUnique({
      where: { id },
      include: { job: true }
    });

    if (!application) {
      return res.status(404).json(ErrorResponses.notFound('投递记录不存在'));
    }

    if (application.job.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权操作此候选人'));
    }

    const oldStatus = application.status;
    
    // 更新状态和反馈
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status,
        ...(feedback !== undefined && { feedback }),
        ...(employerNote !== undefined && { employerNote }),
      },
    });

    // 写入时间线事件
    // 如果是从 APPLIED 变为 VIEWED，写入 VIEWED 事件
    if (oldStatus === ApplicationStatus.APPLIED && status === ApplicationStatus.VIEWED) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: id,
          type: ApplicationEventType.VIEWED,
          actorRole: 'EMPLOYER',
          actorId: userId,
        },
      });
    }

    // 写入 STATUS_CHANGED 事件（状态变更时）
    if (oldStatus !== status) {
      await prisma.applicationEvent.create({
        data: {
          applicationId: id,
          type: ApplicationEventType.STATUS_CHANGED,
          actorRole: 'EMPLOYER',
          actorId: userId,
          metadata: {
            fromStatus: oldStatus,
            toStatus: status,
            ...(feedback && { feedback }),
          },
        },
      });

      // 创建通知给学生
      const statusLabels: Record<string, string> = {
        VIEWED: '已查看',
        INTERVIEWING: '面试中',
        ACCEPTED: '已录用',
        REJECTED: '不合适',
      };

      await createNotification({
        userId: application.userId,
        type: NotificationType.STATUS_UPDATE,
        title: '投递状态更新',
        content: `您的投递状态已更新为：${statusLabels[status] || status}`,
        resourceType: 'APPLICATION',
        resourceId: id,
      });
    }

    res.json(successResponse(updatedApplication, '状态更新成功'));
  } catch (error) {
    console.error('更新候选人状态失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

router.post('/jobs/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }
    const companyId = await getCompanyId(userId);
    if (!companyId) {
      return res.status(403).json(ErrorResponses.forbidden('非企业用户或未绑定公司'));
    }
    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return res.status(404).json(ErrorResponses.notFound('岗位不存在'));
    }
    if (job.companyId !== companyId) {
      return res.status(403).json(ErrorResponses.forbidden('无权复制此岗位'));
    }
    const duplicated = await prisma.job.create({
      data: {
        companyId,
        title: `${job.title}（复制）`,
        location: job.location,
        salaryMin: job.salaryMin || null,
        salaryMax: job.salaryMax || null,
        description: job.description || null,
        requirements: job.requirements || null,
        tags: job.tags || [],
        status: JobStatus.DRAFT,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });
    res.status(201).json(successResponse(duplicated, '复制成功'));
  } catch (error) {
    console.error('复制岗位失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as employerRouter };
