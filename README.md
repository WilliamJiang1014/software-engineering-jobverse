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
- **Prisma 6** - ORM（已升级，支持 OpenSSL 3.x）
- **PostgreSQL 15** - 主数据库
- **Redis 7** - 缓存
- **JWT** - 身份认证
- **bcrypt** - 密码加密

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

### 3. 初始化数据库（首次运行）

```bash
# 创建数据库表结构
DATABASE_URL="postgresql://admin:jobverse_password_2024@localhost:5432/jobverse" pnpm db:push

# 生成 Prisma Client
DATABASE_URL="postgresql://admin:jobverse_password_2024@localhost:5432/jobverse" pnpm db:generate

# 初始化种子数据（创建测试账号）
DATABASE_URL="postgresql://admin:jobverse_password_2024@localhost:5432/jobverse" pnpm db:seed
```

### 4. 访问应用

- **前端应用**: http://localhost:8080
- **API Gateway**: http://localhost:3000
- **API 健康检查**: http://localhost:3000/health
- **用户服务直接访问**: http://localhost:3001

### 5. 测试登录功能

```bash
# 测试学生登录
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@jobverse.test","password":"jobverse123"}'

# 测试企业用户登录
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"employer1@jobverse.test","password":"jobverse123"}'
```

### 6. 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（清除数据库数据）
docker-compose down -v
```

## 开发指南

### 快速启动（完整流程）

```bash
# 1. 启动所有服务
docker-compose up -d

# 2. 等待服务启动（约 10-15 秒）
sleep 10

# 3. 初始化数据库（首次运行）
DATABASE_URL="postgresql://admin:jobverse_password_2024@localhost:5432/jobverse" pnpm db:push
DATABASE_URL="postgresql://admin:jobverse_password_2024@localhost:5432/jobverse" pnpm db:generate
DATABASE_URL="postgresql://admin:jobverse_password_2024@localhost:5432/jobverse" pnpm db:seed

# 4. 测试登录功能
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@jobverse.test","password":"jobverse123"}'
```

## 开发进度

### ✅ 已完成功能

- **数据库初始化**
  - ✅ Prisma Schema 定义完成
  - ✅ 种子数据脚本完成（7个用户、3个企业、8个岗位等）
  - ✅ 数据库迁移和初始化流程完善

- **用户认证服务**
  - ✅ 用户登录（真实数据库查询、密码验证、JWT 生成）
  - ✅ 用户注册（邮箱唯一性校验、密码加密）
  - ✅ Token 刷新（验证 refreshToken、生成新 Token）
  - ✅ 用户登出
  - ✅ 获取当前用户信息（`/api/v1/auth/me`）
  - ✅ JWT Token 生成和验证
  - ✅ 多角色支持（STUDENT, EMPLOYER, SCHOOL_ADMIN, PLATFORM_ADMIN）

- **前端框架**
  - ✅ 统一登录页面（根据角色自动跳转）
  - ✅ 三端布局框架（学生端、企业端、管理端）
  - ✅ 首页职位搜索入口（公开访问）
  - ✅ 学生端个人中心（求职概览、投递记录、收藏、个人资料）
  - ✅ 企业端管理框架（岗位管理、候选人、企业信息）
  - ✅ 管理端审核框架（岗位审核、认证管理、统计）

- **基础设施**
  - ✅ Docker 容器化部署
  - ✅ 微服务架构搭建
  - ✅ API Gateway 路由配置
  - ✅ Prisma 6.x 升级（解决 OpenSSL 3.x 兼容性）

### 🚧 开发中功能

- 首页岗位搜索对接后端
- 岗位详情查看
- 投递和收藏功能
- 企业端岗位管理真实数据
- 学校端审核功能真实数据

## API 接口

### 认证 API

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `POST /api/v1/auth/login` | POST | ✅ 已实现 | 用户登录（支持所有角色） |
| `GET /api/v1/auth/me` | GET | ✅ 已实现 | 获取当前用户信息（需要 JWT） |
| `POST /api/v1/auth/register` | POST | ✅ 已实现 | 用户注册 |
| `POST /api/v1/auth/logout` | POST | ✅ 已实现 | 用户登出 |
| `POST /api/v1/auth/refresh` | POST | ✅ 已实现 | 刷新 Token |

### 岗位 API

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `GET /api/v1/jobs` | GET | 🚧 Mock | 获取岗位列表 |
| `GET /api/v1/jobs/:id` | GET | 🚧 Mock | 获取岗位详情 |
| `POST /api/v1/jobs/:id/apply` | POST | 🚧 Mock | 投递岗位 |
| `POST /api/v1/jobs/:id/bookmark` | POST | 🚧 Mock | 收藏岗位 |

### 搜索 API

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `GET /api/v1/search/jobs` | GET | 🚧 Mock | 搜索岗位 |
| `GET /api/v1/search/suggest` | GET | 🚧 Mock | 搜索建议 |
| `GET /api/v1/search/hot` | GET | 🚧 Mock | 热门搜索 |

### 企业端 API

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `GET /api/v1/employer/jobs` | GET | 🚧 Mock | 获取发布的岗位 |
| `POST /api/v1/employer/jobs` | POST | 🚧 Mock | 创建岗位 |
| `PUT /api/v1/employer/jobs/:id` | PUT | 🚧 Mock | 更新岗位 |
| `POST /api/v1/employer/jobs/:id/submit` | POST | 🚧 Mock | 提交审核 |

### 管理端 API

| 接口 | 方法 | 状态 | 说明 |
|------|------|------|------|
| `GET /api/v1/admin/review/pending` | GET | 🚧 Mock | 待审核列表 |
| `POST /api/v1/admin/review/jobs/:id` | POST | 🚧 Mock | 审核岗位 |
| `GET /api/v1/admin/audit/logs` | GET | 🚧 Mock | 审计日志 |

**图例说明**：
- ✅ 已实现 - 功能已完成并测试通过
- 🚧 Mock - 接口已定义但使用模拟数据，待实现真实逻辑

## 生产环境部署

```bash
# 配置生产环境变量
cp env.example .env.prod
# 编辑 .env.prod 填入生产环境配置

# 启动生产环境
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d
```

## 测试账号

所有测试账号统一密码：`jobverse123`

| 角色 | 邮箱 | 说明 |
|------|------|------|
| 学生 | `student@jobverse.test` | 主测试账号 |
| 企业 | `employer1@jobverse.test` | XX科技有限公司 |
| 企业 | `employer2@jobverse.test` | YY互联网公司 |
| 学校管理员 | `school@jobverse.test` | 就业中心 |
| 平台管理员 | `admin@jobverse.test` | 平台管理员 |

## 已知问题

- API Gateway (3000端口) 部分路由可能需要重启服务
- 建议直接访问各服务端口进行测试（如 user-service:3001）

## 更新日志

详细的更新记录请查看 [CHANGELOG.md](./CHANGELOG.md)

## 项目团队

JobVerse 开发团队

## 许可证

MIT License

