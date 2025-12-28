# JobVerse 演示增强功能（Stage3）开发任务分配
---

## 已完成的基础框架（本阶段无需重复实现）

以下内容已在仓库中落地为“可运行框架”，本阶段重点是**集成触发逻辑 + 前端页面完善 + 演示闭环**：

- **数据库/模型（Prisma）**：已新增 `Notification / Interview / ApplicationEvent / Resume`，并扩展 `Application.feedback / Application.employerNote`
  - 文件：`prisma/schema.prisma`
- **用户服务（user-service）**：已提供通知与简历的基础接口
  - 文件：`services/user-service/src/routes/notifications.ts`、`services/user-service/src/routes/resumes.ts`
- **岗位服务（job-service）**：已提供面试与时间线事件的基础接口框架
  - 文件：`services/job-service/src/routes/interviews.ts`、`services/job-service/src/routes/applicationEvents.ts`
- **API Gateway**：已增加上述新接口的代理转发
  - 文件：`services/api-gateway/src/index.ts`
- **共享类型（shared/types）**：已补齐 `notification/interview/resume/applicationEvent` 相关类型定义
  - 文件：`packages/shared/src/types/*`

---

## 重要协作事项（避免互相干扰）

### 文件所有权（Owner）约定（强制）

- **前端布局/导航/Header 改动**：仅允许 **组员 A** 修改
  - `apps/frontend/src/components/layouts/StudentLayout.tsx`
  - `apps/frontend/src/components/layouts/EmployerLayout.tsx`
- **投递接口（岗位详情投递）**：仅允许 **组员 B** 修改
  - `services/job-service/src/routes/job.ts`（`POST /api/v1/jobs/:id/apply`）
- **候选人状态/面试/投递详情接口**：仅允许 **组员 C** 修改
  - `services/job-service/src/routes/employer.ts`
  - `services/job-service/src/routes/interviews.ts`
  - `services/job-service/src/routes/application.ts`
- **通知/简历服务路由**：默认仅允许 **组员 A** 修改（若修 bug 需提前在群里同步）
  - `services/user-service/src/routes/notifications.ts`
  - `services/user-service/src/routes/resumes.ts`

### 合并顺序建议（降低冲突）

1. **组员 B**（简历中心 + 投递弹窗 + 投递接口）先合并
2. **组员 C**（面试 + 事件写入 + 反馈）第二个合并
3. **组员 A**（布局/Header + 通知 UI + 投递详情页）最后合并（布局改动最容易产生冲突）

### 分支与提交规范

- 分支命名：`feature/stage3-组员-模块`（例如 `feature/stage3-a-notification`）
- 提交信息：`feat: ...` / `fix: ...`
- 提交前自测：至少手动走通“投递 → 通知 → 面试 → 时间线/反馈”最小闭环

---

## 任务分配详情

### 组员 A：消息中心（通知）+ 学生端投递详情展示

**负责模块**：通知中心 UI（学生/企业两端）+ 学生端投递详情页（时间线/反馈展示）+ 布局接入  
**目标**：把“跨端联动”做成可演示的可视化入口（铃铛/列表/详情页）。

#### 功能完善任务

| 任务ID | 需求编号 | 任务描述 | 优先级 | 工作量估算 | 前后端 |
|--------|---------|---------|--------|-----------|--------|
| TASK-NOTIF-UI-01 | FR-NOTIF-02, FR-NOTIF-04 | 通知中心前端：铃铛未读数 + 通知列表页（学生/企业）+ 筛选/分页/标记已读/全部已读 + 点击通知跳转 | P0 | 中等 | 前端为主（接口已就绪） |
| TASK-NOTIF-BE-01 | FR-NOTIF-03 | 通知接口小完善：参数校验/错误提示/字段对齐（确保 `type/resourceType/resourceId/isRead/readAt` 等返回稳定） | P1 | 较小 | 后端（user-service） |
| TASK-APPDETAIL-UI-01 | FR-APPHIS-02, FR-APPHIS-04 | 学生端投递详情页：展示投递信息 + 时间线（events）+ 企业反馈（feedback）+ 面试信息占位/展示入口 | P0 | 中等 | 前端为主（依赖 C 的详情接口） |

#### 技术要点

- 通知列表使用：`GET /api/v1/notifications`、`GET /api/v1/notifications/unread-count`、`PUT /api/v1/notifications/:id/read`、`PUT /api/v1/notifications/read-all`
- 投递详情页数据来源建议：
  - 投递基本信息：`GET /api/v1/applications/:id`（由 C 提供/完善）
  - 时间线事件：`GET /api/v1/applications/:id/events`
  - 面试信息：`GET /api/v1/applications/:id/interview`
- “点击通知跳转”建议按 `resourceType/resourceId` 做路由映射（APPLICATION/JOB/INTERVIEW/REVIEW…）

#### 相关文件

- 前端：
  - `apps/frontend/src/components/NotificationBell.tsx`（新增）
  - `apps/frontend/src/pages/student/notifications.tsx`（新增）
  - `apps/frontend/src/pages/employer/notifications.tsx`（新增）
  - `apps/frontend/src/pages/student/applications/[id].tsx`（新增）
  - `apps/frontend/src/pages/student/applications.tsx`（增加“查看详情”入口）
  - `apps/frontend/src/components/layouts/StudentLayout.tsx`（接入铃铛/菜单）
  - `apps/frontend/src/components/layouts/EmployerLayout.tsx`（接入铃铛/菜单）
- 后端（小改）：
  - `services/user-service/src/routes/notifications.ts`

#### 验收标准（演示口径）

- 学生/企业登录后右上角能看到未读数；进入通知列表页能筛选与标记已读
- 从通知点击可跳转到对应页面（至少支持 APPLICATION/INTERVIEW）
- 学生能从“我的投递”进入投递详情页，看到时间线与企业反馈区域（即使为空也正常）

---

### 组员 B：简历中心 + 投递材料管理（投递弹窗/接口扩展）

**负责模块**：简历中心前端 + 岗位详情投递弹窗 + 投递接口扩展（含简历快照）  
**目标**：把“投递”从一个按钮升级为“选择简历 + 求职信”的可演示交互闭环。

#### 功能完善任务

| 任务ID | 需求编号 | 任务描述 | 优先级 | 工作量估算 | 前后端 |
|--------|---------|---------|--------|-----------|--------|
| TASK-RESUME-UI-01 | FR-RESUME-01, FR-RESUME-02 | 简历中心页面：简历 CRUD + 设置默认简历 + 列表展示默认标识 | P0 | 中等 | 前端 + 调用现有接口 |
| TASK-APPLY-UI-01 | FR-RESUME-03 | 岗位详情投递弹窗：选择简历（默认选中默认简历）+ 填写求职信 + 提交投递 | P0 | 中等 | 前端 |
| TASK-APPLY-BE-01 | FR-RESUME-03, FR-RESUME-05, FR-APPHIS-01, FR-NOTIF-01 | 投递接口扩展：支持 `resumeId`/`resume`；保存简历快照到 `Application.resume`；写入 APPLIED 事件；（可选）生成投递相关通知 | P0 | 中等 | 后端（job-service） |

#### 技术要点

- 简历接口使用：`GET/POST/PUT/DELETE /api/v1/resumes`、`PUT /api/v1/resumes/:id/default`
- 投递请求体扩展：`POST /api/v1/jobs/:id/apply` 支持 `resumeId`（从简历中心选）与 `coverLetter`
- 简历快照建议：投递时把简历内容/链接写入 `Application.resume`（避免后续修改影响历史记录）

#### 相关文件

- 前端：
  - `apps/frontend/src/pages/student/resumes.tsx`（新增）
  - `apps/frontend/src/pages/jobs/[id].tsx`（改：投递改弹窗 + 选择简历）
- 后端：
  - `services/job-service/src/routes/job.ts`（仅 B 修改）

#### 验收标准（演示口径）

- 学生能创建两份简历并设置默认；默认简历在列表中清晰标识
- 在岗位详情投递时能选择简历与填写求职信，投递成功后投递记录包含简历/求职信
- （可选）投递后能在时间线中看到 APPLIED 事件

---

### 组员 C：面试邀请 + 候选人状态反馈 + 时间线事件写入

**负责模块**：企业候选人管理扩展（面试/反馈）+ 时间线事件写入 + 投递详情接口完善  
**目标**：让“企业处理候选人”有可讲述流程：查看 → 状态变更 → 面试 → 反馈，并可被学生端时间线解释。

#### 功能完善任务

| 任务ID | 需求编号 | 任务描述 | 优先级 | 工作量估算 | 前后端 |
|--------|---------|---------|--------|-----------|--------|
| TASK-INTV-BE-01 | FR-INTV-01 ~ FR-INTV-04, FR-NOTIF-01 | 面试后端完善：企业创建/修改/取消面试；学生确认/拒绝/改期（可选）；（可选）面试相关通知 | P0 | 中等 | 后端（job-service） |
| TASK-CANDIDATE-UI-01 | FR-INTV-01, FR-APPHIS-04, FR-APPHIS-05 | 企业端候选人页增强：发起面试弹窗；状态更新时填写 feedback/employerNote；展示面试确认状态 | P0 | 中等 | 前端 + 后端联动 |
| TASK-APPHIS-BE-01 | FR-APPHIS-01, FR-APPHIS-03, FR-APPHIS-04 | 时间线事件写入与投递详情接口：写入 VIEWED/STATUS_CHANGED/INTERVIEW_*；新增/完善 `GET /api/v1/applications/:id` 返回 feedback、面试摘要等 | P0 | 中等 | 后端（job-service） |

#### 技术要点

- 状态更新建议写事件：
  - `VIEWED`（首次查看可选）
  - `STATUS_CHANGED`（metadata 记录 from/to、feedback）
  - `INTERVIEW_CREATED / INTERVIEW_RESPONDED / INTERVIEW_CANCELLED`
- 触发通知建议（可选但演示加分）：
  - 企业更新状态 → 学生 `STATUS_UPDATE`
  - 企业创建/取消面试 → 学生 `INTERVIEW`
  - 学生确认/拒绝 → 企业 `INTERVIEW`

#### 相关文件

- 后端（仅 C 修改）：
  - `services/job-service/src/routes/employer.ts`
  - `services/job-service/src/routes/interviews.ts`
  - `services/job-service/src/routes/application.ts`
- 前端：
  - `apps/frontend/src/pages/employer/candidates.tsx`（改：面试 + 反馈）
  - （可选组件）`apps/frontend/src/components/Interview*`（新增，供 A 的投递详情页复用）

#### 验收标准（演示口径）

- 企业能对某条投递发起面试并修改/取消；学生能确认/拒绝（通过 A 的投递详情页或单独入口）
- 企业更新状态为“录用/不合适”时能填写反馈；学生端投递详情页能展示反馈
- 学生端时间线至少能看到：STATUS_CHANGED + INTERVIEW_CREATED/RESPONDED（APPLIED 由 B 提供加分）


