import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import { NotificationType } from '@prisma/client';

const router: Router = Router();

/**
 * 获取通知列表
 * GET /api/v1/notifications
 * Query: ?isRead=true/false&type=TYPE&page=1&limit=20
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;
    const { isRead, type } = req.query;

    // 构建查询条件
    const where: any = { userId };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type as NotificationType;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({ where }),
    ]);

    res.json(
      successResponse({
        notifications,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      })
    );
  } catch (error) {
    console.error('获取通知列表失败:', error);
    res.status(500).json(ErrorResponses.internalError('获取通知列表失败'));
  }
});

/**
 * 获取未读通知数量
 * GET /api/v1/notifications/unread-count
 */
router.get('/unread-count', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json(successResponse({ count }));
  } catch (error) {
    console.error('获取未读数量失败:', error);
    res.status(500).json(ErrorResponses.internalError('获取未读数量失败'));
  }
});

/**
 * 标记单个通知为已读
 * PUT /api/v1/notifications/:id/read
 */
router.put('/:id/read', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 验证通知是否属于当前用户
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json(ErrorResponses.notFound('通知不存在'));
    }

    if (notification.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权操作此通知'));
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json(successResponse(updated));
  } catch (error) {
    console.error('标记已读失败:', error);
    res.status(500).json(ErrorResponses.internalError('标记已读失败'));
  }
});

/**
 * 标记所有通知为已读
 * PUT /api/v1/notifications/read-all
 */
router.put('/read-all', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json(successResponse({ updated: result.count }));
  } catch (error) {
    console.error('全部标记已读失败:', error);
    res.status(500).json(ErrorResponses.internalError('全部标记已读失败'));
  }
});

/**
 * 创建通知（内部接口，供其他服务调用）
 * POST /api/v1/notifications
 * Body: { userId, type, title, content, resourceType?, resourceId? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { userId, type, title, content, resourceType, resourceId } = req.body;

    if (!userId || !type || !title || !content) {
      return res.status(400).json(ErrorResponses.badRequest('缺少必要字段'));
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        content,
        resourceType,
        resourceId,
      },
    });

    res.status(201).json(successResponse(notification));
  } catch (error) {
    console.error('创建通知失败:', error);
    res.status(500).json(ErrorResponses.internalError('创建通知失败'));
  }
});

export default router;

