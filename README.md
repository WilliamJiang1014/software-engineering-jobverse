# JobVerse

**面向高校学生的智能一体化招聘平台**

## 项目概述

JobVerse 是一个基于微服务架构的现代化招聘平台，专门为高校学生和企业提供便捷的求职招聘服务。

## 技术栈

### 前端
- **Next.js 13** - React 框架（SSR/SSG）
- **React 18** - UI 库
- **TypeScript 5** - 类型安全
- **Ant Design 5** - UI 组件库
- **Axios** - HTTP 客户端
- **SWR** - 数据获取与缓存

### 后端
- **Node.js 18** - 运行时
- **Express 4** - Web 框架
- **TypeScript 5** - 类型安全
- **Prisma 5** - ORM
- **PostgreSQL 15** - 主数据库
- **Redis 7** - 缓存

### 部署
- **Docker** - 容器化
- **Docker Compose** - 容器编排
- **Nginx** - 反向代理

## 项目结构

```
Jobverse/
├── packages/
│   └── shared/              # 共享类型和工具库
├── services/
│   ├── api-gateway/         # API 网关 (3000)
│   ├── user-service/        # 用户服务 (3001)
│   ├── job-service/         # 岗位服务 (3002)
│   ├── search-service/      # 搜索服务 (3003)
│   ├── review-service/      # 审核服务 (3004)
│   ├── risk-service/        # 风控服务 (3005)
│   └── audit-service/       # 审计服务 (3006)
├── apps/
│   └── frontend/            # 前端应用 (8080)
├── prisma/
│   └── schema.prisma        # 数据库模型定义
├── nginx/
│   └── nginx.conf           # Nginx 配置
├── docker-compose.yml       # 开发环境配置
├── docker-compose.prod.yml  # 生产环境配置
└── env.example              # 环境变量模板
```

## 微服务说明

| 服务名称 | 端口 | 职责 |
|---------|------|------|
| API Gateway | 3000 | 统一入口、路由转发、鉴权、限流 |
| 用户服务 | 3001 | 用户认证、用户管理、权限管理 |
| 岗位服务 | 3002 | 岗位CRUD、投递管理、收藏管理 |
| 搜索服务 | 3003 | 职位搜索、全文检索、结果排序 |
| 审核服务 | 3004 | 岗位审核、Verified标识管理 |
| 风控服务 | 3005 | 敏感词检测、重复检测、内容审核 |
| 审计服务 | 3006 | 操作日志、审计记录、统计分析 |
| 前端应用 | 8080 | Next.js 前端应用 |

## 快速开始

### 前置条件

- Docker 24.x 或更高版本
- Docker Compose 2.x 或更高版本
- Node.js 18+ (可选，用于本地开发)
- pnpm 8+ (可选，用于本地开发)

### 1. 克隆项目并配置环境变量

```bash
# 进入项目目录
cd Jobverse

# 复制环境变量配置文件
cp env.example .env
```

### 2. 使用 Docker Compose 启动（推荐）

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定服务日志
docker-compose logs -f api-gateway
```

### 3. 访问应用

- **前端应用**: http://localhost:8080
- **API Gateway**: http://localhost:3000
- **API 健康检查**: http://localhost:3000/health

### 4. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（清除数据库数据）
docker-compose down -v
```

## 开发指南

### 本地开发（不使用 Docker）

如果需要在本地进行开发调试，可以单独运行各个服务：

```bash
# 安装依赖
pnpm install

# 构建共享包
pnpm build:shared

# 启动数据库和 Redis（使用 Docker）
docker-compose up -d postgres redis

# 进入特定服务目录开发
cd services/user-service
pnpm dev
```

### 数据库迁移

```bash
# 生成迁移文件
cd services/user-service
pnpm db:migrate

# 同步数据库
pnpm db:push

# 生成 Prisma Client
pnpm db:generate
```

## API 接口

### 认证 API
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/logout` - 用户登出
- `GET /api/v1/auth/me` - 获取当前用户

### 岗位 API
- `GET /api/v1/jobs` - 获取岗位列表
- `GET /api/v1/jobs/:id` - 获取岗位详情
- `POST /api/v1/jobs/:id/apply` - 投递岗位
- `POST /api/v1/jobs/:id/bookmark` - 收藏岗位

### 搜索 API
- `GET /api/v1/search/jobs` - 搜索岗位
- `GET /api/v1/search/suggest` - 搜索建议
- `GET /api/v1/search/hot` - 热门搜索

### 企业端 API
- `GET /api/v1/employer/jobs` - 获取发布的岗位
- `POST /api/v1/employer/jobs` - 创建岗位
- `PUT /api/v1/employer/jobs/:id` - 更新岗位
- `POST /api/v1/employer/jobs/:id/submit` - 提交审核

### 管理端 API
- `GET /api/v1/admin/review/pending` - 待审核列表
- `POST /api/v1/admin/review/jobs/:id` - 审核岗位
- `GET /api/v1/admin/audit/logs` - 审计日志

## 生产环境部署

```bash
# 配置生产环境变量
cp env.example .env.prod
# 编辑 .env.prod 填入生产环境配置

# 启动生产环境
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 项目团队

JobVerse 开发团队

## 许可证

MIT License

