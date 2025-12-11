import { Job } from './job';
import { User } from './user';

/**
 * 审核状态枚举
 */
export enum ReviewStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED',
}

/**
 * 审核记录
 */
export interface Review {
  id: string;
  jobId: string;
  reviewerId: string;
  status: ReviewStatus;
  comment?: string;
  reviewedAt?: Date;
  createdAt: Date;
  job?: Job;
  reviewer?: User;
}

/**
 * 提交审核请求
 */
export interface SubmitReviewRequest {
  status: ReviewStatus;
  comment?: string;
}

/**
 * 风控规则类型
 */
export enum RiskRuleType {
  SENSITIVE_WORD = 'sensitive_word',
  DUPLICATE_DETECTION = 'duplicate_detection',
  CONTENT_QUALITY = 'content_quality',
}

/**
 * 风控规则
 */
export interface RiskRule {
  id: string;
  ruleType: RiskRuleType;
  content: string;
  action: 'block' | 'mark' | 'downgrade';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 审计日志
 */
export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  createdAt: Date;
}


