import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { userRouter } from './routes/user';
import { healthRouter } from './routes/health';
import notificationRouter from './routes/notifications';
import resumeRouter from './routes/resumes';
import { errorHandler } from './middleware/error';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 3001;

// 基础中间件
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// 路由
app.use('/health', healthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/notifications', notificationRouter);
app.use('/api/v1/resumes', resumeRouter);

// 错误处理
app.use(errorHandler);

// 404处理
app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 启动服务
app.listen(PORT, () => {
  console.log(`🚀 用户服务启动成功，端口: ${PORT}`);
});


