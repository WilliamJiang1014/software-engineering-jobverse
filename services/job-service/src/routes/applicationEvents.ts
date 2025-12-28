import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取投递时间线（事件列表）
 * GET /api/v1/applications/:applicationId/events
 */
router.get('/applications/:applicationId/events', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { applicationId } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 验证投递是否存在
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          include: {
            company: {
              include: {
                employerInfo: true,
              },
            },
          },
        },
      },
    });

    if (!application) {
      return res.status(404).json(ErrorResponses.notFound('投递记录不存在'));
    }

    // 权限检查：学生只能查看自己的，企业只能查看自己公司的
    let hasAccess = false;

    if (userRole === 'STUDENT') {
      hasAccess = application.userId === userId;
    } else if (userRole === 'EMPLOYER') {
      hasAccess = application.job.company.employerInfo.some(
        (info) => info.userId === userId
      );
    } else if (userRole === 'SCHOOL_ADMIN' || userRole === 'PLATFORM_ADMIN') {
      hasAccess = true; // 管理员可查看所有
    }

    if (!hasAccess) {
      return res.status(403).json(ErrorResponses.forbidden('无权查看此投递时间线'));
    }

    // 获取事件列表
    const events = await prisma.applicationEvent.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'asc' }, // 按时间正序
    });

    res.json(successResponse(events));
  } catch (error) {
    console.error('获取投递时间线失败:', error);
    res.status(500).json(ErrorResponses.internalError('获取投递时间线失败'));
  }
});

/**
 * 创建投递事件（内部接口，供其他路由调用）
 * POST /api/v1/application-events
 * Body: { applicationId, type, actorRole, actorId?, metadata? }
 */
router.post('/application-events', async (req: Request, res: Response) => {
  try {
    const { applicationId, type, actorRole, actorId, metadata } = req.body;

    if (!applicationId || !type || !actorRole) {
      return res.status(400).json(ErrorResponses.badRequest('缺少必要字段'));
    }

    const event = await prisma.applicationEvent.create({
      data: {
        applicationId,
        type,
        actorRole,
        actorId,
        metadata,
      },
    });

    res.status(201).json(successResponse(event));
  } catch (error) {
    console.error('创建投递事件失败:', error);
    res.status(500).json(ErrorResponses.internalError('创建投递事件失败'));
  }
});

export default router;

