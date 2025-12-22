# JobVerse 下一阶段开发任务分配

---

## 📋 任务分配原则

1. **工作量均衡**：尽量让3个组员的工作量相近
2. **模块连续性**：尽量让上次负责该模块的人继续负责相关新任务
3. **排除任务**：暂时不考虑生产环境安全保护和高并发性能优化
4. **前后端配合**：**所有任务都需要前后端配合完成**，每个任务都包含后端接口开发和前端页面/功能完善

## ⚠️ 重要协作事项

### 企业详情页协作（组员B ↔ 组员C）

- **背景**：组员B负责创建企业详情页（TASK-PROFILE-01），组员C负责企业风险提示功能（TASK-PROFILE-03），两者需要在同一页面展示
- **协作建议**：
  1. 组员B先完成企业详情页基础框架，预留风险提示展示位置
  2. 企业详情接口 `GET /api/v1/companies/:id` 的响应中建议包含风险提示相关字段（或组员C提供独立接口）
  3. 组员C将风险提示设计为可复用的 React 组件，便于集成
  4. 双方在开发前沟通接口规范和组件接口，确保顺利集成

---

## 👥 任务分配详情

### 组员 A：搜索与岗位展示功能增强

**负责模块**：搜索服务、岗位查询、首页展示

#### 功能完善任务

| 任务ID | 需求编号 | 任务描述 | 优先级 | 工作量估算 | 前后端 |
|--------|---------|---------|--------|-----------|--------|
| TASK-SEARCH-01 | FR-SEARCH-04 | **搜索排序功能**：支持"综合排序/默认"、"按发布时间倒序"、"按薪资范围"三种排序方式 | P0 | 中等 | ✅ 后端+前端 |
| TASK-SEARCH-02 | FR-SEARCH-06 | **搜索关键词高亮**：在搜索结果列表中对命中的关键词进行高亮显示 | P1 | 中等 | ✅ 前端（后端返回关键词） |
| TASK-SEARCH-03 | FR-SEARCH-07 | **搜索建议优化**：支持对常见输入错误给出更正建议或宽松匹配 | P1 | 较小 | ✅ 后端+前端 |

**技术要点**：
- 在 `job-service/src/routes/job.ts` 和 `search-service/src/routes/search.ts` 中添加 `sortBy` 参数
- 支持排序选项：`default`（综合排序）、`time`（发布时间）、`salary`（薪资范围）
- 前端在搜索页面添加排序选择器
- 实现关键词高亮显示（前端实现，使用正则表达式或字符串替换）
- 优化搜索建议算法（模糊匹配、拼音匹配等）

**相关文件**：
- `services/job-service/src/routes/job.ts`
- `services/search-service/src/routes/search.ts`
- `apps/frontend/src/pages/student/jobs.tsx`
- `apps/frontend/src/pages/search.tsx`
- `apps/frontend/src/pages/index.tsx`

**总计**：3个功能任务（1个P0 + 2个P1）

---

### 组员 B：企业端功能增强

**负责模块**：企业岗位管理、企业信息展示

#### 功能完善任务

| 任务ID | 需求编号 | 任务描述 | 优先级 | 工作量估算 | 前后端 |
|--------|---------|---------|--------|-----------|--------|
| TASK-JOB-01 | FR-JOB-06 | **岗位复制功能**：允许企业复制已有岗位信息用于快速创建相似岗位 | P1 | 较小 | ✅ 后端+前端 |
| TASK-PROFILE-01 | FR-PROFILE-04 | **企业详情页完整实现**：展示企业自报的关键信息，并对联系方式等敏感信息进行脱敏 | P0 | 中等 | ✅ 后端+前端（新建页面） |
| TASK-PROFILE-02 | FR-PROFILE-06 | **企业历史岗位统计**：在企业详情页展示该企业当前在招职位列表或历史发布记录的简要统计信息 | P1 | 较小 | ✅ 后端+前端 |

**技术要点**：
- 在 `employer.ts` 中添加接口：`POST /api/v1/employer/jobs/:id/duplicate`
- 复制岗位时排除 `id`、`createdAt`、`status` 等字段，重置为草稿状态
- 前端在企业端岗位列表添加"复制"按钮
- 创建企业详情页路由：`/companies/[id]`
- 在 `job-service` 中添加企业详情接口：`GET /api/v1/companies/:id`
- 实现数据脱敏逻辑（电话号码、邮箱等）- 简单实现，不考虑生产环境安全
- 实现企业历史岗位统计查询

**⚠️ 协作注意事项**：
- **企业详情页协作**：组员C负责的企业风险提示（TASK-PROFILE-03）需要在企业详情页展示
- 建议在企业详情页中预留风险提示组件的展示位置（如页面顶部或企业信息卡片中）
- 风险提示数据可通过接口 `GET /api/v1/companies/:id` 返回，或单独调用风险提示接口
- 建议先完成企业详情页基础框架，再与组员C协调风险提示组件的集成方式

**相关文件**：
- `services/job-service/src/routes/employer.ts`
- `services/job-service/src/routes/company.ts`（需扩展）
- `apps/frontend/src/pages/employer/jobs.tsx`
- `apps/frontend/src/pages/companies/[id].tsx`（需新建）
- `apps/frontend/src/pages/jobs/[id].tsx`（需添加企业详情链接）

**总计**：3个功能任务（1个P0 + 2个P1）

---

### 组员 C：管理端与学生端功能增强

**负责模块**：审核服务、风控服务、审计日志、学生端投递记录

#### 功能完善任务

| 任务ID | 需求编号 | 任务描述 | 优先级 | 工作量估算 | 前后端 |
|--------|---------|---------|--------|-----------|--------|
| TASK-PROFILE-03 | FR-PROFILE-05 | **企业风险提示**：根据平台内部规则为企业生成基础风险提示，并在企业详情页/职位详情页适当位置展示 | P1 | 中等 | ✅ 后端+前端 |
| TASK-APP-01 | FR-APP-03 | **投递记录筛选**：在"我的投递"页面按状态（进行中、已完成等）对投递记录进行过滤或分组展示 | P1 | 较小 | ✅ 后端+前端 |
| TASK-VERIFY-01 | FR-VERIFY-06 | **历史审核记录查询**：支持就业中心用户按状态、企业、时间范围等条件对历史审核记录进行查询 | P1 | 中等 | ✅ 后端+前端 |
| TASK-AUDIT-01 | FR-AUDIT-03 | **审计日志导出**：支持将审计日志导出为标准格式（CSV），用于离线分析和备份 | P1 | 较小 | ✅ 后端+前端 |

**技术要点**：
- 计算企业风险评分（基于审核驳回次数、举报次数等）
- 在企业详情页/职位详情页展示风险提示
- 前端在投递记录页面添加状态筛选器
- 支持筛选：进行中（APPLIED、VIEWED、INTERVIEWING）、已完成（ACCEPTED、REJECTED）
- 在 `review-service` 中添加历史审核记录查询接口
- 支持多条件筛选：状态、企业ID、时间范围
- 前端在管理端审核页面添加筛选功能
- 在 `audit-service` 中添加导出接口：`GET /api/v1/admin/audit/logs/export`
- 支持 CSV 格式导出
- 前端添加"导出"按钮，支持下载文件

**⚠️ 协作注意事项**：
- **企业详情页协作**：企业风险提示（TASK-PROFILE-03）需要在组员B创建的企业详情页中展示
- 建议与组员B协调，在企业详情接口 `GET /api/v1/companies/:id` 的响应中包含风险提示数据（如 `riskLevel`、`riskMessage` 等字段）
- 或者创建独立的风险提示接口，前端在企业详情页中调用并展示
- 风险提示组件建议设计为可复用的 React 组件，便于在企业详情页和职位详情页中使用
- 建议等组员B完成企业详情页基础框架后，再集成风险提示功能

**相关文件**：
- `services/review-service/src/routes/review.ts`
- `services/audit-service/src/routes/audit.ts`
- `services/job-service/src/routes/company.ts`（风险提示相关）
- `apps/frontend/src/pages/admin/review.tsx`
- `apps/frontend/src/pages/admin/audit.tsx`
- `apps/frontend/src/pages/student/applications.tsx`
- `apps/frontend/src/pages/companies/[id].tsx`（风险提示展示）
- `apps/frontend/src/pages/jobs/[id].tsx`（风险提示展示）

**总计**：4个功能任务（4个P1）

---

## 📝 开发规范

### 后端
1. 所有接口使用 `successResponse` 和 `ErrorResponses` 统一响应格式
2. 使用 Prisma 进行数据库操作
3. 需要认证的接口从 `req.headers['x-user-id']` 获取用户ID
4. 新增接口需要添加参数校验（使用 Zod schema）

### 前端
1. 使用 `authApi`、`jobApi` 等封装好的 API 方法
2. 使用 Ant Design 组件库
3. 页面放在对应角色目录下（`student/`、`employer/`、`admin/`）
4. 新增页面需要添加适当的错误处理和加载状态

### Git 规范
- 分支命名：`feature/组员名-功能名`（如 `feature/a-search-sort`）
- 提交信息：`feat: 功能描述` 或 `fix: 修复描述`
- 提交前确保代码通过 ESLint 和 TypeScript 检查


