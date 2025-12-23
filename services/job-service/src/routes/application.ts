import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import { ApplicationStatus } from '@prisma/client';

const router: Router = Router();

/**
 * 获取我的投递记录
 * GET /api/v1/applications
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
    const { status, statusGroup } = req.query;

    // 构建查询条件
    const where: any = { userId };

    // 支持按状态筛选
    if (status) {
      where.status = status as ApplicationStatus;
      console.log('筛选条件 - 单个状态:', status, 'where.status:', where.status);
    } else if (statusGroup) {
      // 支持按状态组筛选：进行中（APPLIED、VIEWED、INTERVIEWING）、已完成（ACCEPTED、REJECTED）
      if (statusGroup === 'in_progress') {
        // 使用字符串形式，Prisma 会自动转换为枚举
        where.status = { 
          in: ['APPLIED', 'VIEWED', 'INTERVIEWING'] 
        };
        console.log('筛选条件 - 进行中状态组:', statusGroup, 'where.status:', JSON.stringify(where.status));
      } else if (statusGroup === 'completed') {
        where.status = { 
          in: ['ACCEPTED', 'REJECTED'] 
        };
        console.log('筛选条件 - 已完成状态组:', statusGroup, 'where.status:', JSON.stringify(where.status));
      }
    } else {
      console.log('筛选条件 - 无筛选（全部）');
    }

    console.log('最终查询条件:', JSON.stringify(where, null, 2));

    const [applications, total] = await Promise.all([
      prisma.application.findMany({
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
        },
        orderBy: {
          appliedAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.application.count({ where }),
    ]);

    console.log(`查询结果: 找到 ${applications.length} 条记录，总计 ${total} 条`);
    if (applications.length > 0) {
      console.log('第一条记录的状态:', applications[0].status);
    }

    const items = applications.map((app) => ({
      id: app.id,
      jobId: app.jobId,
      job: {
        id: app.job.id,
        title: app.job.title,
        location: app.job.location,
        salaryMin: app.job.salaryMin,
        salaryMax: app.job.salaryMax,
        company: app.job.company,
      },
      status: app.status,
      appliedAt: app.appliedAt,
      updatedAt: app.updatedAt,
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
    console.error('获取投递记录失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as applicationRouter };
