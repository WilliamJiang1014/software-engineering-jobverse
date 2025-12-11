import { Router, Request, Response } from 'express';
import { HealthCheckResponse } from '@jobverse/shared';

const router: Router = Router();
const startTime = Date.now();

router.get('/', (_req: Request, res: Response) => {
  const response: HealthCheckResponse = {
    status: 'ok',
    service: 'review-service',
    timestamp: new Date().toISOString(),
    uptime: Math.floor((Date.now() - startTime) / 1000),
    version: '1.0.0',
  };

  res.json(response);
});

export { router as healthRouter };

