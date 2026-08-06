# Task-BeautyMini-Upload-Chain-Verify-002-Report

## 目标

修复微信小程序点击上传照片后提示失败的问题，验证完整上传链路。

前置条件：`sessionId` 已修复（Task-BeautyMini-Session-Persist-Fix-001）。

---

## 检查结果

### 1. 上传按钮触发

**文件**：`beauty-mini-v1/src/pages/upload/index.tsx`

- `handleConfirmUpload` 在预览界面「开始AI分析」按钮点击时调用
- 先执行图片校验（格式/大小）和人脸检测
- 调用 `uploadService.uploadImage(filePath, fileName, fileSize)`
- 成功后设置 `phase = "analyzing"`，导航到 `/pages/analyzing?uploadId=...&imageUrl=...`

**结论**：✅ 正常

---

### 2. 上传请求 URL

**文件**：`beauty-mini-v1/src/services/upload.ts:85`

```
url: getAPIBase() + "/api/beauty/upload"
```

- 开发/生产均指向 `https://beauty-api-pages.pages.dev`
- 路径：`/api/beauty/upload`

**结论**：✅ 正确

---

### 3. 请求 Header — X-Session-Id

**文件**：`beauty-mini-v1/src/services/upload.ts:76-82`

```typescript
const sessionHeaders: Record<string, string> = {};
const sid = userService.getServerSessionId();   // 读取 sessionId
if (!sid) {
  resolve({ success: false, message: "用户未初始化，请返回首页后重试" });
  return;
}
injectSessionHeader(sessionHeaders);             // 注入 X-Session-Id
```

- `userService.getServerSessionId()` 读取 `wx.getStorageSync("sessionId")`
- `injectSessionHeader()` 将 session ID 写入 `X-Session-Id` header
- 无 sessionId 时提前返回错误，不发起上传

**结论**：✅ 正确

---

### 4. multipart/form-data 字段

**文件**：`beauty-mini-v1/src/services/upload.ts:86-89`

```typescript
wx.uploadFile({
  url: getAPIBase() + "/api/beauty/upload",
  filePath,
  name: "image",               // ← 字段名 image
  formData: { uploadId: "upload_" + Date.now() },
  header: { ...sessionHeaders },// ← 不手动设置 Content-Type
  timeout: 30000,
  ...
});
```

- `name: "image"` 与后端 `formData.get('image')` 匹配
- **修复**：移除了手动设置的 `Content-Type: multipart/form-data`
  - 原因：`wx.uploadFile` 需由框架自动添加含 boundary 的 Content-Type，
    手动设置会丢失 boundary，导致后端 `parseFormData` 返回 null 并 400
- **同步修复**：`api.ts` 中的 `uploadFile()` 函数同样移除了手动 Content-Type

**结论**：✅ 修复后正确

---

### 5. 后端读取字段

**文件**：`beauty-api-pages/functions/api/beauty/upload.ts:28`

```typescript
const imageFile = formData.get('image') as File | null;
```

- 使用 `formData.get('image')`，与前端 `name: "image"` 完全匹配

**结论**：✅ 正确

---

### 6. R2 上传

**文件**：`beauty-api-pages/modules/beauty-ai/upload-service.ts`

```typescript
const imageKey = `beauty/uploads/${userId}/${timestamp}.jpg`;
await env.IMAGE_BUCKET.put(imageKey, imageBuffer, {
  httpMetadata: { contentType }
});
return { uploadId, imageKey };
```

- 生成 R2 key：`beauty/uploads/{userId}/{timestamp}.jpg`
- 写入 `IMAGE_BUCKET`，携带 contentType
- 返回 `{ uploadId, imageKey }`

**结论**：✅ 正确

---

### 7. 错误消息保留真实内容

**修复前**：所有非 200 状态码统一返回 `"上传失败，请重试"`

**修复后**：`upload.ts` success 回调按状态码分别处理：

| 状态码 | 处理方式 | 展示给用户的消息 |
|--------|----------|------------------|
| 200 + `data.success=false` | 读取 `data.error` | 后端返回的具体错误 |
| 401 | 读取 `data.error`，fallback | `"会话已过期，请返回首页重新登录"` |
| 400 | 读取 `data.error`，fallback | `"图片格式不正确，请重新选择"` |
| 500+ | 静态消息 | `"服务器繁忙，请稍后重试"` |
| fail 回调（超时） | 检查 errMsg | `"上传超时"` |
| fail 回调（其他） | 静态消息 | `"上传失败"` |

后端返回的 JSON 格式：
- 401：`{ error: "Authentication required" }` 或 `{ error: "Invalid session" }`
- 400：`{ error: "Content-Type must be multipart/form-data" }` 或 `{ error: "Field 'image' is required" }`
- 500：`{ error: "Upload failed" }`

**结论**：✅ 修复后正确

---

## 修改文件清单

| 文件 | 变更 |
|------|------|
| `src/services/upload.ts` | 1. 移除 `wx.uploadFile` 中手动设置的 `Content-Type: multipart/form-data` header<br>2. 成功回调增加 401/400/500 状态码分支，保留真实错误信息 |
| `src/services/api.ts` | 移除 `uploadFile()` 中手动设置的 `Content-Type: multipart/form-data` header |

**未修改的文件**：
- `src/app.tsx` — 启动流程正常
- `src/services/user-service.ts` — sessionId key 已在 Fix-001 中修复
- `src/services/wechat-auth.ts` — sessionId key 已在 Fix-001 中修复
- `src/services/api-client.ts` — 无需修改
- `src/pages/upload/index.tsx` — 无需修改
- `src/pages/analyzing/index.tsx` — 无需修改
- `beauty-api-pages/functions/api/beauty/upload.ts` — 无需修改
- `beauty-api-pages/modules/beauty-ai/upload-service.ts` — 无需修改

---

## 完整调用链

```
[用户点击「开始AI分析」]
  ↓
upload/index.tsx: handleConfirmUpload()
  ├─ imageValidator.validateImage()    ✅ 格式/大小校验
  ├─ imageValidator.detectFace()       ✅ 人脸检测
  └─ uploadService.uploadImage()
       ├─ getServerSessionId()         ✅ sessionId 存在（Fix-001）
       ├─ injectSessionHeader()        ✅ X-Session-Id 注入
       └─ wx.uploadFile({
            url: "/api/beauty/upload",
            name: "image",
            header: { X-Session-Id: ... }  ✅ 无手动 Content-Type
          })
            ↓
[后端 beauty-api-pages/functions/api/beauty/upload.ts]
  ├─ parseFormData()                   ✅ multipart 解析
  ├─ formData.get('image')             ✅ 字段匹配
  ├─ extractSessionId(request)         ✅ 读取 X-Session-Id
  ├─ USER_CACHE.get('session:...')     ✅ KV 验证
  └─ uploadImage() → IMAGE_BUCKET.put() ✅ R2 上传
  返回: { success: true, uploadId, imageUrl, imageKey }
            ↓
upload.ts success callback
  ├─ statusCode 200 + data.success     → { success, uploadId, imageUrl }
  ├─ statusCode 401                   → { error: "会话已过期..." }
  ├─ statusCode 400                   → { error: "图片格式不正确..." }
  └─ statusCode >= 500                → { error: "服务器繁忙..." }
            ↓
upload/index.tsx
  ├─ setUploadId(result.uploadId)
  ├─ setImageUrl(result.imageUrl)
  ├─ setPhase("analyzing")
  └─ navigate("/pages/analyzing?uploadId=...&imageUrl=...")
            ↓
[analyzing 页面开始 AI 分析流程]
```

---

## 验证方式

真机测试步骤：
1. 打开小程序，确认首页显示「正在初始化用户身份...」
2. 进入首页后，点击「上传照片」
3. 选择或拍摄照片 → 预览界面
4. 点击「开始AI分析」
5. 上传成功后进入「照片已确认」→「启动AI美学分析...」
6. 完成后进入决策页面

关键检查点：
- `wx.getStorageSync('sessionId')` 返回非空值（Fix-001 已修复）
- 上传时请求 header 包含 `X-Session-Id`
- 上传成功返回 `{ success: true, uploadId, imageUrl }`
- 失败时显示具体错误而非统一 "上传失败"
