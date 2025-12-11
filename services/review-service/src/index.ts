import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { reviewRouter } from './routes/review';
import { healthRouter } from './routes/health';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const PORT = process.env.REVIEW_SERVICE_PORT || 3004;

app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/health', healthRouter);
app.use('/api/v1/review', reviewRouter);

app.use(errorHandler);

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.listen(PORT, () => {
  console.log(`🚀 审核服务启动成功，端口: ${PORT}`);
});

