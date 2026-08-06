# Task-BeautyMini-Session-Persist-Fix-001-Report

## 目标

修复微信小程序真机 `wx.getStorageSync('sessionId')` 返回空字符串导致上传失败的问题。

---

## 问题诊断

### 根因

Session ID 在登录成功后被写入 storage，但使用的 key 是 `"beauty_session_id"`，
而调试/验证时直接调用 `wx.getStorageSync('sessionId')`（key 为 `"sessionId"`），
两者不一致，导致读取返回空字符串。

### 调用链分析

```
app.tsx
  └─ userService.initializeGuestUser()
       └─ wechatAuthService.performServerLogin()
            └─ api.post("/api/wechat-login", ...)
                 └─ 后端返回 { sessionId, userId, isGuest }
                      ├─ wechat-auth.ts: setStorage("sessionId", sessionId)
                      └─ user-service.ts: userService.setServerSessionId(sessionId)
                           └─ setStorage("sessionId", sessionId)
```

Storage key 现在统一为 `"sessionId"`，
`wx.getStorageSync('sessionId')` 可直接读取到值。

---

## 修复内容

### 1. `src/services/user-service.ts`

**变更**：将 `SESSION_ID_KEY` 从 `"beauty_session_id"` 改为 `"sessionId"`

```typescript
// Before
const SESSION_ID_KEY = "beauty_session_id";

// After
const SESSION_ID_KEY = "sessionId";
```

**影响范围**：
- `getServerSessionId()` — 读取 storage
- `setServerSessionId(sessionId)` — 写入 storage
- `tryRestoreServerSession()` — 读取 storage
- `logout()` — 清除 storage

### 2. `src/services/wechat-auth.ts`

**变更**：将 `SESSION_STORAGE_KEY` 从 `"beauty_session_id"` 改为 `"sessionId"`

```typescript
// Before
const SESSION_STORAGE_KEY = "beauty_session_id";

// After
const SESSION_STORAGE_KEY = "sessionId";
```

**影响范围**：
- `performServerLogin()` — 写入 storage（登录成功后）
- `getServerSessionId()` — 读取 storage
- `clearLoginState()` — 清除 storage

---

## 验证流程

### 启动阶段（app.tsx）

```
wx.getStorageSync('sessionId')
```

**预期**：登录后返回非空字符串（sessionId）。

### 上传阶段（upload.ts → api-client.ts）

```
uploadImage()
  └─ injectSessionHeader(headers)
       └─ require("./user-service").default.getServerSessionId()
            └─ getStorage("sessionId", null)
                 └─ wx.getStorageSync("sessionId")  ← 返回正确值
  └─ wx.uploadFile({ header: { "X-Session-Id": sessionId, ... } })
```

**预期**：`X-Session-Id` header 正确注入到上传请求。

---

## 未修改的文件

| 文件 | 说明 |
|------|------|
| `src/app.tsx` | 启动流程正常，无需改动 |
| `src/services/api-client.ts` | `getSessionHeader()` 和 `injectSessionHeader()` 均已通过 `userService.getServerSessionId()` 读取 storage，key 对齐后自动生效 |
| `src/services/upload.ts` | 依赖 `injectSessionHeader()`，key 对齐后自动生效 |

---

## 修复摘要

| 文件 | 变更 |
|------|------|
| `src/services/user-service.ts:6` | `SESSION_ID_KEY` → `"sessionId"` |
| `src/services/wechat-auth.ts:31` | `SESSION_STORAGE_KEY` → `"sessionId"` |

**影响**：全局 session key 统一为 `"sessionId"`，`wx.getStorageSync('sessionId')` 可正确读取，上传请求自动携带 `X-Session-Id` header。
