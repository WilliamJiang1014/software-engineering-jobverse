import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '@jobverse/shared';

/**
 * 可选认证中间件
 * 如果请求包含有效的 token，则解析并设置用户信息
 * 如果没有 token 或 token 无效，则继续执行（不报错）
 */
export const optionalAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // 没有 token，继续执行
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'default_secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // 将用户信息附加到请求对象
    req.user = decoded;
    
    // 将用户信息添加到请求头，传递给下游服务
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    
    next();
  } catch (error) {
    // Token 无效，但不报错，继续执行（作为未登录用户处理）
    next();
  }
};

