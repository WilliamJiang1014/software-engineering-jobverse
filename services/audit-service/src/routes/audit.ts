import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';

const router: Router = Router();

/**
 * 获取审计日志列表
 * GET /api/v1/audit/logs
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    // TODO: 实现实际的审计日志查询逻辑

    const mockLogs = [
      {
        id: 'log-1',
        userId: 'user-1',
        action: 'JOB_CREATE',
        resourceType: 'job',
        resourceId: 'job-1',
        details: { title: '前端开发工程师' },
        createdAt: new Date(),
      },
      {
        id: 'log-2',
        userId: 'admin-1',
        action: 'JOB_APPROVE',
        resourceType: 'job',
        resourceId: 'job-1',
        details: { status: 'APPROVED' },
        createdAt: new Date(),
      },
    ];

    res.json(successResponse({
      items: mockLogs,
      pagination: { page, limit, total: 2, totalPages: 1 },
    }));
  } catch (error) {
    console.error('获取审计日志失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取单条审计日志详情
 * GET /api/v1/audit/logs/:id
 */
router.get('/logs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    // TODO: 实现实际的日志详情查询逻辑

    const mockLog = {
      id,
      userId: 'user-1',
      user: { id: 'user-1', name: '张三', email: 'zhangsan@example.com' },
      action: 'JOB_CREATE',
      resourceType: 'job',
      resourceId: 'job-1',
      details: { title: '前端开发工程师', location: '北京' },
      createdAt: new Date(),
    };

    res.json(successResponse(mockLog));
  } catch (error) {
    console.error('获取日志详情失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 记录审计日志（内部接口，供其他服务调用）
 * POST /api/v1/audit/logs
 */
router.post('/logs', async (req: Request, res: Response) => {
  try {
    const { userId, action, resourceType, resourceId, details } = req.body;

    if (!action || !resourceType) {
      return res.status(400).json(ErrorResponses.badRequest('action 和 resourceType 不能为空'));
    }

    // TODO: 实现实际的日志记录逻辑

    const mockLog = {
      id: 'new-log-id',
      userId,
      action,
      resourceType,
      resourceId,
      details,
      createdAt: new Date(),
    };

    res.status(201).json(successResponse(mockLog, '记录成功'));
  } catch (error) {
    console.error('记录审计日志失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 获取统计数据
 * GET /api/v1/audit/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'SCHOOL_ADMIN' && userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    // TODO: 实现实际的统计逻辑

    const mockStats = {
      totalJobs: 100,
      pendingJobs: 10,
      approvedJobs: 80,
      rejectedJobs: 10,
      totalUsers: 500,
      totalApplications: 1000,
      todayApplications: 50,
    };

    res.json(successResponse(mockStats));
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as auditRouter };

