# Task-BeautyMini-Session-Realtime-Debug-002 Diagnostic Report

## Objective
Locate why wx.getStorageSync('sessionId') is still empty on WeChat real device.

---

## Conclusion: Two bugs combined cause sessionId to be empty

### Bug 1 (Primary Root Cause): Client response structure check is wrong — silently swallows all server errors

**File**: eauty-mini-v1/src/services/wechat-auth.ts, lines 90-105

The client code checks esponse.success && response.data, but the server wechat-login.ts returns { status: "success"|"error", sessionId?: "..." }.

Bug chain:
1. Server returns HTTP 200 + { status: "error", message: "..." } (no sessionId field)
2. api-client.ts wraps as { success: true, data: { status: "error", message: "..." } }
3. Client checks response.success (true) && response.data (exists) → enters if block
4. data.sessionId = undefined (error response has no such field) → this.serverSessionId = null
5. if (null) → setStorage never called → sessionId never written to storage
6. Function returns { success: true, sessionId: null } (false success)
7. user-service.ts sees success=true, no error logged, no save

Trigger scenarios:
- Server WECHAT_APP_ID / WECHAT_APP_SECRET not configured
- WeChat code2session fails (code expired or reused)
- D1 database error

Why it is silent:
- wechat-auth.ts catch block only triggers on network exceptions (Promise reject)
- Server normal HTTP 200 + { status: "error" } goes through the if block but sessionId is null
- Caller initializeGuestUser() sees success=true, does not log error

---

### Bug 2 (Secondary Root Cause): Server updateToWechatSession called with wrong argument

**File**: cloudflare-worker/functions/api/wechat-login.ts, line 103

`
sessionRecord = await sessionService.updateToWechatSession(guestUserId, userId, openid);
`

Function signature expects sessionId as first parameter, but receives guestUserId (format: user_xxx).
guestUserId is not found in KV, returns null, falls back to createAuthSession to create new session.
This bug does not directly cause sessionId to be empty, but breaks guest session merge logic.

---

### Bug 3 (Server Syntax Error): index.ts missing closing braces in multiple places

**File**: cloudflare-worker/functions/index.ts

| Line Range | Missing |
|-----------|---------|
| 60-72 | /api/wechat/login if block missing } |
| 75-200+ | /api/analyze if block missing multiple } |
| 279-285 | /api/wechat/bind if block missing } |
| 286-292 | /api/creator/apply if block missing } |
| 385-395 | /api/beauty/analysis/task GET block missing } |

If redeployed from source, Cloudflare Workers compilation will fail and service becomes completely unavailable.
If the current real device can access the API, an older working version is already deployed and this bug is in source only.

---

## Call Chain Trace

### First launch (no stored session)
app.tsx useEffect
  → window.__initGuestUser()
  → userService.initializeGuestUser()
    → stored = null (no beauty_user_session)
    → createGuestUser() → generates guestId, userId
    → wechatAuthService.performServerLogin(userId, guestId)
      → getValidLoginCode() → wx.login() → gets code
      → api.post("/api/wechat-login", { code, guestUserId, guestId })
        → Server returns HTTP 200
          ├─ Success: { success: true, data: { status: "success", sessionId: "xxx" } }
          └─ Failure: { success: true, data: { status: "error", message: "..." } }  ← sessionId missing
      → Client: response.success=true, response.data.sessionId=undefined → serverSessionId=null
      → setStorage not called → sessionId not written
      → Returns { success: true, sessionId: null }
    → initializeGuestUser() returns guest profile (no sessionId)

### Second launch (has stored guest session, no sessionId)
app.tsx useEffect
  → userService.initializeGuestUser()
    → stored = beauty_user_session (has guest session)
    → tryRestoreServerSession(stored)
      → existingSid = getStorage("sessionId") → null
      → performServerLogin(userId, guestId)
        → Same as above, if server code2session fails → sessionId remains null
      → catch → console.warn("Server session restoration failed")
    → sessionId remains null

---

## Why wx.getStorageSync('sessionId') is still empty

Direct cause: setStorage("sessionId", sessionId) was never successfully called.

Root cause: wechat-auth.ts performServerLogin() checks response.success (true for HTTP 200) instead of response.data.status (server business status). When the server returns { status: "error" }, data.sessionId is undefined, setStorage is skipped, and sessionId is never written to storage.

---

## Real Device Verification Steps

In WeChat DevTools console:
1. Check performServerLogin result log:
   Look for: [WechatAuth] serverSessionId: null  ← if null printed, Bug 1 confirmed

2. Check actual server response:
   Temporarily add in api-client.ts wxRequest success callback:
   console.log("[api-client] wechat-login raw response:", JSON.stringify(res.data))

3. Check storage state:
   wx.getStorageSync('sessionId')   → should be null
   wx.getStorageSync('beauty_user_session') → should be object with guestId

---

## Fix Direction

1. Bug 1: wechat-auth.ts should check response.data.status === "success" not just response.success
2. Bug 2: wechat-login.ts should look up existing sessionId by guestId before calling updateToWechatSession
3. Bug 3: Fix all missing closing braces in index.ts if redeploying