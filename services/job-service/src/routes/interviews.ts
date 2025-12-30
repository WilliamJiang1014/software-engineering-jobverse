import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, NotificationType } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import { InterviewMode, InterviewStatus, ApplicationEventType } from '@prisma/client';
import { createNotification } from '../utils/notification';

const router: Router = Router();

/**
 * 企业：为投递创建面试邀请
 * POST /api/v1/employer/applications/:applicationId/interviews
 * Body: { scheduledAt, mode, locationOrLink?, note? }
 */
router.post('/employer/applications/:applicationId/interviews', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { applicationId } = req.params;
    const { scheduledAt, mode, locationOrLink, note } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    if (userRole !== 'EMPLOYER') {
      return res.status(403).json(ErrorResponses.forbidden('仅企业用户可创建面试邀请'));
    }

    if (!scheduledAt || !mode) {
      return res.status(400).json(ErrorResponses.badRequest('面试时间和模式不能为空'));
    }

    // 验证投递是否存在，且属于该企业的岗位
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

    // 检查当前用户是否属于该企业
    const isEmployerOfCompany = application.job.company.employerInfo.some(
      (info) => info.userId === userId
    );

    if (!isEmployerOfCompany) {
      return res.status(403).json(ErrorResponses.forbidden('无权对此投递创建面试'));
    }

    // 创建面试邀请
    const interview = await prisma.interview.create({
      data: {
        applicationId,
        employerId: userId,
        scheduledAt: new Date(scheduledAt),
        mode: mode as InterviewMode,
        locationOrLink,
        note,
      },
    });

    // 创建投递事件
    await prisma.applicationEvent.create({
      data: {
        applicationId,
        type: ApplicationEventType.INTERVIEW_CREATED,
        actorRole: 'EMPLOYER',
        actorId: userId,
        metadata: {
          interviewId: interview.id,
          scheduledAt,
          mode,
        },
      },
    });

    // 创建通知给学生
    await createNotification({
      userId: application.userId,
      type: NotificationType.INTERVIEW,
      title: '收到面试邀请',
      content: `您收到了企业的面试邀请，请及时查看并确认`,
      resourceType: 'INTERVIEW',
      resourceId: interview.id,
    });

    res.status(201).json(successResponse(interview));
  } catch (error) {
    console.error('创建面试邀请失败:', error);
    res.status(500).json(ErrorResponses.internalError('创建面试邀请失败'));
  }
});

/**
 * 企业：更新/取消面试邀请
 * PUT /api/v1/employer/interviews/:id
 * Body: { scheduledAt?, mode?, locationOrLink?, note?, status? }
 */
router.put('/employer/interviews/:id', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { id } = req.params;
    const { scheduledAt, mode, locationOrLink, note, status } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    if (userRole !== 'EMPLOYER') {
      return res.status(403).json(ErrorResponses.forbidden('仅企业用户可修改面试'));
    }

    // 验证面试是否存在且属于该企业
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
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
        },
      },
    });

    if (!interview) {
      return res.status(404).json(ErrorResponses.notFound('面试记录不存在'));
    }

    const isEmployerOfCompany = interview.application.job.company.employerInfo.some(
      (info) => info.userId === userId
    );

    if (!isEmployerOfCompany) {
      return res.status(403).json(ErrorResponses.forbidden('无权修改此面试'));
    }

    // 更新面试
    const updated = await prisma.interview.update({
      where: { id },
      data: {
        ...(scheduledAt && { scheduledAt: new Date(scheduledAt) }),
        ...(mode && { mode: mode as InterviewMode }),
        ...(locationOrLink !== undefined && { locationOrLink }),
        ...(note !== undefined && { note }),
        ...(status && { status: status as InterviewStatus }),
      },
    });

    // 如果状态变为 CANCELLED，创建事件和通知
    if (status === 'CANCELLED') {
      await prisma.applicationEvent.create({
        data: {
          applicationId: interview.applicationId,
          type: ApplicationEventType.INTERVIEW_CANCELLED,
          actorRole: 'EMPLOYER',
          actorId: userId,
          metadata: {
            interviewId: interview.id,
          },
        },
      });

      // 创建通知给学生
      await createNotification({
        userId: interview.application.userId,
        type: NotificationType.INTERVIEW,
        title: '面试已取消',
        content: `企业取消了面试安排`,
        resourceType: 'INTERVIEW',
        resourceId: interview.id,
      });
    }

    res.json(successResponse(updated));
  } catch (error) {
    console.error('更新面试失败:', error);
    res.status(500).json(ErrorResponses.internalError('更新面试失败'));
  }
});

/**
 * 学生：查看投递的面试信息
 * GET /api/v1/applications/:applicationId/interview
 */
router.get('/applications/:applicationId/interview', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { applicationId } = req.params;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    // 验证投递归属
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      return res.status(404).json(ErrorResponses.notFound('投递记录不存在'));
    }

    if (application.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权查看此投递'));
    }

    // 获取面试记录（可能有多个，按创建时间倒序）
    const interviews = await prisma.interview.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    res.json(successResponse(interviews));
  } catch (error) {
    console.error('获取面试信息失败:', error);
    res.status(500).json(ErrorResponses.internalError('获取面试信息失败'));
  }
});

/**
 * 学生：响应面试邀请（确认/拒绝/改期）
 * PUT /api/v1/interviews/:id/respond
 * Body: { status: 'CONFIRMED' | 'DECLINED' | 'RESCHEDULE_REQUESTED', studentComment? }
 */
router.put('/interviews/:id/respond', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const userRole = req.headers['x-user-role'] as string;
    const { id } = req.params;
    const { status, studentComment } = req.body;

    if (!userId) {
      return res.status(401).json(ErrorResponses.unauthorized());
    }

    if (userRole !== 'STUDENT') {
      return res.status(403).json(ErrorResponses.forbidden('仅学生可响应面试邀请'));
    }

    if (!status || !['CONFIRMED', 'DECLINED', 'RESCHEDULE_REQUESTED'].includes(status)) {
      return res.status(400).json(ErrorResponses.badRequest('无效的响应状态'));
    }

    // 验证面试是否存在且属于该学生的投递
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        application: {
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
        },
      },
    });

    if (!interview) {
      return res.status(404).json(ErrorResponses.notFound('面试记录不存在'));
    }

    if (interview.application.userId !== userId) {
      return res.status(403).json(ErrorResponses.forbidden('无权响应此面试'));
    }

    // 更新面试状态
    const updated = await prisma.interview.update({
      where: { id },
      data: {
        status: status as InterviewStatus,
        ...(studentComment && { studentComment }),
      },
    });

    // 创建投递事件
    await prisma.applicationEvent.create({
      data: {
        applicationId: interview.applicationId,
        type: ApplicationEventType.INTERVIEW_RESPONDED,
        actorRole: 'STUDENT',
        actorId: userId,
        metadata: {
          interviewId: interview.id,
          status,
          studentComment,
        },
      },
    });

    // 创建通知给企业（通知创建面试的企业用户）
    const statusLabels: Record<string, string> = {
      CONFIRMED: '确认',
      DECLINED: '拒绝',
      RESCHEDULE_REQUESTED: '请求改期',
    };
    
    // 优先使用创建面试的企业用户ID，否则使用第一个企业用户ID
    const employerUserId = interview.employerId || interview.application.job.company.employerInfo?.[0]?.userId;
    if (employerUserId) {
      await createNotification({
        userId: employerUserId,
        type: NotificationType.INTERVIEW,
        title: '学生响应面试邀请',
        content: `学生对您的面试邀请做出了${statusLabels[status] || '响应'}`,
        resourceType: 'INTERVIEW',
        resourceId: interview.id,
      });
    }

    res.json(successResponse(updated));
  } catch (error) {
    console.error('响应面试邀请失败:', error);
    res.status(500).json(ErrorResponses.internalError('响应面试邀请失败'));
  }
});

export default router;

