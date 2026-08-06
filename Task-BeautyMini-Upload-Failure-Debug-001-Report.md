# Task-BeautyMini-Upload-Failure-Debug-001 报告

**日期**: 2026-08-04  
**任务**: 诊断微信小程序真机点击"上传照片"后提示失败的问题  
**范围**: 前端 upload 页面 → uploadService → 后端 upload.ts → upload-service.ts  
**原则**: 只做诊断，不改架构

---

## 一、当前上传链路全貌

`
用户点击"开始AI分析"
    │
    ▼
index.tsx :: handleConfirmUpload()
    │
    ├─ Step 1: imageValidator.validateImage(filePath)
    │     检查: 文件扩展名(jpg/png/webp) + 文件大小(<5MB) + 分辨率(短边>=200px)
    │     ↓ 通过
    │
    ├─ Step 2: imageValidator.detectFace(filePath)
    │     canvas 像素级肤色检测 → 中心区域肤像素素占比 >= 8%
    │     catch 时: { hasFace: true, confidence: 0.5 }  ← 兜底放行
    │     ↓ 通过
    │
    └─ Step 3: uploadService.uploadImage(filePath, fileName, fileSize)
          │
          ├─ 本地二次验证(重复): 文件大小 + 扩展名
          │
          └─ wx.uploadFile({
               url: getAPIBase() + "/api/beauty/upload",
               filePath,
               name: "image",
               formData: { uploadId: "upload_" + Date.now() },
               header: { ...sessionHeaders, "Content-Type": "multipart/form-data" },  ← ⚠️ 问题点
               timeout: 30000,
               ...
             })
`

### 后端处理

`
POST /api/beauty/upload (upload.ts)
    │
    ├─ parseFormData(request)
    │     检查 Content-Type 包含 "multipart/form-data"
    │     返回 formData 或 null
    │
    ├─ 鉴权: extractSessionId(request) → X-Session-Id header
    │     查 KV: USER_CACHE.get('session:' + sessionId)
    │     ↓ 无 session → 401 "Authentication required"
    │
    ├─ 获取文件: formData.get('image')
    │     ↓ 为 null → 400 "Field 'image' is required"
    │
    └─ uploadImage(env, imageBuffer, userId, imageFile.type)
          写入 R2: beauty/uploads/{userId}/{timestamp}.jpg
          返回 { uploadId, imageKey }
`

### 鉴权初始化链路

`
App 启动 (app.tsx)
    │
    └─ userService.initializeGuestUser()
          ├─ 检查本地 session (getStorage('beauty_user_session'))
          ├─ 有 session → tryRestoreServerSession()
          │     检查 SESSION_ID_KEY ('beauty_session_id')，已有则跳过
          │     无则调用 performServerLogin()
          └─ 无 session → createGuestUser() → performServerLogin()
                ├─ wx.login() → 获取临时 code
                └─ POST /api/wechat-login { code, guestUserId, guestId }
                      → 返回 sessionId，存入 localStorage/KV
`

---

## 二、失败节点分析

### 🔴 P0 — 致命: wx.uploadFile 手动设置 Content-Type: multipart/form-data

**文件**: eauty-mini-v1/src/services/upload.ts:85

`	s
header: { ...sessionHeaders, "Content-Type": "multipart/form-data" },
`

**根因**:  
微信 wx.uploadFile 在小程序环境下，**不允许手动指定 Content-Type: multipart/form-data**。  
一旦手动设置该 header，微信会**不使用自动生成 boundary 的 multipart 格式**，而是以纯文本方式发送请求体，导致：

1. 请求体不是合法的 multipart/form-data
2. 后端 parseFormData() 虽然能匹配到 "multipart/form-data" 字符串
3. 但 equest.formData() 解析失败或返回空字段
4. ormData.get('image') 返回 
ull
5. 后端返回 400 "Field 'image' is required"
6. 前端 wxRes.data 解析后 data.success 为 false
7. 进入 else 分支 → esolve({ success: false, message: "上传失败，请重试" })

**为什么只在真机/生产环境复现**:  
- 开发者工具可能对 Content-Type 有更宽松的解析行为
- 真机严格遵循微信小程序上传规范

**微信官方文档说明**:  
> 使用 wx.uploadFile 时，**不要手动设置** Content-Type，SDK 会自动设置并添加 boundary。

---

### 🟡 P1 — 次要: uploadId formData 字段名与后端返回字段错位

**文件**: eauty-mini-v1/src/services/upload.ts:84

`	s
formData: { uploadId: "upload_" + Date.now() },
`

前端在 formData 里传了 uploadId，但后端 upload.ts 并没有读取这个字段，而是自己生成 upload__。

前端 success 回调里解构的 uploadId 来自后端响应，这里没有实际 bug，但 formData 里的 uploadId 是无用字段，浪费带宽。

---

### 🟡 P1 — 次要: injectSessionHeader 中 equire() 可能导致真机 undefined

**文件**: eauty-mini-v1/src/services/api-client.ts:94, 287

`	s
const userService = require("./user-service").default;
`

使用 CommonJS equire() 在 Taro 编译产物中可能因模块系统不匹配导致 userService 为 undefined，进而 getServerSessionId() 调用报错，sessionHeaders 为空对象。

**影响**: 上传请求缺少 X-Session-Id header → 后端返回 401 → 上传失败。

**验证方法**: 在真机调试控制台搜索 "[api-client] injectSessionHeader: sid="，若输出 sid=NULL 则确认此问题。

---

### 🟢 P2 — 轻微: 上传失败后 phase 未重置为 "preview"

**文件**: eauty-mini-v1/src/pages/upload/index.tsx:50

`	s
if (result.success && result.uploadId) {
    ...
} else {
    setPhase("failed");  // ← 停留在 failed 状态
    setError(result.message || "上传失败，请重试");
}
`

用户在 failed 界面点击"重新上传"会调用 handleRetry()，它只重置 phase 为 "preview" 但不重置 selectedImage。  
如果用户直接点重试而没有重新选图，会用同一张图片再次上传，可能再次失败。

---

## 三、根因总结

| 优先级 | 根因 | 文件 | 行号 | 影响 |
|--------|------|------|------|------|
| **P0** | wx.uploadFile 手动设置 Content-Type: multipart/form-data，导致微信不使用合法 multipart 格式，后端无法解析 image 字段 | src/services/upload.ts | 85 | 所有真机上传必定失败 |
| **P1** | injectSessionHeader 使用 equire() 可能返回 undefined，导致 X-Session-Id 缺失 | src/services/api-client.ts | 94, 287 | 部分真机可能 401 |
| **P2** | 重试时未重置 selectedImage | src/pages/upload/index.tsx | 55 | 用户体验问题 |

**主要根因**: upload.ts:85 的 Content-Type 手动设置是上传失败的直接原因。

---

## 四、修复方案（最小改动）

### 修复 P0 — 删除手动 Content-Type（2行改动）

**文件**: eauty-mini-v1/src/services/upload.ts

`diff
  wx.uploadFile({
    url: getAPIBase() + "/api/beauty/upload",
    filePath,
    name: "image",
    formData: { uploadId: "upload_" + Date.now() },
-   header: { ...sessionHeaders, "Content-Type": "multipart/form-data" },
+   header: sessionHeaders,
    timeout: 30000,
`

微信 SDK 会自动设置正确的 Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...

### 修复 P1 — 将 require() 改为 import（1行改动）

**文件**: eauty-mini-v1/src/services/api-client.ts

`diff
  function getSessionHeader(): { "X-Session-Id": string } | null {
    try {
-     const userService = require("./user-service").default;
+     const userService = (await import("./user-service")).default;
      const sessionId = userService.getServerSessionId();
`

> ⚠️ 注意：getSessionHeader 需改为 async 或保持同步但用静态导入。  
> 更安全的做法是在文件顶部直接 import userService from "./user-service";，而非懒加载 require。

### 修复 P2 — 重试时重置 selectedImage（2行改动）

**文件**: eauty-mini-v1/src/pages/upload/index.tsx

`diff
  const handleRetry = () => {
    setPhase("preview");
    setError(null);
+   setSelectedImage(null);
+   setPreviewUrl(null);
  };
`

---

## 五、临时诊断日志建议

在确认根因前，可在以下位置加临时 console.log 验证：

### 前端 — upload.ts

`	s
// upload.ts 第80行附近，wx.uploadFile 之前
console.log("[upload-debug] url:", getAPIBase() + "/api/beauty/upload");
console.log("[upload-debug] filePath:", filePath);
console.log("[upload-debug] fileName:", fileName);
console.log("[upload-debug] fileSize:", fileSize);
console.log("[upload-debug] sessionHeaders:", JSON.stringify(sessionHeaders));
`

`	s
// wx.uploadFile success 回调内
success: (wxRes) => {
  console.log("[upload-debug] response status:", wxRes.statusCode);
  console.log("[upload-debug] response data:", wxRes.data);
  ...
}
`

### 后端 — upload.ts

`	s
// upload.ts 第18行附近，parseFormData 之前
console.log("[upload-debug] request content-type:", request.headers.get('content-type'));
`

`	s
// upload.ts 第28行附近
console.log("[upload-debug] imageFile exists:", !!imageFile, "name:", imageFile?.name, "size:", imageFile?.size);
`

---

## 六、验证步骤

1. 先修复 P0（删除手动 Content-Type）
2. 重新编译并上传小程序
3. 真机测试：选择图片 → 点击"开始AI分析"
4. 观察是否成功跳转到分析页面
5. 若仍有问题，检查 P1 的 session header 日志
