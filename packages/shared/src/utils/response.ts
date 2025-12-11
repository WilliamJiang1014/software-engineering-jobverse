import { ApiResponse, PaginatedResponse, Pagination } from '../types';

/**
 * 创建成功响应
 */
export function successResponse<T>(data: T, message = 'success'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data,
  };
}

/**
 * 创建分页响应
 */
export function paginatedResponse<T>(
  items: T[],
  page: number,
  limit: number,
  total: number
): ApiResponse<PaginatedResponse<T>> {
  const totalPages = Math.ceil(total / limit);
  const pagination: Pagination = {
    page,
    limit,
    total,
    totalPages,
  };

  return {
    code: 200,
    message: 'success',
    data: {
      items,
      pagination,
    },
  };
}

/**
 * 创建错误响应
 */
export function errorResponse(code: number, message: string, error?: string): ApiResponse {
  return {
    code,
    message,
    error,
  };
}

/**
 * 常用错误响应
 */
export const ErrorResponses = {
  badRequest: (message = '参数错误', error?: string) => errorResponse(400, message, error),
  unauthorized: (message = '未授权') => errorResponse(401, message),
  forbidden: (message = '无权限') => errorResponse(403, message),
  notFound: (message = '资源不存在') => errorResponse(404, message),
  conflict: (message = '资源冲突') => errorResponse(409, message),
  internalError: (message = '服务器错误') => errorResponse(500, message),
};


