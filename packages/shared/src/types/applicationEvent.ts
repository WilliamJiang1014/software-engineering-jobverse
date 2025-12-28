/**
 * 投递事件/时间线相关类型定义
 */

import { UserRole } from './user';

export enum ApplicationEventType {
  APPLIED = 'APPLIED',                     // 已投递
  VIEWED = 'VIEWED',                       // 已查看
  STATUS_CHANGED = 'STATUS_CHANGED',       // 状态变更
  INTERVIEW_CREATED = 'INTERVIEW_CREATED', // 面试邀请创建
  INTERVIEW_RESPONDED = 'INTERVIEW_RESPONDED', // 面试邀请响应
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED', // 面试取消
  REVIEW_RESULT = 'REVIEW_RESULT',         // 审核结果
}

export interface ApplicationEvent {
  id: string;
  applicationId: string;
  type: ApplicationEventType;
  actorRole: UserRole;
  actorId?: string;
  metadata?: Record<string, any>; // 如 { fromStatus, toStatus, interviewId, comment, etc. }
  createdAt: Date;
}

export interface CreateApplicationEventDTO {
  applicationId: string;
  type: ApplicationEventType;
  actorRole: UserRole;
  actorId?: string;
  metadata?: Record<string, any>;
}

