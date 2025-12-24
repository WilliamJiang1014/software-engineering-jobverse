import { z } from 'zod';

/**
 * 用户注册 Schema
 */
export const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/^(?=.*[A-Za-z])(?=.*\d)/, '密码必须包含字母和数字'),
  name: z.string().min(1, '姓名不能为空').max(50, '姓名最多50个字符'),
  role: z.enum(['STUDENT', 'EMPLOYER']).optional(),
});

/**
 * 用户登录 Schema
 */
export const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(1, '密码不能为空'),
});

/**
 * 创建岗位 Schema
 */
export const createJobSchema = z.object({
  title: z.string().min(1, '职位名称不能为空').max(100, '职位名称最多100个字符'),
  location: z.string().min(1, '工作地点不能为空'),
  salaryMin: z.number().int().positive().optional(),
  salaryMax: z.number().int().positive().optional(),
  description: z.string().max(5000, '职位描述最多5000个字符').optional(),
  requirements: z.string().max(3000, '任职要求最多3000个字符').optional(),
  tags: z.array(z.string()).max(10, '标签最多10个').optional(),
  expiresAt: z.coerce.date().optional(), // 岗位有效期（FR-JOB-01, BR-02 要求）
});

/**
 * 更新岗位 Schema
 */
export const updateJobSchema = createJobSchema.partial();

/**
 * 岗位搜索 Schema
 */
export const jobSearchSchema = z.object({
  keyword: z.string().optional(),
  location: z.string().optional(),
  salaryMin: z.coerce.number().int().positive().optional(),
  salaryMax: z.coerce.number().int().positive().optional(),
  tags: z.array(z.string()).optional(),
  companyId: z.string().optional(),
  sortBy: z.enum(['default', 'time', 'salary']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

/**
 * 创建企业 Schema
 */
export const createCompanySchema = z.object({
  name: z.string().min(1, '企业名称不能为空').max(100, '企业名称最多100个字符'),
  industry: z.string().optional(),
  scale: z.string().optional(),
  location: z.string().optional(),
  description: z.string().max(2000, '企业介绍最多2000个字符').optional(),
  logo: z.string().url().optional(),
  website: z.string().url().optional(),
  contactPerson: z.string().optional(),
  contactPhone: z.string().optional(),
  contactEmail: z.string().email('邮箱格式不正确').optional().or(z.literal('')),
});

/**
 * 更新企业 Schema
 */
export const updateCompanySchema = createCompanySchema.partial();

/**
 * 审核 Schema
 */
export const reviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'RETURNED']),
  comment: z.string().max(500, '审核意见最多500个字符').optional(),
});

/**
 * 分页 Schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

