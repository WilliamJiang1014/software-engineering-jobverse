/**
 * 通知相关类型定义
 */

export enum NotificationType {
  APPLY_SUCCESS = 'APPLY_SUCCESS',       // 投递成功
  NEW_APPLICATION = 'NEW_APPLICATION',   // 收到新投递
  STATUS_UPDATE = 'STATUS_UPDATE',       // 状态更新
  INTERVIEW = 'INTERVIEW',               // 面试相关
  REVIEW_RESULT = 'REVIEW_RESULT',       // 审核结果
  SYSTEM = 'SYSTEM',                     // 系统通知
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  resourceType?: string;  // JOB, APPLICATION, INTERVIEW, REVIEW, etc.
  resourceId?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

export interface CreateNotificationDTO {
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  resourceType?: string;
  resourceId?: string;
}

export interface NotificationListQuery {
  isRead?: boolean;
  type?: NotificationType;
  page?: number;
  limit?: number;
}

