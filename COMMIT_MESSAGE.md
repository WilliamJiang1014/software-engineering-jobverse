# Commit Message

## Summary (第一行，建议50字以内)

```
feat(stage3-C): 实现面试管理、时间线事件写入和候选人状态反馈功能
```

---

## Description (详细描述)

实现组员C的Stage3任务：面试管理、时间线事件写入和候选人状态反馈功能

### 后端功能

**面试管理接口 (interviews.ts)**
- 企业创建面试邀请：POST /api/v1/employer/applications/:applicationId/interviews
- 企业修改/取消面试：PUT /api/v1/employer/interviews/:id
- 学生响应面试：PUT /api/v1/interviews/:id/respond
- 自动写入事件并触发通知

**时间线事件写入 (employer.ts, interviews.ts)**
- VIEWED: 首次查看时写入
- STATUS_CHANGED: 状态变更时写入（metadata包含fromStatus/toStatus/feedback）
- INTERVIEW_*: 面试相关操作自动写入

**状态更新接口增强 (employer.ts)**
- PUT /api/v1/employer/candidates/:id/status 支持feedback和employerNote
- 状态变更时自动写入事件并触发通知

**投递详情接口 (application.ts)**
- GET /api/v1/applications/:id
- 返回字段对齐组员A要求：id/status/appliedAt/updatedAt/feedback/job{id/title/company{name}}

**通知功能 (utils/notification.ts)**
- 创建通知辅助函数，调用user-service的POST /api/v1/notifications
- 关键节点自动触发通知（面试创建/取消/响应、状态更新）

### 前端功能

**候选人页面增强 (candidates.tsx)**
- 发起面试弹窗：日期、时间、方式、地点/链接、备注
- 状态更新弹窗：支持填写feedback（学生可见）和employerNote（仅企业可见）

**API调用扩展 (api.ts)**
- 扩展updateCandidateStatus支持feedback和employerNote
- 新增createInterview、updateInterview和interviewApi.respond

### 相关任务
- TASK-INTV-BE-01: 面试后端完善 ✅
- TASK-APPHIS-BE-01: 时间线事件写入与投递详情接口 ✅
- TASK-CANDIDATE-UI-01: 企业端候选人页增强 ✅

