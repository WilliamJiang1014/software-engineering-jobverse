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
  feedback?: string;        // 企业反馈（对学生可见）
  employerNote?: string;    // 企业内部备注（仅企业可见）
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
  resumeId?: string;        // 简历ID（从简历中心选择）
  resume?: string;          // 简历内容/链接（快照或直接提交）
  coverLetter?: string;
}

/**
 * 更新投递状态请求
 */
export interface UpdateApplicationStatusRequest {
  status: ApplicationStatus;
  feedback?: string;        // 企业反馈
  employerNote?: string;    // 企业内部备注
}


