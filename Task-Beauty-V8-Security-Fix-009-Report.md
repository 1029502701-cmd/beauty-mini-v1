# Task-Beauty-V8-Security-Fix-009 Report

> 日期：2026-08-03
> 状态：Completed

---

## 一、修复摘要

修复 V8 生产接口安全问题，共 4 个安全项（SEC-001 / SEC-002 / SEC-003 / SEC-006），零 UI 修改、零报告逻辑修改、零 V8 三档规则变更。

---

## 二、SEC-001：analyze.ts 增加 session 校验 + imageKey 归属校验

**文件：** beauty-api-pages/functions/api/beauty/analyze.ts

**变更：**
1. 新增 import extractSessionId from session lib
2. 在解析 body 后、访问 R2 前，增加 X-Session-Id 校验：
   - 无 sessionId -> 返回 401 Authentication required
   - session 不存在于 USER_CACHE -> 返回 401 Invalid session
3. 解析 session 获取 userId，校验 imageKey 归属：
   - imageKey 不以 beauty/uploads/{userId}/ 开头 -> 返回 403 Forbidden: image does not belong to you
4. 原有 FaceAnalysisEngine 分析逻辑完全保留，未修改

**校验顺序：** imageKey 存在性 -> sessionId -> session 有效性 -> imageKey 归属 -> R2 读取 -> 分析

---

## 三、SEC-002：report.ts 删除 anonymous fallback

**文件：** beauty-api-pages/functions/api/beauty/report.ts

**变更：**
- 移除：const userId = sessionId || 'anonymous'
- 移除：const resolvedUserId = sessionRaw ? JSON.parse(sessionRaw).userId : userId（anonymous 路径）
- 新增：无 sessionId -> 返回 401 Authentication required
- 新增：sessionId 存在但 sessionRaw 为空 -> 返回 401 Invalid or expired session
- 统一：resolvedUserId = JSON.parse(sessionRaw).userId

**行为对比：**
| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 无 X-Session-Id | 以 anonymous 身份运行 | 返回 401 |
| 无效 session | 以 anonymous 身份运行 | 返回 401 |
| 有效 session | 正常 | 正常（无变化） |

V8 三档规则保持不变：first-look 免费、style-upgrade 免费、beauty-pro 扣 1 Token。

---

## 四、SEC-003：access.ts 删除 anonymous fallback

**文件：** beauty-api-pages/functions/api/beauty/access.ts

**变更：**
- 移除：const userId = sessionId ? sessionId : 'anonymous'
- 新增：无 sessionId -> 返回 401 Authentication required
- 新增：sessionId 存在但 sessionRaw 为空 -> 返回 401 Invalid session
- 统一：userId = JSON.parse(sessionRaw).userId

**行为对比：**
| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 无 X-Session-Id | 匿名查询余额（返回 0） | 返回 401 |
| 无效 session | 匿名查询余额（返回 0） | 返回 401 |
| 有效 session | 正常 | 正常（无变化） |

---

## 五、SEC-006：result/index.tsx 删除 unknown fallback

**文件：** beauty-mini-v1/src/pages/result/index.tsx

**变更：**
- 移除 catch 块中的 fallback（userId: unknown 伪数据）
- 替换为注释：balance query failed, leave tokenBalance as null

**影响：** balance 查询失败时，tokenBalance 保持 null，currentBalance 显示 0（由 ?? 0 兜底），不产生带 userId: unknown 的伪数据。UI 无变化。

---

## 六、验证汇总

| 检查项 | 状态 | 说明 |
|--------|------|------|
| SEC-001 analyze.ts session 校验 | 已验证 | extractSessionId 导入，401/403 均已添加 |
| SEC-001 imageKey 归属校验 | 已验证 | imageKey.startsWith('beauty/uploads/' + userId + '/') |
| SEC-002 report.ts 无 anonymous | 已验证 | Select-String 确认无 anonymous 关键字 |
| SEC-002 report.ts session 强制校验 | 已验证 | 无 sessionId -> 401，无效 session -> 401 |
| SEC-003 access.ts 无 anonymous | 已验证 | Select-String 确认无 anonymous 关键字 |
| SEC-003 access.ts session 强制校验 | 已验证 | 无 sessionId -> 401，无效 session -> 401 |
| SEC-006 result 无 unknown fallback | 已验证 | Select-String 确认无 unknown 关键字 |
| V8 三档规则未修改 | 已确认 | first-look 免费、style-upgrade 免费、beauty-pro 1 Token 保持不变 |
| 报告生成逻辑未修改 | 已确认 | ReportGenerator.generateV2 调用未改动 |
| UI 未修改 | 已确认 | result/index.tsx 仅修改 catch 块，无样式/UI 变更 |

---

## 七、变更文件清单

| 文件 | 操作 | 修复内容 |
|------|------|---------|
| beauty-api-pages/functions/api/beauty/analyze.ts | 修改 | 增加 X-Session-Id 校验 + imageKey 归属校验（401/403） |
| beauty-api-pages/functions/api/beauty/report.ts | 修改 | 删除 anonymous fallback，无 session 返回 401 |
| beauty-api-pages/functions/api/beauty/access.ts | 修改 | 删除 anonymous fallback，无 session 返回 401 |
| beauty-mini-v1/src/pages/result/index.tsx | 修改 | 删除 userId: unknown fallback |

---

## 八、安全边界确认

### 已修复
- analyze：无 session -> 401，imageKey 非本人 -> 403
- report：无 session -> 401，无效 session -> 401，beauty-pro 必扣 Token
- access：无 session -> 401，无效 session -> 401
- result：无 unknown userId 伪数据

### 未修改（符合要求）
- AI 分析引擎（FaceAnalysisEngine）
- 报告生成逻辑（ReportGenerator.generateV2）
- V8 三档定价规则
- 前端 UI/样式
- upload/report/query/recommend 接口

---

Task-Beauty-V8-Security-Fix-009 执行完成。
修复范围：analyze / report / access 三个后端接口 + result 前端页面。
修复问题：SEC-001（P1）+ SEC-002（P2）+ SEC-003（P2）+ SEC-006（P3）。
禁止修改项：UI、报告逻辑、V8 三档规则，均已严格遵守。
