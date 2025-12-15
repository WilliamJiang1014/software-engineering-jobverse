# 数据库初始化指南

本文档说明如何初始化 JobVerse 数据库的种子数据。

## 前置条件

1. **数据库已启动并连接**
   - 如果使用 Docker Compose：`docker-compose up -d postgres`
   - 确保 `.env` 文件中的 `DATABASE_URL` 配置正确

2. **已安装依赖**
   ```bash
   pnpm install
   ```

3. **已生成 Prisma Client**
   ```bash
   pnpm db:generate
   ```

4. **数据库表结构已创建**
   ```bash
   # 方式1：使用 migrate（推荐，会生成迁移历史）
   pnpm db:migrate
   
   # 方式2：直接推送 schema（开发环境快速使用）
   pnpm db:push
   ```

## 运行种子数据初始化

### 方式1：使用 npm script（推荐）

```bash
pnpm db:seed
```

### 方式2：使用 Prisma CLI

```bash
npx prisma db seed
```

### 方式3：直接运行 TypeScript 文件

```bash
npx ts-node prisma/seed.ts
```

## 种子数据内容

种子脚本会创建以下测试数据：

### 用户账号（统一密码：`jobverse123`）

| 角色 | 邮箱 | 姓名 | 说明 |
|------|------|------|------|
| 学生 | `student@jobverse.test` | 张三 | 主测试学生账号 |
| 学生 | `student2@jobverse.test` | 李四 | 辅助测试账号 |
| 学生 | `student3@jobverse.test` | 王五 | 辅助测试账号 |
| 企业 | `employer1@jobverse.test` | 李经理 | XX科技有限公司 |
| 企业 | `employer2@jobverse.test` | 王总 | YY互联网公司 |
| 学校管理员 | `school@jobverse.test` | 就业中心-张老师 | 高校就业中心 |
| 平台管理员 | `admin@jobverse.test` | 平台管理员 | 平台管理员 |

### 企业数据

- **XX科技有限公司**（已认证，北京）
- **YY互联网公司**（已认证，上海）
- **ZZ创新科技**（未认证，深圳）

### 岗位数据

- **已审核通过**：5 个岗位（前端、后端、产品、Java、AI）
- **待审核**：1 个岗位（UI设计师）
- **草稿**：1 个岗位（数据分析师）
- **已驳回**：1 个岗位（测试工程师）

### 其他数据

- 审核记录：7 条
- 投递记录：6 条（包含不同状态）
- 收藏记录：4 条
- 风控规则：4 条（敏感词、重复检测、内容质量）
- 审计日志：3 条（示例）

## 注意事项

⚠️ **重要**：运行 seed 脚本会**清空所有现有数据**，请确保：

1. 只在开发/测试环境运行
2. 不要在生产环境运行
3. 运行前确保数据库中没有重要数据

## 验证数据

初始化完成后，可以通过以下方式验证：

### 1. 查看控制台输出

脚本运行成功后会输出：
```
✨ 数据库种子数据初始化完成！
📋 测试账号信息：...
```

### 2. 使用 Prisma Studio 查看

```bash
npx prisma studio
```

在浏览器中打开 `http://localhost:5555` 查看数据库内容。

### 3. 直接查询数据库

```bash
# 进入 PostgreSQL 容器
docker exec -it jobverse-postgres psql -U admin -d jobverse

# 查看用户数量
SELECT COUNT(*) FROM users;

# 查看岗位数量
SELECT status, COUNT(*) FROM jobs GROUP BY status;
```

## 常见问题

### Q: 运行 seed 时报错 "Cannot find module '@prisma/client'"

**A**: 需要先运行 `pnpm db:generate` 生成 Prisma Client。

### Q: 运行 seed 时报错 "P1001: Can't reach database server"

**A**: 检查：
1. 数据库服务是否已启动
2. `.env` 文件中的 `DATABASE_URL` 是否正确
3. 如果使用 Docker，确保容器名称和网络配置正确

### Q: 如何重置数据库并重新初始化？

**A**: 
```bash
# 删除并重建数据库（Docker 方式）
docker-compose down -v
docker-compose up -d postgres

# 等待数据库启动后，重新创建表结构
pnpm db:push

# 运行 seed
pnpm db:seed
```

### Q: 如何修改种子数据？

**A**: 直接编辑 `prisma/seed.ts` 文件，然后重新运行 `pnpm db:seed`。

## 下一步

数据库初始化完成后，可以：

1. **启动所有服务**：`pnpm dev`
2. **测试登录功能**：使用上述测试账号登录
3. **开始开发业务功能**：参考主 README.md 中的开发指南

