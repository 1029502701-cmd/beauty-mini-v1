# V8 三档权限与 Token 统一设计方案

> 文档日期：2026-08-03
> 任务编号：Task-Beauty-V8-Permission-006
> 参考：Task-Beauty-V8-Database-005

---

## 一、V8 产品规则（不变）

| 等级 | 等级名 | 权限 | Token 消费 |
|------|--------|------|-----------|
| Level 1 | first-look | 免费 | 0 |
| Level 2 | style-upgrade | 免费 | 0 |
| Level 3 | beauty-pro | 付费 | 1 Token |

**禁止修改此规则。**

---

## 二、当前权限流程审计

### 2.1 前端权限服务（双轨并存，存在冗余）

**reportAccessService.ts（主力服务）**

- checkAccess(reportId) → 读取 localStorage + 调用 fetchServerBalance
- unlockReport(reportId, level) → 调用 consumeServerTokens()（D1 扣款）+ 写 localStorage

**permission-service.ts（备用服务）**

- hasAccess(reportId, level) → 调用 GET /api/beauty/access（仅检查，不扣款）
- unlockReport(reportId, level) → 调用 GET /api/beauty/access（仅检查）+ 写 localStorage，**不调用 consumeServerTokens**

**问题：**
- permission-service.unlockReport() 不扣 Token，但写了解锁记录 → 本地状态与服务端不一致
- reportAccessService.unlockReport() 是唯一扣款路径，但无服务端持久化记录

### 2.2 后端权限检查

**GET /api/beauty/access** — 仅检查余额，返回 allowed boolean，不扣款

**POST /api/token/consume** — 调用 TokenService.consume()，D1 扣减 + 写 token_transactions

**GET /api/beauty/report/query（BUG）**

- query.ts:53 硬编码错误：TOKEN_COST['beauty-pro'] = 3，V8 规则规定 beauty-pro = 1 Token
- 余额检查只返回 403，不消费 Token
- 未查询任何权限记录表，每次查询都重新验证余额

### 2.3 报告生成（无权限检查）

**POST /api/beauty/report**

- 接收 reportLevel，生成报告，写入 beauty_reports
- **不检查余额、不扣 Token、不记录权限**
- 任何用户可直接通过 API 免费生成 beauty-pro 报告

---

## 三、双重消费问题分析

**结论：存在双重消费风险，尚未触发实质性重复扣款。**

**风险场景：**
1. reportAccessService.unlockReport() 扣款成功，但 localStorage 写入失败 → 用户重进页面，本地无记录，再次解锁 → 重复扣款
2. 网络重试场景：consumeServerTokens() 返回超时，实际已扣款，前端重试 → 重复扣款

**根本原因：**
1. 无服务端权限记录表（report_access 不存在）
2. 报告生成不扣 Token（report.ts 缺少权限检查）
3. 查询接口做余额检查而非权限检查（query.ts 未查 report_access）
4. query.ts 中 TOKEN_COST['beauty-pro'] = 3，与 V8 规则（1 Token）不一致

---

## 四、唯一权限来源设计方案

### 4.1 核心原则

**Token 消费只能由服务端完成，且只消费一次。**

### 4.2 新增数据库表：report_access

文件：migrations/008_add_report_access_table.sql

```sql
CREATE TABLE IF NOT EXISTS report_access (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  report_id   TEXT NOT NULL,
  level       TEXT NOT NULL CHECK(level IN ('first-look', 'style-upgrade', 'beauty-pro')),
  unlock_type TEXT NOT NULL CHECK(unlock_type IN ('free', 'token', 'payment')),
  token_cost  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  expire_at   TEXT NOT NULL
);

CREATE INDEX idx_report_access_user_id ON report_access(user_id);
CREATE INDEX idx_report_access_report_id ON report_access(report_id);
CREATE UNIQUE INDEX uq_report_access_user_report_level
  ON report_access(user_id, report_id, level);
```

**设计要点：**
- UNIQUE(user_id, report_id, level) 确保幂等，防止重复扣款
- unlock_type 用于审计追踪

### 4.3 服务端权限流程

**报告生成（POST /api/beauty/report）**
1. 解析 reportLevel（默认 first-look）
2. 若 level = beauty-pro：
   a. TokenService.getBalance(userId)
   b. 余额 < 1 → 返回 403
   c. TokenService.consume(userId, 1, "beauty-pro report")
   d. INSERT INTO report_access（UNIQUE 约束保护幂等）
3. 生成报告内容（ReportGenerator.generateV2）
4. INSERT INTO beauty_reports
5. 返回 report + reportId

**报告查询（GET /api/beauty/report/query）**
1. 查询 beauty_reports 表获取报告数据
2. 检查 report_access 表：用户是否已解锁该等级
   - 有记录 → 返回完整报告
   - 无记录 + beauty-pro → 返回 403
3. 不再做余额检查

### 4.4 数据库关系图

```
users (1) ──┬── (N) beauty_reports    ← 用户生成的报告
            │
            └── (1) user_tokens       ← Token 余额

beauty_reports (1) ── (N) report_access  ← 权限记录（新增）
                              │
                              └── UNIQUE(user_id, report_id, level)

token_transactions ← 由 TokenService.consume() 自动创建
```

### 4.5 统一 Token 成本常量

```typescript
// permission-service.ts
export const REPORT_TOKEN_COST: Record<ReportLevel, number> = {
  'first-look': 0,
  'style-upgrade': 0,
  'beauty-pro': 1,  // V8 规则
};
```

query.ts 移除硬编码，改为引用此常量。

---

## 五、前端改造方案

### 5.1 简化前端权限判断

- 移除 reportAccessService.unlockReport() 中的 consumeServerTokens() 调用
- 报告生成时由服务端自动处理付费
- 前端通过查询接口（report/query）获取真实权限状态

### 5.2 报告生成流程

```
analyzing → reportService.createAndQueryReport(uploadId, imageKey, reportLevel)
  → POST /api/beauty/report { reportLevel }
     → 服务端：检查余额 → 扣1 Token → 写 report_access → 生成报告 → 返回
  → 返回 reportId + report
```

### 5.3 结果页权限判断

```
result → reportAccessService.getAccessStatusForReport(reportId)
  → GET /api/beauty/report/query?id=xxx
  → 服务端根据 report_access 返回真实解锁状态
  → 前端仅做展示
```

---

## 六、变更清单

### 后端变更（beauty-api-pages）

| 文件 | 变更 | 说明 |
|------|------|------|
| migrations/008_add_report_access_table.sql | 新增 | report_access 表及索引 |
| modules/token/token-service.ts | 增强 | 新增 consumeForReport() 方法 |
| functions/api/beauty/report.ts | 修改 | beauty-pro 时扣 Token + 写 report_access |
| functions/api/beauty/report/query.ts | 修改 | 查 report_access，移除硬编码 TOKEN_COST=3 |
| modules/beauty-ai/permission/permission-service.ts | 修改 | 新增 recordAccess() 方法 |

### 前端变更（beauty-mini-v1）

| 文件 | 变更 | 说明 |
|------|------|------|
| src/services/reportAccessService.ts | 修改 | 移除 consumeServerTokens() 调用 |
| src/services/permission-service.ts | 修改 | 移除 consumeServerTokens() 调用 |
| src/pages/result/index.tsx | 修改 | 依赖服务端权限状态，移除手动解锁 |

### 禁止修改

- beauty-mini-v1/src/types/report-level.ts（V8 规则）
- beauty-mini-v1/src/pages/purchase/index.tsx（小程序 UI）
- beauty-mini-v1/src/pages/token/index.tsx（小程序 UI）

---

## 七、幂等与容错

- UNIQUE(user_id, report_id, level) 约束保证服务端幂等
- 重复请求时 INSERT 失败，服务端返回 alreadyUnlocked=true，不重复扣款
- beauty_reports 与 report_access 在同一 D1 batch 事务中写入

---

## 八、现有 BUG 清单

| 编号 | 位置 | 问题 | 影响 |
|------|------|------|------|
| BUG-001 | query.ts:53 | TOKEN_COST['beauty-pro']=3，应为1 | 查询权限检查错误 |
| BUG-002 | report.ts | 生成报告不检查余额、不扣 Token | beauty-pro 可被免费生成 |
| BUG-003 | query.ts | 查询时做余额检查而非权限检查 | 未利用已购买记录 |
| BUG-004 | 前端双服务 | 解锁逻辑分散在两处 | 可能导致状态不一致 |
| BUG-005 | purchase/index.tsx | 显示 "3 Token" 但 V8 规定 1 | UI 显示错误（禁止修改） |

---

## 九、实施优先级

1. P0 — migrations/008：report_access 表
2. P0 — report.ts：生成时扣 Token + 写 report_access
3. P0 — query.ts：查 report_access，移除 TOKEN_COST=3
4. P1 — permission-service.ts：新增 recordAccess()
5. P1 — 前端 reportAccessService.ts：移除双重消费路径

---

> Task-Beauty-V8-Permission-006 审计与设计完成。
> 禁止修改 V8 产品规则 / 小程序 UI。
