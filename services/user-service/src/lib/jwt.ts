import jwt, { SignOptions } from 'jsonwebtoken';
import { JwtPayload } from '@jobverse/shared';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * 生成 Access Token
 */
export function generateAccessToken(payload: { userId: string; role: string }): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    } as SignOptions
  );
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(payload: { userId: string; role: string }): string {
  return jwt.sign(
    {
      userId: payload.userId,
      role: payload.role,
      type: 'refresh',
    },
    JWT_SECRET,
    {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
    } as SignOptions
  );
}

/**
 * 验证 Token
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

