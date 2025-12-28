/**
 * 简历相关类型定义
 */

export interface Resume {
  id: string;
  userId: string;
  name: string;        // 简历名称，如"技术岗简历"
  content: string;     // 简历内容或链接
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateResumeDTO {
  name: string;
  content: string;
  isDefault?: boolean;
}

export interface UpdateResumeDTO {
  name?: string;
  content?: string;
}

