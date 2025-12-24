import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { optionalAuthMiddleware } from './middleware/optionalAuth';
import { errorHandler } from './middleware/error';
import { healthRouter } from './routes/health';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // 允许没有 origin 的请求（如 curl 或 server-to-server）
    if (!origin) return callback(null, true);
    
    // 开发环境允许 localhost 和 127.0.0.1
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    // 生产环境严格检查
    if (origin === (process.env.FRONTEND_URL || 'http://localhost:8080')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(morgan('combined'));
// 解析 JSON 请求体，配合 onProxyReq 重新注入，避免代理丢失 body
app.use(express.json());

// 代理请求体处理函数 - 不再需要，直接流式透传
// const onProxyReq = (proxyReq: any, req: any, _res: any) => {
//   if (req.body && Object.keys(req.body).length > 0) {
//     const bodyData = JSON.stringify(req.body);
//     // 如果是 POST/PUT/PATCH 请求，重新写入 body
//     if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
//       proxyReq.setHeader('Content-Type', 'application/json');
//       proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
//       proxyReq.write(bodyData);
//     }
//   }
// };

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100, // 限制100次请求
  message: { code: 429, message: '请求过于频繁，请稍后再试' },
});
app.use(limiter);

// 健康检查路由
app.use('/health', healthRouter);

// 服务代理配置
const serviceUrls = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  job: process.env.JOB_SERVICE_URL || 'http://job-service:3002',
  search: process.env.SEARCH_SERVICE_URL || 'http://search-service:3003',
  review: process.env.REVIEW_SERVICE_URL || 'http://review-service:3004',
  risk: process.env.RISK_SERVICE_URL || 'http://risk-service:3005',
  audit: process.env.AUDIT_SERVICE_URL || 'http://audit-service:3006',
};

const onProxyReq = (proxyReq: any, req: any) => {
  if (!req.body || Object.keys(req.body).length === 0) {
    return;
  }

  const contentType = req.headers['content-type'] || '';
  if (typeof contentType === 'string' && contentType.includes('application/json')) {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
};

// 代理到用户服务（认证相关不需要鉴权）
app.use('/api/v1/auth', createProxyMiddleware({
  target: serviceUrls.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/api/v1/auth' },
  onProxyReq,
}));

// 代理到用户服务（用户信息需要鉴权）
app.use('/api/v1/users', authMiddleware, createProxyMiddleware({
  target: serviceUrls.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/users': '/api/v1/users' },
  onProxyReq,
}));

// 创建岗位服务的代理中间件
const jobProxy = createProxyMiddleware({
  target: serviceUrls.job,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/jobs': '/api/v1/jobs' },
  onProxyReq,
});

// 代理到岗位服务（条件认证）
app.use('/api/v1/jobs', (req, res, next) => {
  // 检查是否是收藏或投递接口（POST/DELETE /api/v1/jobs/:id/bookmark 或 POST /api/v1/jobs/:id/apply）
  const path = req.path;
  const isBookmark = path.match(/\/[^/]+\/bookmark$/);
  const isApply = path.match(/\/[^/]+\/apply$/);
  
  if ((isBookmark || isApply) && (req.method === 'POST' || req.method === 'DELETE')) {
    // 需要认证的接口，先执行认证中间件
    return authMiddleware(req, res, (err) => {
      if (err) return next(err);
      // 认证通过后，执行代理
      jobProxy(req, res, next);
    });
  }
  // 公开接口，但如果有 token 则解析并传递用户信息（用于返回收藏状态）
  optionalAuthMiddleware(req, res, () => {
    jobProxy(req, res, next);
  });
});

// 代理到投递和收藏服务（需要鉴权）
app.use('/api/v1/applications', authMiddleware, createProxyMiddleware({
  target: serviceUrls.job,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/applications': '/api/v1/applications' },
}));

app.use('/api/v1/bookmarks', authMiddleware, createProxyMiddleware({
  target: serviceUrls.job,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/bookmarks': '/api/v1/bookmarks' },
}));

// 代理到搜索服务
app.use('/api/v1/search', createProxyMiddleware({
  target: serviceUrls.search,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/search': '/api/v1/search' },
  onProxyReq,
}));

// 代理到企业端API（需要鉴权）
app.use('/api/v1/employer', authMiddleware, createProxyMiddleware({
  target: serviceUrls.job,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/employer': '/api/v1/employer' },
  onProxyReq,
}));

// 代理到审核服务（需要鉴权）
app.use('/api/v1/admin/review', authMiddleware, createProxyMiddleware({
  target: serviceUrls.review,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/admin/review': '/api/v1/review' },
  onProxyReq,
}));

// 代理到风控服务（需要鉴权）
app.use('/api/v1/admin/risk', authMiddleware, createProxyMiddleware({
  target: serviceUrls.risk,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/admin/risk': '/api/v1/risk' },
  onProxyReq,
}));

// 代理到风控检测服务（公开接口，岗位提交时调用）
app.use('/api/v1/risk', createProxyMiddleware({
  target: serviceUrls.risk,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/risk': '/api/v1/risk' },
  onProxyReq,
}));

// 代理到审计服务（需要鉴权）
app.use('/api/v1/admin/audit', authMiddleware, createProxyMiddleware({
  target: serviceUrls.audit,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/admin/audit': '/api/v1/audit' },
  onProxyReq,
}));

// 错误处理
app.use(errorHandler);

// 404处理
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 API Gateway 服务启动成功，端口: ${PORT}`);
  console.log(`📡 服务代理配置:`);
  console.log(`   - 用户服务: ${serviceUrls.user}`);
  console.log(`   - 岗位服务: ${serviceUrls.job}`);
  console.log(`   - 搜索服务: ${serviceUrls.search}`);
  console.log(`   - 审核服务: ${serviceUrls.review}`);
  console.log(`   - 风控服务: ${serviceUrls.risk}`);
  console.log(`   - 审计服务: ${serviceUrls.audit}`);
});
