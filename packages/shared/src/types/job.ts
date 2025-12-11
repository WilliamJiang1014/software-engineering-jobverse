import { Company } from './company';

/**
 * 岗位状态枚举
 */
export enum JobStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  OFFLINE = 'OFFLINE',
}

/**
 * 岗位信息
 */
export interface Job {
  id: string;
  companyId: string;
  title: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  tags: string[];
  status: JobStatus;
  expiresAt?: Date; // 岗位有效期（BR-02 要求）
  createdAt: Date;
  updatedAt: Date;
  company?: Company;
}

/**
 * 创建岗位请求
 */
export interface CreateJobRequest {
  title: string;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  tags?: string[];
  expiresAt?: Date; // 岗位有效期（FR-JOB-01, BR-02 要求）
}

/**
 * 更新岗位请求
 */
export interface UpdateJobRequest {
  title?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  description?: string;
  requirements?: string;
  tags?: string[];
  status?: JobStatus;
  expiresAt?: Date; // 岗位有效期
}

/**
 * 岗位搜索查询
 */
export interface JobSearchQuery {
  keyword?: string;
  location?: string;
  salaryMin?: number;
  salaryMax?: number;
  tags?: string[];
  companyId?: string;
  status?: JobStatus;
  page?: number;
  limit?: number;
}


