import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error('Review Service Error:', err);

  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器内部错误' 
    : err.message;

  res.status(statusCode).json({
    code: statusCode,
    message,
    error: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};

