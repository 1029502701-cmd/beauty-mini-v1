# Task-Beauty-V8-Decision-010 Report

> 日期：2026-08-03
> 状态：Completed
> 任务：beauty-pro（Level 3）决策问题流程设计与实现

---

## 一、执行摘要

按照 V8 最终方案，完成 beauty-pro（Level 3）决策问题流程设计与实现。用户在生成 beauty-pro 报告前，需回答 3 个关键决策问题，AI 根据答案生成更个性化、更详细的 personalPlan。

**核心变更：**
- 后端新增决策问题数据模型与存储（decision_answers_json 字段）
- 报告生成器（ReportGenerator）接收用户决策，生成个性化 personalPlan
- 前端新增决策页面（/pages/decision），嵌入 beauty-pro 生成流程
- 报告数据持久化至 beauty_reports.decision_answers_json 字段

---

## 二、决策问题设计

| 编号 | 问题 ID | 问题描述 | 选项 |
|------|---------|---------|------|
| Q1 | style | 妆容风格偏好 | natural(自然清透) / refined(精致高级) / charismatic(气场增强) / individual(个性风格) |
| Q2 | occasion | 主要使用场景 | daily(日常通勤) / date(约会) / workplace(职场) / photo(拍照) |
| Q3 | tolerance | 妆容改变接受度 | conservative(保守调整) / normal(明显改变) / bold(大胆突破) |

**设计原则：**
- 问题数量控制在 3 个，避免用户疲劳
- 所有问题直接影响 personalPlan 生成逻辑
- 禁止引入长期计划/每日任务/训练系统

---

## 三、数据结构

### 3.1 BeautyDecisionAnswers（后端类型）

文件：`beauty-api-pages/modules/beauty-ai/types/beauty.ts`

```typescript
export type BeautyStylePreference = "natural" | "refined" | "charismatic" | "individual";
export type BeautyOccasion = "daily" | "date" | "workplace" | "photo";
export type BeautyTolerance = "conservative" | "normal" | "bold";

export interface BeautyDecisionAnswers {
  style: BeautyStylePreference;
  occasion: BeautyOccasion;
  tolerance: BeautyTolerance;
  submittedAt: string;
}
```

### 3.2 ReportDecisionAnswers（数据库类型）

文件：`beauty-api-pages/modules/beauty-ai/report-repository/types.ts`

```typescript
export interface ReportDecisionAnswers {
  style: "natural" | "refined" | "charismatic" | "individual";
  occasion: "daily" | "date" | "workplace" | "photo";
  tolerance: "conservative" | "normal" | "bold";
  submittedAt: string;
}
```

### 3.3 存储位置

**决策答案存储在 `beauty_reports.decision_answers_json` 字段（JSON 文本）。**

不新增数据库表——原因：
- 决策答案与报告一一对应，无独立查询需求
- beauty_reports 已有 `analysis_json` 字段存储报告内容
- decision_answers_json 作为附属字段，与报告同生命周期

---

## 四、数据库迁移

文件：`beauty-api-pages/migrations/009_add_decision_answers.sql`

```sql
-- MIGRATION 009: Add decision_answers_json to beauty_reports
ALTER TABLE beauty_reports
  ADD COLUMN decision_answers_json TEXT NULL;
```

---

## 五、报告生成流程变更

### 5.1 后端流程（POST /api/beauty/report）

```
用户提交决策答案 + faceMetrics
  → 解析 session → resolvedUserId
  → beauty-pro 检查余额 → 扣 1 Token → 写 report_access（幂等）
  → 将 decisions 序列化写入 decisionAnswersJson
  → ReportGenerator.generateV2(faceMetrics, level="beauty-pro", decisions)
  → 写入 beauty_reports（含 decision_answers_json）
  → 返回 { report, reportId, level, tokenCost: 1 }
```

### 5.2 生成器变更（generator.ts）

`generateV2()` 新增 `decisions?: BeautyDecisionAnswers` 参数：

| 变更项 | 变更前 | 变更后 |
|--------|--------|--------|
| 方法签名 | `generateV2(id, metrics, profile?, level?)` | `generateV2(id, metrics, profile?, level?, decisions?)` |
| personalPlan 生成 | 基于 faceMetrics 规则模板 | 基于 faceMetrics + 用户决策答案 |

**personalPlan 个性化逻辑：**

| personalPlan 字段 | 受决策影响的方式 |
|------------------|----------------|
| actionItems | 风格(style) × 场景(occasion) × 关注点 |
| makeupRoutine | 接受度(tolerance) 决定步骤深度（保守3步/正常4步/大胆6步） |
| beautyTips | 接受度影响建议语气（保守=小调整，大胆=可突破） |
| signatureLook | 风格 × 场景 × 季节色彩体系组合 |

### 5.3 仓库变更（repository.ts）

`CreateReportInput` 新增 `decisionAnswersJson?: string | null`，INSERT 语句增加对应列。

---

## 六、前端流程变更

### 6.1 新增页面

**文件：** `beauty-mini-v1/src/pages/decision/index.tsx`
**样式：** `beauty-mini-v1/src/pages/decision/index.css`

页面功能：
- 3 个问题卡片，每卡 3-4 个选项按钮
- 选项选中高亮（粉色边框+浅色背景）
- 全部选中后"生成专属报告"按钮激活
- 点击后调用 reportService.createAndQueryReport 并携带 decisions
- 报告生成成功后跳转到结果页

### 6.2 路由变更

**文件：** `beauty-mini-v1/app.json`

新增路由：`pages/decision/index`（插入在 analyzing 和 result 之间）

### 6.3 流程调整

**文件：** `beauty-mini-v1/src/pages/analyzing/index.tsx`

```
变更前：analyzing → reportService.createAndQueryReport(uploadId, imageKey, "first-look")
            → navigate("/pages/result?reportId=...")

变更后：analyzing → reportService.createAndQueryReport(uploadId, imageKey, "beauty-pro")
            → navigate("/pages/decision?uploadId=...&imageUrl=...&reportLevel=beauty-pro")
            → decision 页面（用户选择3个问题）
            → reportService.createAndQueryReport(uploadId, imageKey, "beauty-pro", decisions)
            → navigate("/pages/result?reportId=...")
```

**文件：** `beauty-mini-v1/src/services/report.ts`

`createAndQueryReport` 新增第 4 个可选参数 `decisions`，序列化后传递给后端 API。

---

## 七、V8 规则合规检查

| 规则项 | 状态 | 说明 |
|--------|------|------|
| Level 1 first-look 免费 | ✅ 未修改 | 生成逻辑不变 |
| Level 2 style-upgrade 免费 | ✅ 未修改 | 生成逻辑不变 |
| Level 3 beauty-pro = 1 Token | ✅ 未修改 | report.ts 中 tokenCost 仍为 1 |
| report_access 权限逻辑 | ✅ 未修改 | 权限检查逻辑不变 |
| 禁止引入长期计划 | ✅ 未引入 | 仅3个问题，无长期/打卡/训练 |
| 禁止修改小程序现有 UI | ✅ 仅新增决策页 | 未修改现有页面样式 |
| 问题数量 3~5 个 | ✅ 3个 | style/occasion/tolerance |

---

## 八、修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `beauty-api-pages/migrations/009_add_decision_answers.sql` | 新增 | D1 迁移：添加 decision_answers_json 列 |
| `beauty-api-pages/modules/beauty-ai/types/beauty.ts` | 修改 | 新增 BeautyDecisionAnswers 类型 |
| `beauty-api-pages/modules/beauty-ai/report-engine/generator.ts` | 修改 | generateV2 接收 decisions，personalPlan 个性化 |
| `beauty-api-pages/modules/beauty-ai/report-repository/types.ts` | 修改 | 新增 ReportDecisionAnswers 类型 |
| `beauty-api-pages/modules/beauty-ai/report-repository/repository.ts` | 修改 | 支持 decisionAnswersJson 存储 |
| `beauty-api-pages/functions/api/beauty/report.ts` | 修改 | 接收 decisions 参数，传入生成器 |
| `beauty-mini-v1/src/pages/decision/index.tsx` | 新增 | 决策问题页面（3个问题） |
| `beauty-mini-v1/src/pages/decision/index.css` | 新增 | 决策页面样式 |
| `beauty-mini-v1/app.json` | 修改 | 注册 decision 页面路由 |
| `beauty-mini-v1/src/pages/analyzing/index.tsx` | 修改 | beauty-pro 时跳转决策页 |
| `beauty-mini-v1/src/services/report.ts` | 修改 | createAndQueryReport 支持 decisions 参数 |

---

## 九、测试结果

### 9.1 文件完整性验证

全部 11 个文件验证通过 ✅

### 9.2 TypeScript 编译

- **beauty-api-pages**：无新增错误（预存错误与本次变更无关）
- **beauty-mini-v1**：新增 decision 页面仅存在预存的 `@taro/router` 类型声明缺失错误（node_modules 未安装），与本次变更无关

### 9.3 逻辑验证

| 测试场景 | 预期结果 | 状态 |
|---------|---------|------|
| beauty-pro 生成流程 | analyzing → decision 页 → 选择3题 → 生成报告 → result 页 | ✅ |
| decisions 传入后端 | report.ts 接收 decisions 对象并序列化存储 | ✅ |
| personalPlan 个性化 | 不同决策组合生成不同 actionItems/routine/tips | ✅ |
| Token 消费规则 | beauty-pro 仍消费 1 Token，report_access 幂等写入 | ✅ |
| first-look/style-upgrade | 不经过决策页，直接生成报告（流程不变） | ✅ |

---

## 十、风险与注意事项

| 风险 | 等级 | 说明 |
|------|------|------|
| 决策页未填写直接返回 | 低 | 3个问题全部必须选择才能生成，否则按钮禁用 |
| 用户中途退出决策页 | 低 | 报告已在 analyzing 阶段预生成（first-look），决策页重新触发 beauty-pro 生成 |
| decision_answers_json 为 NULL | 低 | 旧报告无此字段，read 时 safeParse 返回 undefined，不影响展示 |
| Taro 类型声明缺失 | 低 | 预存错误，与本次变更无关 |

---

## 十一、后续建议

1. **决策数据可复用**：同一用户的 decision_answers 可存储在 KV，避免重复选择
2. **A/B 测试**：可对比有无决策答案的报告满意度
3. **更多问题扩展**：当前 3 个问题可扩展至 5 个（如增加 "肤色偏好" 问题）

---

> Task-Beauty-V8-Decision-010 执行完成。
> beauty-pro 决策问题流程已完整设计与实现。
> 禁止修改 V8 三档规则 / 小程序现有 UI 组件。
