# AI Beauty Mini Production Audit

**报告编号：** Task-BeautyMini-043
**审计日期：** 2026-07-31
**审计范围：** beauty-mini-v1 + cloudflare-worker + D1 Schema（Task-037 ～ Task-042 完成后的完整项目）
**审计方式：** 纯静态代码分析，不修改任何代码

---

## 总评分：58 / 100

**评级：B — 灰度测试**

核心业务链路框架完整，身份体系已升级，但存在 3 个 P0 阻断问题（含一个直接导致小程序审核拒绝的文案），以及若干 P1 安全风险需要修复后才能正式商用。

---

## 当前状态

| 维度 | 状态 | 说明 |
|------|------|------|
| 用户打开小程序 | ✅ PASS | app.json 配置完整，4 个核心页面 + privacy/agreement 已接入 |
| 游客初始化 | ✅ PASS | userService.createGuestUser() 自动创建 guestId+userId |
| 微信登录 | ✅ PASS (已集成) | wechat-auth.ts → wechat-login.ts 完整 code2session 流程；WECHAT_APP_ID/SECRET 需通过 wrangler secret 配置 |
| Session 生成 | ✅ PASS | KV SessionService，30 天 TTL，自动刷新 |
| 图片选择 | ✅ PASS | wx.chooseImage + UploadService |
| wx.uploadFile | ⚠️ PARTIAL | wx.uploadFile 已调用 /api/upload，但 URL 拼接有 bug（见 P0-#2） |
| Cloudflare Worker | ✅ PASS | functions/index.ts 完整路由处理 |
| R2 图片保存 | ✅ PASS | /api/upload POST 调用 IMAGE_BUCKET.put() |
| FaceAnalysisEngine | ⚠️ PARTIAL | 使用 MediaPipeFaceDetector（固定 landmarks 模拟），非真实图像推理 |
| BeautyFaceMetrics | ✅ PASS | 从 MediaPipe landmarks 计算 faceRatio/eyeSize/noseRatio 等 |
| BeautyReportGenerator | ✅ PASS | 基于脸型 × 眼型 × 肤色的规则引擎（确定性输出） |
| D1 beauty_reports | ✅ PASS | reportRepository.ts 完整 CRUD |
| Result 页面展示 | ⚠️ PARTIAL | 存在 devMode mock 回退路径（见 P0-#3） |

---

## 已完成能力（Task-037 ～ 042）

- **Task-037 Step 3**：图片持久化链路 — wx.uploadFile → /api/upload → R2 → imageUrl 存入 beauty_reports
- **Task-037 Step 4**：用户身份体系 — guest session + WeChat 绑定预留
- **Task-037 Step 5**：AI 报告生成真实化 — BeautyReportGenerator 规则引擎替代固定模板
- **Task-038**：MVP 稳定化 — 修复 undefined setImageUrlForNavigate 等运行时错误
- **Task-039**：微信小程序生产适配 — 权限声明、域名配置、隐私页面
- **Task-040**：生产数据链路闭环修复 — report.ts 接入 D1 持久层
- **Task-041**：基础可信身份体系 — KV SessionService + wechat-login code2session 完整流程
- **Task-042**：（参考文档 IDENTITY_UPGRADE_V1）Session 升级完成

---

## P0 阻断问题（必须修复才能上线）

### P0-1 [CRITICAL] 报告越权访问 — GET /api/reports/:id 无 owner 校验
**位置：** `cloudflare-worker/functions/index.ts`（约第 180 行附近）
```typescript
// 当前实现（不安全）：
const report = await repo.findById(reportMatch[1]);
// 缺少：if (report?.userId !== userId) return 403;
```
**风险：** 任何持有有效 X-Session-Id 的用户，通过遍历 reportId 即可读取其他用户的全部分析报告（含面部照片 URL）。
**修复建议：** 在 findById 后增加 owner 校验，或修改 repository 层支持 findByOwner。

---

### P0-2 [CRITICAL] 上传后 imageUrl 丢失 — analyze 流程断裂
**位置：** `beauty-mini-v1/src/pages/upload/index.tsx`（第 108 行 useEffect 中）
```typescript
// result 变量定义在 handleConfirmUpload 闭包内（第 74 行），useEffect 中不可访问
navigate({ url: "/pages/analyzing?uploadId=" + uploadIdForNavigate +
           "&imageUrl=" + encodeURIComponent(result.imageUrl || "") });
//                                                          ^^^^^^ -> undefined
```
**影响：** analyzing 页面 imageUrl 为 undefined → analyzeService.analyze() 不执行 MediaPipe 检测 → 后端 fallback 使用 imageUrl 哈希生成 metrics（非真实人脸数据）。
**修复建议：** 将 imageUrl 存入组件 state（useState），在 useEffect 中读取该 state。

---

### P0-3 [CRITICAL] 首页存在审核拒绝风险文案
**位置：** `beauty-mini-v1/src/pages/home/index.tsx:57`
```html
<p>本功能仅用于V1版本演示，不接入真实AI服务</p>
```
**影响：** 微信小程序审核会检测此类文案并拒绝上线（"虚假宣传 / Demo 功能冒充真实产品"）。
**修复建议：** 上线前删除或替换为正式产品描述文案。

---

## P1 风险问题（影响安全/体验，建议尽快修复）

### P1-1 [HIGH] 微信登录凭据未配置
`wrangler.toml` 中无 `WECHAT_APP_ID` / `WECHAT_APP_SECRET`。
- 需在 Cloudflare 后台执行：`wrangler secret put WECHAT_APP_ID` 和 `wrangler secret put WECHAT_APP_SECRET`
- 当前状态：本地开发不触发，生产部署后 wechat-login 端点返回 500 "微信登录服务未配置"

### P1-2 [HIGH] GET /api/reports 无鉴权
`cloudflare-worker/functions/index.ts` 中 `/api/reports` 端点直接使用解析出的 userId 查询，
但无 session 有效性校验（sessionId 可为空时 userId 为 guest 随机字符串）。
- 未登录用户可遍历报告列表（但每条报告的 owner 校验缺失是 P0-1 的问题）

### P1-3 [MEDIUM] root d1-schema.sql 与 migrations 不一致
`d1-schema.sql`（根目录）定义：
- `beauty_reports.id INTEGER PRIMARY KEY AUTOINCREMENT`（与 migration 001 的 TEXT PK 冲突）
- 缺少 `face_metrics_json`、`image_url`、`thumbnail_url`、`wechat_open_id`、`session_id` 字段
- `beauty_tasks` 有语法错误：`idx_task_report_on beauty_tasks(report_id)`（多余单词 `on`）

**建议：** 上线前删除根目录 `d1-schema.sql` 或更新为与 migrations 一致。

### P1-4 [MEDIUM] profile.ts 返回乱码数据
`cloudflare-worker/functions/api/profile.ts` 和 `beauty-mini-v1/src/services/profile.ts` 均返回硬编码 mock 数据，
且中文字符出现乱码（编码问题：`寮犱笁` / `瀵姳绗?`）。
- 影响：profile 页面展示乱码，用户体验差

### P1-5 [MEDIUM] 废弃文件未清理
- `cloudflare-worker/functions/index.ts.bak`（16181 bytes）— 备份文件应删除
- `cloudflare-worker/workers/index.js`（693 bytes）— 旧版 JS 入口，已被 functions/index.ts 替代，应删除

### P1-6 [MEDIUM] 支付系统仅为 stub
`beauty-mini-v1/src/services/payment.ts` 中 `WeChatPaymentAdapter` 三个方法（createPayment/verifyPayment/handleCallback）
均未实现真实微信支付调用，仅返回模拟数据。
- 影响：beauty-pro 升级无法真正完成付费

### P1-7 [LOW] report.ts devMode fallback 在微信小程序中仍可能触发
```typescript
const isDevMode = !isWeChatMiniProgram() || reportId.startsWith("report_");
if (isDevMode) { report = this.generateMockReport(user); }
```
当 reportId 以 `report_` 开头时（正常生产 reportId 格式），在非小程序环境（H5 调试）会走 mock。
在小程序环境中不会触发，但这是一个潜在的误导路径。

---

## P2 优化项

1. **Code Quality:** `report.ts`、`token.ts`、`beauty-token-service.ts`、`order.ts` 中共计 30+ 处 `any` 类型
2. **MediaPipe 实现:** `MediaPipeFaceDetector` 使用硬编码 landmarks，非真实图像推理（与 Task-036 审计一致）
3. **ShareCard:** onShare 回调为 `alert("分享功能将在V2版本实现")`
4. **缺少 HSTS / CSP:** Cloudflare Worker 未设置安全响应头
5. **Token 系统无获取途径:** 只有 generateDemoTokens 调试函数，无正常获取流程
6. **BeautyReportGenerator 确定性:** 相同 metrics 产生相同报告（规则引擎特性，非 bug，但需注意）

---

## 上线建议

### 阶段一：阻塞修复（必须）
1. **P0-1:** 在 `GET /api/reports/:id` 和 `GET /api/reports` 增加 owner 校验
2. **P0-2:** 修复 upload/index.tsx 中 imageUrl 闭包作用域问题
3. **P0-3:** 删除首页"本功能仅用于V1版本演示"文案

### 阶段二：灰度发布前（推荐）
4. 配置 `wrangler secret put WECHAT_APP_ID` 和 `WECHAT_APP_SECRET`
5. 清理 `functions/index.ts.bak` 和 `workers/index.js`
6. 修复 profile.ts / profile service 乱码问题
7. 更新根目录 `d1-schema.sql` 或移除

### 阶段三：正式商用前（建议）
8. 实现真实 MediaPipe WebAssembly 人脸检测（替换硬编码 landmarks）
9. 完成微信支付接入（payment.ts）
10. 实现真实分享功能（wx.shareAppMessage）
11. 接入监控/错误上报（Sentry 等）
12. 统一 TypeScript strict 模式，消除 `any`

---

## 身份安全等级：B

| 维度 | 评级 | 说明 |
|------|------|------|
| Session 机制 | A | KV-based 30天 TTL，自动刷新，401 自动清除 |
| 微信登录 | A | code2session 完整流程，支持 guest 合并 |
| 报告越权防护 | D | GET /api/reports/:id **无 owner 校验** |
| userId 防伪造 | B | X-Session-Id 优先，X-User-Id 为 fallback（不信任） |
| 无 session 访问 | C | 无 session 时生成随机 guestId，无 401 返回 |

**综合等级：B**（Session 机制完善，但报告读权限限缺失拉低整体评级）

---

## 数据库一致性审计

| 迁移文件 | 状态 | 说明 |
|----------|------|------|
| 001_create_beauty_reports_table.sql | ✅ | TEXT PK，无 image_url 字段 |
| 002_add_image_url_columns.sql | ✅ | 添加 image_url, thumbnail_url |
| 003_create_beauty_tasks_table.sql | ⚠️ | 有语法错误（`idx_task_report_on`） |
| 004_add_sessions_table.sql | ✅ | 创建 user_sessions 表（**注意：** 代码实际用 KV 存储 session，此表未被代码使用） |
| 005_add_report_session_tracking.sql | ⚠️ | 添加 wechat_open_id, session_id 列（**注意：** 代码未使用这两列） |

**代码 vs 数据库字段一致性：**
- `reportRepository.ts` 写入 `face_metrics_json`、`analysis_json` — ✅ 迁移 001 已包含
- `reportRepository.ts` 读取 `image_url`、`thumbnail_url` — ✅ 迁移 002 已添加
- `beauty_reports` 的 `id` 类型：迁移 001 定义为 TEXT，`d1-schema.sql` 根文件定义为 INTEGER — ⚠️ 冲突

---

## AI 真实性分类

| 组件 | 类型 | 说明 |
|------|------|------|
| MediaPipeFaceDetector | 模拟数据 | 硬编码 landmarks，非真实图像推理 |
| RemoteFaceDetector | 规则 fallback | 调用 /analyze 接口，若失败回退到模拟数据 |
| FaceAnalysisEngine | 混合 | 优先 MediaPipe → 回退 Remote → 抛出错误 |
| 后端 analyze fallback | 确定性算法 | 基于 imageUrl 哈希生成 metrics（同一图片同一结果） |
| BeautyReportGenerator | 规则引擎 | 基于 faceShape/eyeType/skinTone 的确定性规则 |
| MockFaceDetector | 测试工具 | 仅在测试中使用，生产未引用 |

**结论：** 生产路径无"随机数据"，但无真实 AI 人脸检测。输出为确定性规则引擎结果，非图像理解。

---

## 小程序审核风险

| 检查项 | 状态 | 说明 |
|--------|------|------|
| 隐私权限声明 | ✅ | chooseImage, chooseMedia 已声明 |
| 相机权限 | ✅ | scope.camera 已声明，有 desc |
| 相册权限 | ✅ | scope.writePhotosAlbum 已声明，有 desc |
| request 域名 | ⚠️ | 生产域名 `api.ai-beauty-china.com` 需在微信公众平台配置 |
| uploadFile 域名 | ⚠️ | 同上，需配置服务器域名白名单 |
| 隐私政策页 | ✅ | pages/privacy 存在，内容完整 |
| 用户协议页 | ✅ | pages/agreement 存在，内容完整 |
| 审核风险文案 | ❌ | home/index.tsx:57 "本功能仅用于V1版本演示，不接入真实AI服务" |
| "Demo"/"测试版"文案 | ❌ | 同上 |

---

## 商业功能隔离审计

| 功能 | 状态 | 说明 |
|------|------|------|
| Token 系统 | ✅ 独立 | token.ts 完整实现，与核心分析链路解耦 |
| Entitlement | ✅ 独立 | entitlement.ts 基于本地存储，不影响核心链路 |
| 支付预留 | ⚠️ Stub | payment.ts 接口存在但未实现真实微信支付 |
| 分享功能 | ⚠️ Stub | ShareCard onShare 为 alert 占位 |
| 达人推荐 | ✅ 独立 | creators.ts 从 D1 查询，与报告生成解耦 |
| 商品推荐 | ✅ 独立 | products.ts 硬编码数据，与报告生成解耦 |
| free/report 权限 | ✅ 正常 | content-permission.ts 三级权限控制完整 |
| beauty-pro 权限 | ✅ 正常 | 基于 entitlement + token 消耗 |

---

## 代码质量审计

| 检查项 | 结果 |
|--------|------|
| `any` 滥用 | ⚠️ 约 30+ 处（report.ts:6, token.ts:8, beauty-token-service.ts:10, order.ts:6） |
| 重复 Mock | ⚠️ profile.ts（服务端）和 profile service（客户端）均有 mock 数据 |
| 死代码 | ⚠️ `workers/index.js`（旧入口）、`index.ts.bak`（备份） |
| 乱码 | ❌ `profile.ts` 返回乱码中文（`寮犱笁`） |
| 未使用 service | ✅ 无明显未使用 service |

---

## 下一阶段计划

1. **Task-044:** 修复 P0-1（报告 owner 校验）+ P0-2（imageUrl 闭包 bug）
2. **Task-045:** 修复 P0-3（首页审核文案）+ P1-5（清理废弃文件）
3. **Task-046:** 接入真实 MediaPipe Face Detection WebAssembly
4. **Task-047:** 配置微信登录凭据 + 域名白名单
5. **Task-048:** 实现真实微信支付接入
6. **Task-049:** 小程序提审 + 灰度发布

