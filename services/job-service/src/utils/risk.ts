import { JobStatus, ReviewStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

/**
 * 计算企业风险信息（完善版：扣分制 + 正向加分 + 时间衰减）
 */
export async function calculateCompanyRisk(companyId: string) {
  try {
    // 1. 获取企业基本信息（包含创建和更新时间）
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: {
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
      return null;
    }

    // 扣分制：满分100分，根据风险因素扣分
    let riskScore = 100;
    const riskDetails: string[] = [];
    const riskFactors: Array<{ type: string; description: string; score: number }> = [];

    // 判断是否为新企业（注册30天内）
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const isNewCompany = company.createdAt > thirtyDaysAgo;

    // 2. 检查企业信息完整性（权重差异化）
    const missingImportantFields: string[] = []; // 重要信息（扣4分）
    const missingNormalFields: string[] = []; // 一般信息（扣2分）

    if (!company.contactPerson) missingImportantFields.push('联系人');
    if (!company.contactPhone) missingImportantFields.push('联系电话');
    if (!company.contactEmail) missingImportantFields.push('联系邮箱');
    if (!company.industry) missingNormalFields.push('所属行业');
    if (!company.scale) missingNormalFields.push('企业规模');
    if (!company.location) missingNormalFields.push('企业地址');
    if (!company.description) missingNormalFields.push('企业介绍');
    if (!company.website) missingNormalFields.push('企业官网');

    const completenessDeduction = missingImportantFields.length * 4 + missingNormalFields.length * 2;
    if (completenessDeduction > 0) {
      riskScore -= completenessDeduction;
      const allMissingFields = [...missingImportantFields, ...missingNormalFields];
      riskDetails.push(`企业信息不完整：缺少${allMissingFields.length}项信息（${allMissingFields.join('、')}）`);
      riskFactors.push({
        type: '信息不完整',
        description: `缺少以下信息：${allMissingFields.join('、')}`,
        score: -completenessDeduction,
      });
    }

    // 3. 统计审核驳回次数（带时间衰减和认证减震）
    const allRejectedReviews = await prisma.review.findMany({
      where: {
        job: { companyId },
        status: ReviewStatus.REJECTED,
      },
      select: {
        reviewedAt: true,
      },
      orderBy: {
        reviewedAt: 'desc',
      },
    });

    let totalReviewDeduction = 0;
    const now = new Date();
    
    // 计算时间衰减后的扣分
    for (const review of allRejectedReviews) {
      if (!review.reviewedAt) continue;
      
      const daysSinceRejection = Math.floor((now.getTime() - review.reviewedAt.getTime()) / (1000 * 60 * 60 * 24));
      const quartersSinceRejection = Math.floor(daysSinceRejection / 90); // 每90天为一个季度
      
      // 基础扣分：每次驳回扣5分
      let baseDeduction = 5;
      
      // 认证减震：已认证企业扣分减半
      if (company.verifiedBySchool) {
        baseDeduction = Math.ceil(baseDeduction / 2);
      }
      
      // 时间衰减：每过90天，扣分减少30%，最低保留10%
      const decayFactor = Math.max(0.1, Math.pow(0.7, quartersSinceRejection));
      const finalDeduction = baseDeduction * decayFactor;
      
      totalReviewDeduction += finalDeduction;
    }

    // 限制最高扣分：30分
    totalReviewDeduction = Math.min(totalReviewDeduction, 30);
    
    if (totalReviewDeduction > 0) {
      riskScore -= totalReviewDeduction;
      riskDetails.push(`审核驳回记录：${allRejectedReviews.length}次（已应用时间衰减）`);
      riskFactors.push({
        type: '审核驳回',
        description: `该企业有${allRejectedReviews.length}个岗位被审核驳回，已应用时间衰减和认证减震`,
        score: -Math.round(totalReviewDeduction * 10) / 10,
      });
    }

    // 4. 统计高风险岗位数量（每个高风险岗位扣3分，最高扣15分）
    const highRiskJobs = await prisma.job.count({
      where: {
        companyId,
        isHighRisk: true,
      },
    });

    if (highRiskJobs > 0) {
      const highRiskDeduction = Math.min(highRiskJobs * 3, 15);
      riskScore -= highRiskDeduction;
      riskDetails.push(`高风险岗位：${highRiskJobs}个`);
      riskFactors.push({
        type: '高风险岗位',
        description: `该企业有${highRiskJobs}个岗位被标记为高风险`,
        score: -highRiskDeduction,
      });
    }

    // 5. 计算岗位驳回率（避免与审核驳回次数重复计算，只计算历史驳回率）
    const [totalSubmitted, rejectedJobs] = await Promise.all([
      prisma.job.count({
        where: {
          companyId,
          status: { in: [JobStatus.APPROVED, JobStatus.REJECTED] },
        },
      }),
      prisma.job.count({
        where: {
          companyId,
          status: JobStatus.REJECTED,
        },
      }),
    ]);

    if (totalSubmitted > 0) {
      const rejectRate = rejectedJobs / totalSubmitted;
      if (rejectRate > 0.5) {
        // 驳回率超过50%，扣20分
        riskScore -= 20;
        riskDetails.push(`岗位驳回率过高：${(rejectRate * 100).toFixed(1)}%`);
        riskFactors.push({
          type: '驳回率过高',
          description: `岗位驳回率达到${(rejectRate * 100).toFixed(1)}%，超过50%`,
          score: -20,
        });
      } else if (rejectRate > 0.3) {
        // 驳回率30-50%，扣10分
        riskScore -= 10;
        riskDetails.push(`岗位驳回率较高：${(rejectRate * 100).toFixed(1)}%`);
        riskFactors.push({
          type: '驳回率较高',
          description: `岗位驳回率达到${(rejectRate * 100).toFixed(1)}%，超过30%`,
          score: -10,
        });
      }
    }

    // 6. 检查学校认证状态
    if (!company.verifiedBySchool) {
      // 未认证扣8分（提高权重）
      riskScore -= 8;
      riskDetails.push('未通过学校认证');
      riskFactors.push({
        type: '未认证',
        description: '该企业尚未通过学校认证',
        score: -8,
      });
    } else {
      // 已认证加10分（但不能超过100分）
      const bonus = Math.min(10, 100 - riskScore);
      riskScore = Math.min(100, riskScore + 10);
      if (bonus > 0) {
        riskFactors.push({
          type: '已认证',
          description: '该企业已通过学校认证',
          score: +bonus,
        });
      }
    }

    // 7. 统计近期风险行为（最近30天，每次驳回扣4分，最高扣20分）
    // 注意：这里只统计30天内的驳回，与历史驳回的时间衰减不重复
    const recentRejectedReviews = allRejectedReviews.filter(
      review => review.reviewedAt && review.reviewedAt >= thirtyDaysAgo
    );

    if (recentRejectedReviews.length > 0) {
      let recentDeduction = recentRejectedReviews.length * 4;
      // 认证减震：已认证企业扣分减半
      if (company.verifiedBySchool) {
        recentDeduction = Math.ceil(recentDeduction / 2);
      }
      recentDeduction = Math.min(recentDeduction, 20); // 最多扣20分
      riskScore -= recentDeduction;
      riskDetails.push(`近期风险行为：最近30天内有${recentRejectedReviews.length}个岗位被驳回`);
      riskFactors.push({
        type: '近期风险',
        description: `最近30天内有${recentRejectedReviews.length}个岗位被审核驳回`,
        score: -recentDeduction,
      });
    }

    // 8. 正向加分机制
    // 8.1 检查高风险岗位整改情况（高风险岗位整改后重新审核通过，+2分/岗）
    // 查找曾经是高风险但现在不是高风险且已审核通过的岗位
    const allJobs = await prisma.job.findMany({
      where: {
        companyId,
        status: JobStatus.APPROVED,
      },
      include: {
        reviews: {
          where: {
            status: ReviewStatus.APPROVED,
            reviewedAt: {
              gte: thirtyDaysAgo,
            },
          },
          orderBy: {
            reviewedAt: 'desc',
          },
          take: 1,
        },
      },
    });

    // 统计最近30天内审核通过且当前不是高风险的岗位（可能是从高风险整改的）
    let highRiskJobsFixed = 0;
    for (const job of allJobs) {
      if (!job.isHighRisk && job.reviews.length > 0) {
        // 如果岗位当前不是高风险，且最近有审核通过记录，可能是整改后的
        highRiskJobsFixed++;
      }
    }

    if (highRiskJobsFixed > 0) {
      const fixBonus = Math.min(highRiskJobsFixed * 2, 10); // 最多加10分
      riskScore = Math.min(100, riskScore + fixBonus);
      riskDetails.push(`高风险岗位整改：${highRiskJobsFixed}个高风险岗位已整改并通过审核`);
      riskFactors.push({
        type: '风险修复',
        description: `${highRiskJobsFixed}个高风险岗位已整改并通过审核`,
        score: +fixBonus,
      });
    }

    // 8.2 连续30天无任何驳回记录，+5分
    if (recentRejectedReviews.length === 0 && allRejectedReviews.length > 0) {
      // 有历史驳回记录，但最近30天没有
      const lastRejectionDate = allRejectedReviews[0]?.reviewedAt;
      if (lastRejectionDate) {
        const daysSinceLastRejection = Math.floor((now.getTime() - lastRejectionDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceLastRejection >= 30) {
          riskScore = Math.min(100, riskScore + 5);
          riskDetails.push(`持续改进：连续${daysSinceLastRejection}天无任何驳回记录`);
          riskFactors.push({
            type: '持续改进',
            description: `连续${daysSinceLastRejection}天无任何驳回记录`,
            score: +5,
          });
        }
      }
    }

    // 8.3 企业信息完善奖励（如果企业信息从缺失变为完整，通过updatedAt判断）
    // 如果企业信息完整且最近30天内有更新，可能是完善了信息
    const allFieldsComplete = completenessDeduction === 0;
    const recentlyUpdated = company.updatedAt >= thirtyDaysAgo;
    if (allFieldsComplete && recentlyUpdated && isNewCompany) {
      // 新企业且信息完整，可能是主动完善了信息
      riskScore = Math.min(100, riskScore + 5);
      riskDetails.push('信息完善：企业信息完整且及时更新');
      riskFactors.push({
        type: '信息完善',
        description: '企业信息完整且及时更新',
        score: +5,
      });
    }

    // 9. 新企业风险基线调整（新企业如果信息不完整，额外扣分）
    if (isNewCompany && completenessDeduction > 0) {
      const newCompanyPenalty = 5; // 新企业信息不完整额外扣5分
      riskScore -= newCompanyPenalty;
      riskDetails.push('新企业信息不完整：新注册企业信息不完整风险较高');
      riskFactors.push({
        type: '新企业风险',
        description: '新注册企业信息不完整，风险较高',
        score: -newCompanyPenalty,
      });
    }

    // 10. 确保分数在0-100范围内
    riskScore = Math.max(0, Math.min(100, riskScore));

    // 11. 确定风险等级
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let riskMessage = '';

    if (riskScore >= 80) {
      riskLevel = 'low';
      riskMessage = '该企业风险较低，可放心投递';
    } else if (riskScore >= 60) {
      riskLevel = 'medium';
      riskMessage = '该企业存在一定风险，建议仔细了解后再投递';
    } else {
      riskLevel = 'high';
      riskMessage = '该企业存在较高风险，请谨慎投递';
    }

    return {
      riskLevel,
      riskScore: Math.round(riskScore * 10) / 10, // 保留一位小数
      riskMessage,
      riskDetails,
      riskFactors,
    };
  } catch (error) {
    console.error('计算企业风险失败:', error);
    return null;
  }
}

