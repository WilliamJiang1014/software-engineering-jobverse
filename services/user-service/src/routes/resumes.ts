import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses } from '@jobverse/shared';
import { prisma } from '../lib/prisma';

const router: Router = Router();

/**
 * 获取我的简历列表
 * GET /api/v1/resumes
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const resumes = await prisma.resume.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' }, // 默认简历排在前面
        { updatedAt: 'desc' },
      ],
    });

    res.json(successResponse(resumes));
  } catch (error) {
    console.error('获取简历列表失败:', error);
    res.status(500).json(ErrorResponses.internalError('获取简历列表失败'));
  }
});

/**
 * 获取单个简历详情
 * GET /api/v1/resumes/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json(ErrorResponses.notFound('简历不存在'));
    }

    if (resume.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权访问此简历'));
    }

    res.json(successResponse(resume));
  } catch (error) {
    console.error('获取简历详情失败:', error);
    res.status(500).json(ErrorResponses.internalError('获取简历详情失败'));
  }
});

/**
 * 创建简历
 * POST /api/v1/resumes
 * Body: { name, content, isDefault? }
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { name, content, isDefault } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    if (!name || !content) {
      return res.status(400).json(ErrorResponses.badRequest('简历名称和内容不能为空'));
    }

    // 如果设为默认简历，需要先取消其他默认简历
    if (isDefault) {
      await prisma.resume.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const resume = await prisma.resume.create({
      data: {
        userId,
        name,
        content,
        isDefault: isDefault || false,
      },
    });

    res.status(201).json(successResponse(resume));
  } catch (error) {
    console.error('创建简历失败:', error);
    res.status(500).json(ErrorResponses.internalError('创建简历失败'));
  }
});

/**
 * 更新简历
 * PUT /api/v1/resumes/:id
 * Body: { name?, content? }
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;
    const { name, content } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 验证简历归属
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json(ErrorResponses.notFound('简历不存在'));
    }

    if (resume.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权修改此简历'));
    }

    const updated = await prisma.resume.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(content && { content }),
      },
    });

    res.json(successResponse(updated));
  } catch (error) {
    console.error('更新简历失败:', error);
    res.status(500).json(ErrorResponses.internalError('更新简历失败'));
  }
});

/**
 * 设置默认简历
 * PUT /api/v1/resumes/:id/default
 */
router.put('/:id/default', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 验证简历归属
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json(ErrorResponses.notFound('简历不存在'));
    }

    if (resume.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权修改此简历'));
    }

    // 取消其他默认简历
    await prisma.resume.updateMany({
      where: {
        userId,
        isDefault: true,
      },
      data: {
        isDefault: false,
      },
    });

    // 设置当前简历为默认
    const updated = await prisma.resume.update({
      where: { id },
      data: {
        isDefault: true,
      },
    });

    res.json(successResponse(updated));
  } catch (error) {
    console.error('设置默认简历失败:', error);
    res.status(500).json(ErrorResponses.internalError('设置默认简历失败'));
  }
});

/**
 * 删除简历
 * DELETE /api/v1/resumes/:id
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 验证简历归属
    const resume = await prisma.resume.findUnique({
      where: { id },
    });

    if (!resume) {
      return res.status(404).json(ErrorResponses.notFound('简历不存在'));
    }

    if (resume.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权删除此简历'));
    }

    await prisma.resume.delete({
      where: { id },
    });

    res.json(successResponse({ message: '简历已删除' }));
  } catch (error) {
    console.error('删除简历失败:', error);
    res.status(500).json(ErrorResponses.internalError('删除简历失败'));
  }
});

export default router;

