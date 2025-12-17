/**
 * 用户角色枚举
 */
export enum UserRole {
  STUDENT = 'STUDENT',
  EMPLOYER = 'EMPLOYER',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  PLATFORM_ADMIN = 'PLATFORM_ADMIN',
}

/**
 * 用户基础信息
 */
export interface User {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户注册请求
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
}

/**
 * 用户登录请求
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

/**
 * JWT Payload
 */
export interface JwtPayload {
  userId: string;
  role: UserRole;
  type?: 'refresh';
  iat: number;
  exp: number;
}


