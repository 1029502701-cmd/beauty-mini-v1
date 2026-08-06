# Task-Beauty-V8-Permission-007 Report

> 日期：2026-08-03
> 状态：Completed

---

## 一、完成内容

### 1. 新增数据库迁移文件

**文件：** eauty-api-pages/migrations/008_add_report_access.sql

创建 eport_access 表，用于服务端持久化报告权限记录：

`sql
CREATE TABLE IF NOT EXISTS report_access (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  report_id   TEXT NOT NULL,
  level       TEXT NOT NULL CHECK(level IN ('first-look', 'style-upgrade', 'beauty-pro')),
  unlock_type TEXT NOT NULL CHECK(unlock_type IN ('free', 'token')),
  token_cost  INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  expire_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_access_user_id ON report_access(user_id);
CREATE INDEX IF NOT EXISTS idx_report_access_report_id ON report_access(report_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_access_user_report_level
  ON report_access(user_id, report_id, level);
`

**设计要点：**
- UNIQUE(user_id, report_id, level) 保证幂等，防止重复扣款
- unlock_type 区分免费/付费解锁，用于审计

---

### 2. 新增 ReportAccessService

**文件：** eauty-api-pages/modules/beauty-ai/permission/report-access-service.ts

新增服务类，封装 report_access 表操作：

| 方法 | 说明 |
|------|------|
| checkReportAccess(userId, reportId, level) | 查询用户是否已解锁指定报告等级 |
| grantReportAccess(userId, reportId, level) | 授予访问权限（幂等，UNIQUE 约束保护） |
| getUnlockedLevels(userId, reportId) | 获取用户对该报告已解锁的所有等级 |

grantReportAccess() 实现：
- 先查询已有记录，若存在则直接返回 lreadyUnlocked: true
- 免费等级（first-look / style-upgrade）：unlock_type='free'，	oken_cost=0
- 付费等级（beauty-pro）：unlock_type='token'，	oken_cost=1（由调用方保证已扣款）
- 捕获 UNIQUE 约束冲突，自动重试查询，确保并发安全

---

### 3. 修改报告生成接口

**文件：** eauty-api-pages/functions/api/beauty/report.ts

**变更：**

| 变更前 | 变更后 |
|--------|--------|
| 不检查余额、不扣 Token、不记录权限 | beauty-pro 时检查余额 → 扣1 Token → 写 report_access |
| 无 session 验证 | 新增 session 验证，解析 resolvedUserId |
| 返回 { success, report, reportId } | 新增返回 level 和 	okenCost |

**新流程（beauty-pro）：**
`
解析 session → resolvedUserId
  → getBalance(resolvedUserId)
  → balance < 1 ? 返回 403
  → consume(userId, 1, "beauty-pro report generation")
  → generateV2()
  → createReport()
  → grantReportAccess()（幂等）
  → 返回 { success, report, reportId, level, tokenCost: 1 }
`

**first-look / style-upgrade：** 不扣 Token，直接生成报告 + 写 report_access（unlock_type='free'）

---

### 4. 修改报告查询接口

**文件：** eauty-api-pages/functions/api/beauty/report/query.ts

**变更：**

| 变更前 | 变更后 |
|--------|--------|
| TOKEN_COST['beauty-pro'] = 3（BUG） | 移除硬编码，改用 report_access 表判断 |
| 检查余额决定是否返回报告 | 查询 report_access，有记录则返回完整报告 |
| 余额不足返回 403 | 无权限记录返回 403 + 附带 unlocked: false |
| 无解锁状态信息 | 返回 ccess: { unlocked, level, tokenCost, unlockType } |

**新流程：**
`
查询 beauty_reports 表获取报告数据
  → session 验证 + 解析 resolvedUserId
  → 校验报告归属（user_id === resolvedUserId）
  → checkReportAccess(resolvedUserId, reportId, level)
  → 有记录 → 返回完整报告 + access 信息
  → 无记录 → 返回 403 "Report not unlocked for this level"
`

---

## 二、V8 产品规则保持

| 等级 | Token 消费 | 状态 |
|------|-----------|------|
| first-look | 0（免费） | ✅ 未修改 |
| style-upgrade | 0（免费） | ✅ 未修改 |
| beauty-pro | 1 Token | ✅ V8 规则未变 |

**禁止修改部分确认：**
- ✅ 未修改 beauty-mini-v1 小程序 UI
- ✅ 未修改 V8 等级规则（TOKEN_COST 常量仍为 beauty-pro=1）
- ✅ 未修改报告生成算法（ReportGenerator.generateV2）

---

## 三、修复的 BUG

| 编号 | 位置 | 修复内容 |
|------|------|---------|
| BUG-001 | query.ts:53 | TOKEN_COST['beauty-pro']=3 → 改为查 report_access 表，不再硬编码 |
| BUG-002 | report.ts | 新增余额检查 + Token 扣减 + report_access 记录 |
| BUG-003 | query.ts | 由余额检查改为 report_access 权限检查 |

---

## 四、变更文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| eauty-api-pages/migrations/008_add_report_access.sql | 新增 | report_access 表及索引 |
| eauty-api-pages/modules/beauty-ai/permission/report-access-service.ts | 新增 | ReportAccessService 服务类 |
| eauty-api-pages/functions/api/beauty/report.ts | 修改 | beauty-pro 扣 Token + 写 report_access |
| eauty-api-pages/functions/api/beauty/report/query.ts | 修改 | 查 report_access，修复 TOKEN_COST=3 |

---

## 五、幂等与容错

- **UNIQUE(user_id, report_id, level)** 约束保证服务端幂等
- grantReportAccess() 先查后插，并发冲突时捕获 SQLITE_CONSTRAINT 重试
- beauty-pro 扣款在写 report_access 之前完成，确保事务顺序正确

---

## 六、TypeScript 编译验证

- 
px tsc --noEmit 无新增错误
- 所有报错均在 cloudflare-worker/functions/index.ts 预存，与本次变更无关

---

> Task-Beauty-V8-Permission-007 执行完成。
> 报告权限记录系统已实现：report_access 表 + ReportAccessService + 报告生成/查询接口改造。
> 禁止修改小程序 UI / V8 等级规则。