# Task-BeautyMini-Wechat-Login-Backend-Diagnose-004 诊断报告

## 目标
修复 /api/wechat-login 返回 status:error 导致无法生成 sessionId 的问题。

---

## 根因（两个 Bug）

### Bug A（严重）：D1 查询参数硬编码为字符串，而非 openid 变量

**文件**: cloudflare-worker/functions/api/wechat-login.ts，第 87-88 行

Before:
  const existing = await env.D1_DB.prepare(
    \"SELECT id FROM users WHERE open_id = ?\",
  ).first<any>(\"open_id\");   // BUG: 传的是字面量字符串 \"open_id\"，不是变量 openid

After:
  const existing = await env.D1_DB.prepare(
    \"SELECT id FROM users WHERE open_id = ?\",
  ).first<any>(openid);        // FIX: 使用实际 openid 变量

影响：每次登录都会在 D1 创建重复用户（因为查询永远找不到已有用户），
userId 每次不同，导致 session 无法正确关联。

---

### Bug B（严重）：updateToWechatSession 传入了错误的参数

**文件**: cloudflare-worker/functions/api/wechat-login.ts，第 111-112 行

Before:
  sessionRecord = await sessionService.updateToWechatSession(guestUserId, userId, openid);
  // guestUserId 格式为 \"user_xxx\"，不是 KV sessionId
  // updateToWechatSession 用 guestUserId 去 KV 查找，永远找不到，返回 null
  // 最终 fallback 到 createAuthSession，创建新 session（不合并旧数据）

After:
  // 新增：从客户端请求中获取现有的 sessionId（KV token）
  const { code, guestUserId, guestId, sessionId } = body;
  if (sessionId) {
    sessionRecord = await sessionService.updateToWechatSession(sessionId, userId, openid);
    if (sessionRecord) merged = true;
  } else if (guestUserId && guestId) {
    // 首次登录无 sessionId，创建新 session 并关联 guestId
    sessionRecord = await sessionService.createAuthSession(userId, openid, guestId);
  }
  if (!sessionRecord) {
    sessionRecord = await sessionService.createAuthSession(userId, openid, guestId || null);
  }

---

### 附带修复：index.ts 语法错误

**文件**: cloudflare-worker/functions/index.ts

原文件缺失 98 个 } 和 29 个 )，无法编译部署。
已完整重建，修复所有路由处理器的括号匹配问题。

验证结果：
  Braces: 227 open, 227 close, balanced=True
  Parens: 400 open, 400 close, balanced=True
  所有路由均存在：/api/wechat/login, /api/analyze, /api/validate-image, /api/upload, /api/profile, /api/products, /api/wechat/bind, /api/creator/apply, /api/admin, /api/beauty/analysis/task

---

## 修改文件列表

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| cloudflare-worker/functions/api/wechat-login.ts | 修复 | Bug A + Bug B |
| cloudflare-worker/functions/index.ts | 修复 | 重建完整结构，修复 98 个缺失括号 |
| beauty-mini-v1/src/services/wechat-auth.ts | 修改 | 登录请求携带 sessionId |

---

## 所有可能返回 status:error 的位置

| # | 位置 | 触发条件 | 消息 |
|---|------|---------|------|
| 1 | line 40 | !code | 缺少微信登录 code |
| 2 | line 48 | !appid \|\| !secret | 微信登录服务未配置 |
| 3 | line 62 | tokenData.errcode | 微信登录失败，code无效 |
| 4 | line 69 | !openid | 微信登录失败：未获取到openid |
| 5 | line 76 | code2session 请求异常 | 微信登录请求失败 |
| 6 | line 93 | D1 INSERT 返回 null | 用户创建失败 |
| 7 | line 103 | D1 查询异常 | fallback userId，不返回 error |

---

## 环境变量检查

WECHAT_APP_ID / WECHAT_APP_SECRET：已配置
- curl 测试返回 \"微信登录失败，code无效\"（说明 WeChat API 调用正常）
- 若未配置会返回 \"微信登录服务未配置\"

---

## 前端修改（wechat-auth.ts）

在登录请求中携带现有 sessionId，使服务端能找到并合并旧 session：

  const existingSid = getStorage<string>(SESSION_STORAGE_KEY, null);
  const response = await api.post(\"/api/wechat-login\", {
    code: codeResult.code,
    guestUserId,
    guestId,
    sessionId: existingSid || undefined   // 新增
  });

---

## 部署后验证步骤

1. 部署后端：
   cd cloudflare-worker
   wrangler deploy

2. 本地 curl 测试（确认 code 验证正常）：
   curl -X POST https://beauty-api-pages.pages.dev/api/wechat-login \
     -H \"Content-Type: application/json\" \
     -d \"{\\\"code\\\":\\\"test\\\"}\"
   预期：{\"status\":\"error\",\"isGuest\":false,\"message\":\"微信登录失败，code无效\"}

3. 真机验证（微信开发者工具）：
   - 启动后控制台应看到：
     [WechatAuth] existing sessionId from storage: null   (首次)
     [WechatAuth] posting to /api/wechat-login with guestUserId: xxx sessionId: null
     [WechatAuth] serverSessionId: <uuid>
     [WechatAuth] session saved <uuid>
   - 执行：
     wx.getStorageSync(\"sessionId\")
     预期：非空 UUID 字符串

4. 二次启动验证（session 持久化）：
   - 重启小程序后：
     wx.getStorageSync(\"sessionId\")
     预期：与上次相同的 UUID（tryRestoreServerSession 找到旧 session 并合并）

5. 验证 D1 无重复用户：
   SELECT open_id, COUNT(*) as cnt FROM users GROUP BY open_id HAVING cnt > 1;
   预期：0 行