import { Router, Request, Response } from 'express';
import { HealthCheckResponse } from '@jobverse/shared';

const router: Router = Router();
const startTime = Date.now();

/**
 * 健康检查接口
 */
router.get('/', (_req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
  };

  res.json(response);
});

/**
 * 详细健康检查（包含依赖服务状态）
 */
router.get('/detail', async (_req: Request, res: Response) => {
  const services = {
    'user-service': process.env.USER_SERVICE_URL || 'http://user-service:3001',
    'job-service': process.env.JOB_SERVICE_URL || 'http://job-service:3002',
    'search-service': process.env.SEARCH_SERVICE_URL || 'http://search-service:3003',
    'review-service': process.env.REVIEW_SERVICE_URL || 'http://review-service:3004',
    'risk-service': process.env.RISK_SERVICE_URL || 'http://risk-service:3005',
    'audit-service': process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006',
  };

  // 简单返回服务配置，实际生产中应该检查各服务健康状态
  res.json({
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
    dependencies: services,
  });
});

export { router as healthRouter };


