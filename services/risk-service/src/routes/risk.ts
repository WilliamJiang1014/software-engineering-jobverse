import { Router, Request, Response } from 'express';
import { successResponse, ErrorResponses, paginationSchema } from '@jobverse/shared';
import { prisma } from '../lib/prisma';
import axios from 'axios';

const router: Router = Router();

/**
 * 获取风控规则列表
 * GET /api/v1/risk/rules
 */
router.get('/rules', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const validationResult = paginationSchema.safeParse(req.query);
    const { page, limit } = validationResult.success 
      ? validationResult.data 
      : { page: 1, limit: 20 };

    const skip = (page - 1) * limit;

    const [rules, total] = await Promise.all([
      prisma.riskRule.findMany({
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.riskRule.count(),
    ]);

    res.json(successResponse({
      items: rules,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }));
  } catch (error) {
    console.error('获取规则列表失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 创建风控规则
 * POST /api/v1/risk/rules
 */
router.post('/rules', async (req: Request, res: Response) => {
  try {
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const { ruleType, content, action, enabled } = req.body;

    if (!ruleType || !content || !action) {
      return res.status(400).json(ErrorResponses.badRequest('ruleType、content、action 不能为空'));
    }

    if (!['sensitive_word', 'duplicate_detection', 'content_quality'].includes(ruleType)) {
      return res.status(400).json(ErrorResponses.badRequest('ruleType 必须是 sensitive_word、duplicate_detection 或 content_quality'));
    }

    if (!['block', 'mark'].includes(action)) {
      return res.status(400).json(ErrorResponses.badRequest('action 必须是 block 或 mark'));
    }

    const rule = await prisma.riskRule.create({
      data: {
        ruleType,
        content,
        action,
        enabled: enabled ?? true,
      },
    });

    // 记录审计日志
    try {
      const userId = req.headers['x-user-id'] as string;
      const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006';
      
      await axios.post(
        `${auditServiceUrl}/api/v1/audit/logs`,
        {
          userId,
          action: 'RISK_RULE_CREATE',
          resourceType: 'RISK_RULE',
          resourceId: rule.id,
          details: {
            ruleType,
            action,
            enabled: enabled ?? true,
          },
        },
        { timeout: 5000 }
      );
    } catch (auditError: any) {
      console.warn('记录审计日志失败:', auditError.message);
    }

    res.status(201).json(successResponse(rule, '创建成功'));
  } catch (error) {
    console.error('创建规则失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 更新风控规则
 * PUT /api/v1/risk/rules/:id
 */
router.put('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const { content, action, enabled } = req.body;

    const rule = await prisma.riskRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json(ErrorResponses.notFound('规则不存在'));
    }

    const updateData: any = {};
    if (content !== undefined) updateData.content = content;
    if (action !== undefined) {
      if (!['block', 'mark'].includes(action)) {
        return res.status(400).json(ErrorResponses.badRequest('action 必须是 block 或 mark'));
      }
      updateData.action = action;
    }
    if (enabled !== undefined) updateData.enabled = enabled;

    const updatedRule = await prisma.riskRule.update({
      where: { id },
      data: updateData,
    });

    // 记录审计日志
    try {
      const userId = req.headers['x-user-id'] as string;
      const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006';
      
      await axios.post(
        `${auditServiceUrl}/api/v1/audit/logs`,
        {
          userId,
          action: 'RISK_RULE_UPDATE',
          resourceType: 'RISK_RULE',
          resourceId: id,
          details: {
            ruleType: rule.ruleType,
            ...updateData,
          },
        },
        { timeout: 5000 }
      );
    } catch (auditError: any) {
      console.warn('记录审计日志失败:', auditError.message);
    }

    res.json(successResponse(updatedRule, '更新成功'));
  } catch (error) {
    console.error('更新规则失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 删除风控规则
 * DELETE /api/v1/risk/rules/:id
 */
router.delete('/rules/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userRole = req.headers['x-user-role'];

    if (userRole !== 'PLATFORM_ADMIN') {
      return res.status(403).json(ErrorResponses.forbidden());
    }

    const rule = await prisma.riskRule.findUnique({
      where: { id },
    });

    if (!rule) {
      return res.status(404).json(ErrorResponses.notFound('规则不存在'));
    }

    // 记录审计日志（在删除前）
    try {
      const userId = req.headers['x-user-id'] as string;
      const auditServiceUrl = process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006';
      
      await axios.post(
        `${auditServiceUrl}/api/v1/audit/logs`,
        {
          userId,
          action: 'RISK_RULE_DELETE',
          resourceType: 'RISK_RULE',
          resourceId: id,
          details: {
            ruleType: rule.ruleType,
            content: rule.content,
            action: rule.action,
          },
        },
        { timeout: 5000 }
      );
    } catch (auditError: any) {
      console.warn('记录审计日志失败:', auditError.message);
    }

    await prisma.riskRule.delete({
      where: { id },
    });

    res.json(successResponse(null, '删除成功'));
  } catch (error) {
    console.error('删除规则失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

/**
 * 计算文本相似度（简单的 Jaccard 相似度）
 */
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  const words2 = new Set(text2.toLowerCase().split(/\s+/).filter(w => w.length > 1));
  
  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * 内容风控检测
 * POST /api/v1/risk/check
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    const { content, type, jobId, title, description, requirements } = req.body;

    if (!content || typeof content !== 'string') {
      return res.status(400).json(ErrorResponses.badRequest('内容不能为空'));
    }

    // 获取所有启用的规则
    const allRules = await prisma.riskRule.findMany({
      where: {
        enabled: true,
      },
    });

    const risks: Array<{ ruleId: string; ruleType: string; matched: string; action: string }> = [];
    const suggestions: string[] = [];

    // 1. 检测敏感词
    const sensitiveWordRules = allRules.filter(r => r.ruleType === 'sensitive_word');
    for (const rule of sensitiveWordRules) {
      const keywords = rule.content.split('|').map(k => k.trim()).filter(k => k);
      const matchedKeywords: string[] = [];

      for (const keyword of keywords) {
        if (content.includes(keyword)) {
          matchedKeywords.push(keyword);
        }
      }

      if (matchedKeywords.length > 0) {
        risks.push({
          ruleId: rule.id,
          ruleType: rule.ruleType,
          matched: matchedKeywords.join('、'),
          action: rule.action,
        });

        if (rule.action === 'block') {
          // 阻止：明确告知涉及的敏感词
          suggestions.push(`您的岗位内容包含敏感词：${matchedKeywords.join('、')}，请修改后重新提交`);
        } else if (rule.action === 'mark') {
          // 标记：标记为高风险内容，审核时优先处理
          suggestions.push(`内容包含敏感词：${matchedKeywords.join('、')}，已标记为高风险内容，将在审核时优先处理`);
        }
      }
    }

    // 2. 检测重复内容（duplicate_detection）
    const duplicateRules = allRules.filter(r => r.ruleType === 'duplicate_detection');
    if (duplicateRules.length > 0 && type === 'job') {
      // 获取相似度阈值（从规则内容中读取，默认为 0.8）
      const similarityThreshold = duplicateRules[0]?.content 
        ? parseFloat(duplicateRules[0].content) || 0.8 
        : 0.8;

      // 查询已发布的岗位（排除当前岗位）
      const existingJobs = await prisma.job.findMany({
        where: {
          status: { in: ['APPROVED', 'PENDING_REVIEW'] },
          ...(jobId ? { id: { not: jobId } } : {}),
        },
        select: {
          id: true,
          title: true,
          description: true,
          requirements: true,
        },
        take: 100, // 限制查询数量以提高性能
      });

      // 构建待检测的完整文本
      const fullText = [
        title || '',
        description || '',
        requirements || '',
      ].filter(Boolean).join(' ');

      let maxSimilarity = 0;
      let similarJob: { id: string; title: string } | null = null;

      for (const job of existingJobs) {
        const jobText = [
          job.title,
          job.description || '',
          job.requirements || '',
        ].filter(Boolean).join(' ');

        const similarity = calculateSimilarity(fullText, jobText);
        if (similarity > maxSimilarity) {
          maxSimilarity = similarity;
          similarJob = { id: job.id, title: job.title };
        }
      }

      // 如果相似度超过阈值，触发规则
      if (maxSimilarity >= similarityThreshold && similarJob) {
        for (const rule of duplicateRules) {
          risks.push({
            ruleId: rule.id,
            ruleType: rule.ruleType,
            matched: `与岗位「${similarJob.title}」相似度 ${(maxSimilarity * 100).toFixed(1)}%`,
            action: rule.action,
          });

          if (rule.action === 'block') {
            suggestions.push(`您的岗位内容与已发布岗位「${similarJob.title}」高度相似（相似度 ${(maxSimilarity * 100).toFixed(1)}%），请修改后重新提交`);
          } else if (rule.action === 'mark') {
            suggestions.push(`内容与已发布岗位相似（相似度 ${(maxSimilarity * 100).toFixed(1)}%），已标记为高风险内容，将在审核时优先处理`);
          }
        }
      }
    }

    // 3. 检测内容质量（content_quality）
    const qualityRules = allRules.filter(r => r.ruleType === 'content_quality');
    if (qualityRules.length > 0 && type === 'job') {
      // 解析质量规则配置（JSON 格式，如：{"minLength": 50, "requireDescription": true, "requireRequirements": true}）
      let qualityConfig: {
        minLength?: number;
        minDescriptionLength?: number;
        minRequirementsLength?: number;
        requireDescription?: boolean;
        requireRequirements?: boolean;
      } = {};

      try {
        if (qualityRules[0]?.content) {
          qualityConfig = JSON.parse(qualityRules[0].content);
        }
      } catch (e) {
        // 如果解析失败，使用默认配置
        qualityConfig = {
          minLength: 50,
          minDescriptionLength: 30,
          minRequirementsLength: 20,
          requireDescription: true,
          requireRequirements: true,
        };
      }

      const qualityIssues: string[] = [];

      // 检查描述长度
      if (description) {
        if (qualityConfig.minDescriptionLength && description.length < qualityConfig.minDescriptionLength) {
          qualityIssues.push(`岗位描述过短（至少需要 ${qualityConfig.minDescriptionLength} 个字符）`);
        }
      } else if (qualityConfig.requireDescription) {
        qualityIssues.push('缺少岗位描述');
      }

      // 检查要求长度
      if (requirements) {
        if (qualityConfig.minRequirementsLength && requirements.length < qualityConfig.minRequirementsLength) {
          qualityIssues.push(`岗位要求过短（至少需要 ${qualityConfig.minRequirementsLength} 个字符）`);
        }
      } else if (qualityConfig.requireRequirements) {
        qualityIssues.push('缺少岗位要求');
      }

      // 检查总长度
      if (qualityConfig.minLength) {
        const totalLength = (title?.length || 0) + (description?.length || 0) + (requirements?.length || 0);
        if (totalLength < qualityConfig.minLength) {
          qualityIssues.push(`内容总长度不足（至少需要 ${qualityConfig.minLength} 个字符）`);
        }
      }

      // 如果有质量问题，触发规则
      if (qualityIssues.length > 0) {
        for (const rule of qualityRules) {
          risks.push({
            ruleId: rule.id,
            ruleType: rule.ruleType,
            matched: qualityIssues.join('；'),
            action: rule.action,
          });

          if (rule.action === 'block') {
            suggestions.push(`您的岗位内容质量不符合要求：${qualityIssues.join('；')}，请完善后重新提交`);
          } else if (rule.action === 'mark') {
            suggestions.push(`内容质量需要改进：${qualityIssues.join('；')}，已标记为高风险内容，将在审核时优先处理`);
          }
        }
      }
    }

    // 如果有 block 类型的风险，则不通过
    const hasBlockRisk = risks.some(r => r.action === 'block');
    const passed = !hasBlockRisk;
    
    // 统计风险类型
    const hasMarkRisk = risks.some(r => r.action === 'mark');
    
    // 提取所有匹配的敏感词（用于阻止时明确告知）
    const blockedKeywords: string[] = [];
    risks.forEach(r => {
      if (r.action === 'block' && r.ruleType === 'sensitive_word') {
        blockedKeywords.push(...r.matched.split('、'));
      }
    });

    res.json(successResponse({
      passed,
      risks,
      suggestions,
      // 额外信息：用于前端显示
      riskSummary: {
        hasBlockRisk,
        hasMarkRisk,
        blockedKeywords: [...new Set(blockedKeywords)], // 去重
      },
    }));
  } catch (error) {
    console.error('风控检测失败:', error);
    res.status(500).json(ErrorResponses.internalError());
  }
});

export { router as riskRouter };

