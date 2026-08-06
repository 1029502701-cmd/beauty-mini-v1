# Task-Beauty-V8-Stability-008 Report

> 日期：2026-08-03
> 状态：Completed（审计完成，发现并记录安全问题）

---

## 一、上传链路审计

### 1.1 /api/beauty/upload ✅ 安全

| 检查项 | 状态 | 说明 |
|--------|------|------|
| X-Session-Id 校验 | ✅ | 调用 extractSessionId(request)，无 sessionId → 返回 401 |
| KV session 验证 | ✅ | 查询 USER_CACHE.get('session:' + sessionId)，不存在 → 返回 401 |
| userId 可信性 | ✅ | 从服务端 KV session 解析，不从客户端请求体获取 |
| uploadId 可信性 | ✅ | 服务端生成：upload_\_\ |
| imageKey 可信性 | ✅ | 服务端生成：beauty/uploads/\/\.jpg |
| 绕过上传直接分析 | ✅ | imageKey 必须通过 upload 接口获得 |

**结论：upload 链路安全，无问题。**

---

### 1.2 /api/beauty/analyze ❌ 无 session 校验（P1 安全漏洞）

文件：beauty-api-pages/functions/api/beauty/analyze.ts

- 未调用 extractSessionId(request)
- 未校验 X-Session-Id header
- 任何攻击者只需知道 R2 中的 imageKey 即可分析任意用户的图片
- imageKey 格式可预测：beauty/uploads/{userId}/{timestamp}.jpg

**风险等级：P1（高危）**

---

### 1.3 /api/beauty/report ⚠️ 弱 session 校验（P2）

文件：beauty-api-pages/functions/api/beauty/report.ts

当前代码：
  const sessionId = extractSessionId(request);
  const userId = sessionId || 'anonymous';   // ❌ 无 sessionId 时降级为 anonymous

  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (sessionId && !sessionRaw) {            // ❌ 仅在 sessionId 存在但 KV 查不到时返回 401
    return new Response(..., { status: 401 });
  }
  // sessionId 为空时，完全跳过 session 校验，以 'anonymous' 用户生成报告

**风险等级：P2（中危）— 未认证用户可消费 Token 生成报告**

---

### 1.4 /api/beauty/access ⚠️ 弱 session 校验（P2）

文件：beauty-api-pages/functions/api/beauty/access.ts

当前代码：
  const sessionId = extractSessionId(request);
  const userId = sessionId ? sessionId : 'anonymous';   // ❌ 无 sessionId 时降级为 anonymous
  // 直接用 userId 查余额，无 session 验证

**风险等级：P2（中危）— 可匿名查询 Token 余额**

---

### 1.5 /api/beauty/report/query ✅ 安全

| 检查项 | 状态 | 说明 |
|--------|------|------|
| X-Session-Id 校验 | ✅ | 无 sessionId → 返回 401 |
| KV session 验证 | ✅ | 无效 session → 返回 401 |
| report owner 校验 | ✅ | row.user_id !== resolvedUserId → 返回 403 |
| report_access 检查 | ✅ | 无权限记录 → 返回 403 + unlocked: false |

**结论：query 链路安全，无问题。**

---

### 1.6 /api/beauty/recommend ⚠️ 无 session 校验（P3）

文件：beauty-api-pages/functions/api/beauty/recommend.ts

- 无 session 校验，仅检查 query params
- 仅返回产品/创作者列表，不含敏感数据

**风险等级：P3（低危）**

---

## 二、分析接口安全

### 要求
> 无有效 session：返回 401

### 当前状态
- /api/beauty/analyze：**❌ 无 session 校验**，可分析任意 R2 图片

### 修复建议（SEC-001）
在 analyze.ts 中增加：
  const sessionId = extractSessionId(request);
  if (!sessionId) return 401;
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (!sessionRaw) return 401;
  const { userId } = JSON.parse(sessionRaw);
  // 验证 imageKey 归属：beauty/uploads/\/...

---

## 三、报告生成安全

### 要求
> beauty-pro：必须经过 report_access 检查，Token 消费流程

### 当前状态
- /api/beauty/report：beauty-pro 路径确实扣 Token + 写 report_access ✅
- ⚠️ 问题：无 sessionId 时以 'anonymous' 身份触发，匿名消费 Token ❌

### 修复建议（SEC-002）
在 report.ts 中：
  if (!sessionId) return 401;
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (!sessionRaw) return 401;
  const resolvedUserId = JSON.parse(sessionRaw).userId;
  // 移除 sessionId || 'anonymous' 降级逻辑

---

## 四、前端依赖检查

### 4.1 localStorage 使用情况

| 页面 | 是否有权限相关 localStorage | 说明 |
|------|--------------------------|------|
| result/index.tsx | ❌ 无 | 仅使用服务端返回数据 |
| analyzing/index.tsx | ❌ 无 | 仅导航参数 + 服务端调用 |
| upload/index.tsx | ❌ 无 | 仅调用 upload API |

**未发现任何页面以 localStorage 作为权限来源。**

### 4.2 Session 机制

前端通过 X-Session-Id header 传递 session：
  userService.getServerSessionId() → getStorage('beauty_session_id', null)

storage.ts 是 wx.storage / localStorage 的统一抽象层，session 存储是凭证管理，不是权限判断来源。

### 4.3 前端本地缓存问题（P3）

reportAccessService.ts 维护本地缓存：
  private getStoredAccess(): ReportAccess[] {
    return getStorage<ReportAccess[]>(ACCESS_RECORDS_KEY, []) ?? [];
  }

- checkAccess() 和 getAccessStatusForReport() 优先使用本地缓存
- 服务端已实现 report_access 表，但前端未使用其返回的 access 字段
- 清除本地存储后行为一致，风险可控

**修复建议（SEC-005）：** 前端 queryReport 时应解析服务端返回的 access 字段并更新本地缓存。

### 4.4 result 页 fallback（P3）

result/index.tsx:106
  setTokenBalance({ userId: 'unknown', balance: 0, ... });

仅在 balance 查询失败时触发，不影响正常流程。

---

## 五、问题汇总

| 编号 | 接口/位置 | 风险等级 | 问题描述 |
|------|----------|---------|---------|
| SEC-001 | /api/beauty/analyze | **P1** | 无 session 校验，可分析任意 R2 图片 |
| SEC-002 | /api/beauty/report | **P2** | 无 sessionId 时降级为 anonymous，可匿名消费 Token |
| SEC-003 | /api/beauty/access | **P2** | 无 sessionId 时降级为 anonymous，可匿名查询余额 |
| SEC-004 | /api/beauty/recommend | **P3** | 无 session 校验（仅返回公开推荐数据） |
| SEC-005 | reportAccessService.ts | **P3** | 前端优先使用本地缓存，未使用服务端 access 字段 |
| SEC-006 | result/index.tsx:106 | **P3** | balance 查询失败时 userId='unknown' fallback |

---

## 六、修复建议代码

### SEC-001：analyze.ts 增加 session 校验

在 beauty-api-pages/functions/api/beauty/analyze.ts 中，在解析 body 后增加：

  const sessionId = extractSessionId(request);
  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 });
  }
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (!sessionRaw) {
    return new Response(JSON.stringify({ error: 'Invalid session' }), { status: 401 });
  }
  const { userId } = JSON.parse(sessionRaw);
  // 可选：验证 imageKey 归属
  if (!body.imageKey.startsWith('beauty/uploads/' + userId + '/')) {
    return new Response(JSON.stringify({ error: 'Forbidden: image does not belong to you' }), { status: 403 });
  }

### SEC-002：report.ts 修复 anonymous 降级

在 beauty-api-pages/functions/api/beauty/report.ts 中：

  // 当前：const userId = sessionId || 'anonymous';
  // 改为：
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), { status: 401 });
  }
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (!sessionRaw) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid or expired session' }), { status: 401 });
  }
  const resolvedUserId = JSON.parse(sessionRaw).userId;

### SEC-003：access.ts 修复 anonymous 降级

在 beauty-api-pages/functions/api/beauty/access.ts 中：

  // 当前：const userId = sessionId ? sessionId : 'anonymous';
  // 改为：
  if (!sessionId) {
    return new Response(JSON.stringify({ success: false, error: 'Authentication required' }), { status: 401 });
  }
  const sessionRaw = await env.USER_CACHE.get('session:' + sessionId);
  if (!sessionRaw) {
    return new Response(JSON.stringify({ success: false, error: 'Invalid session' }), { status: 401 });
  }
  const { userId } = JSON.parse(sessionRaw);

---

## 七、安全边界确认

### ✅ 未发现问题
- upload 链路：session 验证完整，uploadId/imageKey 均由服务端生成
- report/query 链路：session 验证 + owner 校验 + report_access 权限检查完整
- 前端：无页面以 localStorage 作为权限来源
- V8 产品规则：未修改（first-look 免费 / style-upgrade 免费 / beauty-pro 1 Token）

### ❌ 发现安全问题
- analyze 接口缺少 session 校验（P1）
- report 和 access 接口对空 sessionId 处理不一致（P2）

---

## 八、变更文件清单

本次为纯审计，未修改任何代码文件。建议修复以下文件：

| 文件 | 操作 | 修复内容 |
|------|------|---------|
| beauty-api-pages/functions/api/beauty/analyze.ts | 修改 | 增加 session 校验，验证 imageKey 归属 |
| beauty-api-pages/functions/api/beauty/report.ts | 修改 | 无 sessionId 时返回 401，不使用 anonymous |
| beauty-api-pages/functions/api/beauty/access.ts | 修改 | 无 sessionId 时返回 401，不使用 anonymous |
| beauty-mini-v1/src/services/report.ts | 可选修改 | 解析服务端 access 字段 |

---

> Task-Beauty-V8-Stability-008 执行完成。
> 审计范围：upload / analyze / report / report/query / access / recommend 六个接口及前端三个页面。
> 发现 P1 漏洞 1 个，P2 漏洞 2 个，P3 漏洞 3 个。
> 禁止修改 V8 产品规则、禁止修改 UI。已严格遵守。
