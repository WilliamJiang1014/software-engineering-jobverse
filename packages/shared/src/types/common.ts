/**
 * 通用 API 响应格式
 */
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
  error?: string;
}

/**
 * 分页信息
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: Pagination;
}

/**
 * 通用查询参数
 */
export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 健康检查响应
 */
export interface HealthCheckResponse {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  version: string;
}


