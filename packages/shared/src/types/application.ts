import { Job } from './job';
import { User } from './user';

/**
 * 投递状态枚举
 */
export enum ApplicationStatus {
  APPLIED = 'APPLIED',
  VIEWED = 'VIEWED',
  INTERVIEWING = 'INTERVIEWING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

/**
 * 投递记录
 */
export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  resume?: string;
  coverLetter?: string;
  appliedAt: Date;
  updatedAt: Date;
  user?: User;
  job?: Job;
}

/**
 * 创建投递请求
 */
export interface CreateApplicationRequest {
  jobId: string;
  resume?: string;
  coverLetter?: string;
}

/**
 * 更新投递状态请求
 */
export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  feedback?: string;
}


