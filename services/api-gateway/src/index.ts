import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createProxyMiddleware } from 'http-proxy-middleware';
import rateLimit from 'express-rate-limit';
import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { healthRouter } from './routes/health';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

// 基础中间件
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true,
}));
app.use(morgan('combined'));
app.use(express.json());

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

// 代理到用户服务（认证相关不需要鉴权）
app.use('/api/v1/auth', createProxyMiddleware({
  target: serviceUrls.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/auth': '/api/v1/auth' },
}));

// 代理到用户服务（用户信息需要鉴权）
app.use('/api/v1/users', authMiddleware, createProxyMiddleware({
  target: serviceUrls.user,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/users': '/api/v1/users' },
}));

// 代理到岗位服务
app.use('/api/v1/jobs', createProxyMiddleware({
  target: serviceUrls.job,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/jobs': '/api/v1/jobs' },
}));

// 代理到搜索服务
app.use('/api/v1/search', createProxyMiddleware({
  target: serviceUrls.search,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/search': '/api/v1/search' },
}));

// 代理到企业端API（需要鉴权）
app.use('/api/v1/employer', authMiddleware, createProxyMiddleware({
  target: serviceUrls.job,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/employer': '/api/v1/employer' },
}));

// 代理到审核服务（需要鉴权）
app.use('/api/v1/admin/review', authMiddleware, createProxyMiddleware({
  target: serviceUrls.review,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/admin/review': '/api/v1/review' },
}));

// 代理到风控服务（需要鉴权）
app.use('/api/v1/admin/risk', authMiddleware, createProxyMiddleware({
  target: serviceUrls.risk,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/admin/risk': '/api/v1/risk' },
}));

// 代理到审计服务（需要鉴权）
app.use('/api/v1/admin/audit', authMiddleware, createProxyMiddleware({
  target: serviceUrls.audit,
  changeOrigin: true,
  pathRewrite: { '^/api/v1/admin/audit': '/api/v1/audit' },
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


