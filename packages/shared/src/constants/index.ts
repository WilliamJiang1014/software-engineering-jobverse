/**
 * HTTP 状态码
 */
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

/**
 * 服务名称
 */
export const ServiceNames = {
  API_GATEWAY: 'api-gateway',
  USER_SERVICE: 'user-service',
  JOB_SERVICE: 'job-service',
  SEARCH_SERVICE: 'search-service',
  REVIEW_SERVICE: 'review-service',
  RISK_SERVICE: 'risk-service',
  AUDIT_SERVICE: 'audit-service',
} as const;

/**
 * 默认分页配置
 */
export const PaginationDefaults = {
  PAGE: 1,
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

/**
 * JWT 配置
 */
export const JwtConfig = {
  ACCESS_TOKEN_EXPIRES_IN: '1h',
  REFRESH_TOKEN_EXPIRES_IN: '7d',
} as const;

/**
 * 行业列表
 */
export const Industries = [
  '互联网/IT',
  '金融/银行',
  '教育/培训',
  '房地产/建筑',
  '医疗/健康',
  '制造业',
  '零售/电商',
  '咨询/服务',
  '媒体/文化',
  '政府/非营利',
  '其他',
] as const;

/**
 * 企业规模列表
 */
export const CompanyScales = [
  '1-50人',
  '51-200人',
  '201-500人',
  '501-1000人',
  '1000人以上',
] as const;


