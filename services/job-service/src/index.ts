import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { jobRouter } from './routes/job';
import { employerRouter } from './routes/employer';
import { companyRouter } from './routes/company';
import { applicationRouter } from './routes/application';
import { bookmarkRouter } from './routes/bookmarks';
import { healthRouter } from './routes/health';
import interviewRouter from './routes/interviews';
import applicationEventRouter from './routes/applicationEvents';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const PORT = process.env.JOB_SERVICE_PORT || 3002;

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// 路由
app.use('/health', healthRouter);
app.use('/api/v1/jobs', jobRouter);
app.use('/api/v1/employer', employerRouter);
app.use('/api/v1/companies', companyRouter);
app.use('/api/v1/applications', applicationRouter);
app.use('/api/v1/bookmarks', bookmarkRouter);
app.use('/api/v1', interviewRouter); // 面试相关路由（包含企业端和学生端）
app.use('/api/v1', applicationEventRouter); // 投递事件/时间线路由
// 注意：更新候选人状态接口在 employer 路由中，路径为 /api/v1/employer/applications/:id

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`🚀 岗位服务启动成功，端口: ${PORT}`);
});


