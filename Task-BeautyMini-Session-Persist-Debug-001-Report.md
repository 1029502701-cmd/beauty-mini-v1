# Task-BeautyMini-Session-Persist-Debug-001-Report

## 当前 Session 生命周期

`
App 启动
  └─ useEffect → window.__initGuestUser() → userService.initializeGuestUser()
       ├─ 有 stored session → tryRestoreServerSession()
       │    └─ wx.getStorageSync('sessionId') → 存在则 return
       │    └─ 不存在 → wechatAuthService.performServerLogin()
       │         └─ wx.setStorageSync('sessionId', sessionId)
       └─ 无 stored session → createGuestUser() + performServerLogin()
            └─ wx.setStorageSync('sessionId', sessionId)

用户点击上传
  └─ uploadImage()
       ├─ userService.getServerSessionId() → wx.getStorageSync('sessionId')
       │    └─ null → 返回错误，不发起上传（修复后）
       └─ injectSessionHeader(headers) → headers['X-Session-Id'] = sessionId
  └─ wx.uploadFile(header: { 'X-Session-Id': sessionId, ... })
`

## 断点位置

| # | 文件 | 行号 | 问题 |
|---|------|------|------|
| 1 | pp.tsx | L14-20 | initUser() fire-and-forget，upload 页可在初始化未完成时触发 |
| 2 | user-service.ts | L58-61 | 	ryRestoreServerSession 读 storage 两次，existingSid 结果被覆盖 |
| 3 | upload.ts | L76-77 | 无 sessionId 防御检查，空 header 直接上传 |
| 4 | user-service.ts + wechat-auth.ts | L6/L31 | 存储 key 为 "beauty_session_id"，与验证要求 "sessionId" 不一致 |

## 根因

**竞态条件（Race Condition）+ Key 不一致**：

1. pp.tsx 中 useEffect 调用 initUser() 时不 await，initializeGuestUser() 是异步的。
2. 用户快速跳转上传页并触发 uploadImage() 时，userService.getServerSessionId() 返回 
ull，因为 setStorage 还未执行完成。
3. injectSessionHeader 无 session 时静默跳过，导致 X-Session-Id 为空发送到服务端，服务端拒绝请求。
4. 存储 key 为 "beauty_session_id"，与验证脚本 wx.getStorageSync('sessionId') 不匹配。

## 最小修复代码

### 修复 1 — key 统一为 "sessionId"（user-service.ts + wechat-auth.ts）

`	ypescript
// 修复前
const SESSION_ID_KEY = "beauty_session_id";
const SESSION_STORAGE_KEY = "beauty_session_id";

// 修复后
const SESSION_ID_KEY = "sessionId";
const SESSION_STORAGE_KEY = "sessionId";
`

### 修复 2 — user-service.ts：消除冗余双重读取

`	ypescript
// 修复前
private async tryRestoreServerSession(session: GuestSession): Promise<void> {
  const existingSid = getStorage<string>(SESSION_ID_KEY, null);
  console.log("[UserService] tryRestoreServerSession START, ...");
  const sessionId = getStorage<string>(SESSION_ID_KEY, null); // 冗余，覆盖 existingSid
  if (sessionId) return;
  ...
}

// 修复后
private async tryRestoreServerSession(session: GuestSession): Promise<void> {
  const existingSid = getStorage<string>(SESSION_ID_KEY, null);
  if (existingSid) return;
  if (!isWeChatMiniProgram()) return;
  try {
    await wechatAuthService.performServerLogin(session.userId, session.guestId);
  } catch (e) {
    console.warn("[UserService] Server session restoration failed (non-fatal):", e);
  }
}
`

### 修复 3 — app.tsx：暴露初始化 Promise

`	ypescript
// 修复前
useEffect(() => {
  async function initUser() {
    try {
      const user = await userService.initializeGuestUser();
    } catch (err) {
      console.error("[App] Failed to initialize user:", err);
    }
  }
  initUser();
}, []);

// 修复后
let _initPromise: Promise<void> | null = null;
window.__initGuestUser = () => {
  if (!_initPromise) {
    _initPromise = (async () => {
      try {
        await userService.initializeGuestUser();
      } catch (err) {
        console.error("[App] Failed to initialize user:", err);
      }
    })();
  }
  return _initPromise;
};

const App = () => {
  useEffect(() => {
    window.__initGuestUser();
  }, []);
  // ...
};
`

### 修复 4 — upload.ts：上传前 guard 检查 sessionId

`	ypescript
// 修复前
const sessionHeaders: Record<string, string> = {};
injectSessionHeader(sessionHeaders);

// 修复后
const sessionHeaders: Record<string, string> = {};
const sid = userService.getServerSessionId();
if (!sid) {
  resolve({ success: false, message: '用户未初始化，请返回首页后重试' } as UploadResult);
  return;
}
injectSessionHeader(sessionHeaders);
`

## 验证

`javascript
// 微信开发者工具控制台执行
wx.getStorageSync('sessionId')
// 预期：非空字符串，如 "sess_xxxxxxxxxxxx"

// 确认全链路 key 一致
// wechat-auth.ts:   SESSION_STORAGE_KEY = "sessionId" → wx.setStorageSync('sessionId', sid)
// user-service.ts:  SESSION_ID_KEY = "sessionId"      → getStorage('sessionId') / setStorage('sessionId')
// api-client.ts:    getServerSessionId() → getStorage('sessionId') → X-Session-Id header
// upload.ts:        getServerSessionId() → guard → injectSessionHeader → wx.uploadFile
`

## 修改文件清单

| 文件 | 修改类型 |
|------|----------|
| src/app.tsx | 暴露 window.__initGuestUser()，避免重复初始化 |
| src/services/user-service.ts | 移除冗余双重读取；SESSION_ID_KEY 改为 "sessionId" |
| src/services/wechat-auth.ts | SESSION_STORAGE_KEY 改为 "sessionId"（与 user-service 一致） |
| src/services/upload.ts | 添加 sessionId 存在性 guard，防止空 header 上传 |