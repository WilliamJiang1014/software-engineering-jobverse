/**
 * 面试相关类型定义
 */

export enum InterviewMode {
  ONLINE = 'ONLINE',   // 线上
  OFFLINE = 'OFFLINE', // 线下
}

export enum InterviewStatus {
  PENDING = 'PENDING',                     // 待确认
  CONFIRMED = 'CONFIRMED',                 // 已确认
  DECLINED = 'DECLINED',                   // 已拒绝
  CANCELLED = 'CANCELLED',                 // 已取消
  RESCHEDULE_REQUESTED = 'RESCHEDULE_REQUESTED', // 改期请求中
}

export interface Interview {
  id: string;
  applicationId: string;
  employerId?: string;
  scheduledAt: Date;
  mode: InterviewMode;
  locationOrLink?: string;
  note?: string;
  status: InterviewStatus;
  studentComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateInterviewDTO {
  scheduledAt: string | Date;
  mode: InterviewMode;
  locationOrLink?: string;
  note?: string;
}

export interface UpdateInterviewDTO {
  scheduledAt?: string | Date;
  mode?: InterviewMode;
  locationOrLink?: string;
  note?: string;
  status?: InterviewStatus;
}

export interface RespondInterviewDTO {
  status: 'CONFIRMED' | 'DECLINED' | 'RESCHEDULE_REQUESTED';
  studentComment?: string;
}

