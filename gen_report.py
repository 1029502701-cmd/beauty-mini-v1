import sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")

report = """# Task-Beauty-Mini-014 上传链路排查报告

## 1. 上传链路确认

### 流程图
用户选择照片 -> wx.chooseMedia (原: wx.chooseImage) -> uploadService.uploadImage() -> wx.uploadFile -> POST /api/beauty/upload -> beauty-api-pages (Cloudflare Pages) -> upload.ts handler -> parseFormData() -> uploadImage() -> IMAGE_BUCKET R2 put() -> 返回 { success, uploadId, imageKey } -> navigate -> /pages/analyzing?uploadId=xxx&imageUrl=imageKey

### 各阶段代码位置
| 阶段 | 文件 | 行号 |
|------|------|------|
| 选择照片 | beauty-mini-v1/src/pages/upload/index.tsx | L19-L62 |
| 上传服务 | beauty-mini-v1/src/services/upload.ts | L68-L112 |
| API Base URL | beauty-mini-v1/src/services/api-client.ts | L22-L35 |
| 上传处理函数 | beauty-api-pages/functions/api/beauty/upload.ts | L1-L42 |
| R2 存储 | beauty-api-pages/modules/beauty-ai/upload-service.ts | L1-L30 |

---

## 2. 问题定位

### 问题1: 使用已废弃的 wx.chooseImage API
- 位置: upload.ts (原代码) L14-L38, upload/index.tsx L19-L52
- 原因: wx.chooseImage 已被微信官方废弃，推荐改用 wx.chooseMedia。在部分真机环境下，chooseImage 可能导致选择器卡死无响应。
- 修复: 已替换为 wx.chooseMedia({ mediaType: ["image"], ... })
- 影响: 相册选择和相机拍照两个入口均已更新

### 问题2: 缺少上传过程日志
- 位置: upload.ts (原代码)
- 原因: 真机调试时无日志可查，无法定位上传卡住的具体阶段
- 修复: 新增 _logUploadEvent() 函数，仅在开发/测试环境输出以下事件：
  - gallery_pick_success / gallery_pick_fail
  - camera_pick_success / camera_pick_fail
  - upload_start (含目标URL、文件名、大小)
  - upload_success (含状态码、原始响应)
  - upload_fail (含错误信息)
- 环境判断: 使用 wx.getSystemInfoSync().environment 区分 develop/test/normal

### 问题3: formData 字段缺失
- 位置: upload.ts uploadImage() 方法
- 原因: 原代码未发送 formData，可能导致部分真机环境下上传被静默拒绝
- 修复: 已添加 formData: { uploadId: "upload_" + Date.now() }

---

## 3. 域名一致性检查

| 位置 | URL | 状态 |
|------|-----|------|
| api-client.ts (dev) | https://beauty-api-pages.pages.dev | OK |
| api-client.ts (prod) | https://beauty-api-pages.pages.dev | OK |
| upload.ts uploadImage() | getAPIBase() + "/api/beauty/upload" | OK 统一 |
| api.ts uploadFile() | getAPIBase() + serverPath | OK 统一 |
| wrangler.toml | R2 binding: IMAGE_BUCKET, bucket: beauty-images | OK |

结论: 所有上传和请求 URL 统一使用 https://beauty-api-pages.pages.dev，无域名不一致问题。

---

## 4. V8 首页/上传页验证

### 首页 (pages/home/index.tsx)
- Hero 区域正常：标题、副标题、CTA 按钮
- 能力卡片：脸型分析、色彩分析、风格推荐
- 上传指南：三步流程说明
- 报告等级展示：初见妆容/风格进阶/专属美学
- 底部导航：Token / 开始分析 / 我的
- 跳转链路：点击"开始AI美学分析" -> /pages/upload

### 上传页 (pages/upload/index.tsx)
- 初始状态：点击区域触发相册选择，底部两个按钮
- 预览状态：选中图片后显示预览和文件大小
- 确认状态：上传成功后显示"照片已确认"加载动画
- 跳转逻辑：1500ms 后导航至 /pages/analyzing?uploadId=xxx&imageUrl=xxx
- 重新选择/取消按钮正常
- 隐私说明展示

### 分析页 (pages/analyzing/index.tsx)
- 接收 query params: uploadId, imageUrl
- 6阶段动画进度展示
- 调用 analyzeService.analyzeImage() -> POST /api/beauty/analyze
- 调用 reportService.createAndQueryReport() -> 生成报告
- 完成后跳转至 /pages/result?reportId=xxx

---

## 5. 类型检查

npm run typecheck 结果:
- 上传相关文件无新增类型错误
- 预存在的错误（与本次修改无关）:
  - TS2307: Cannot find module 'react' / '@taro/router' -- node_modules 未安装
  - TS2304: Cannot find name 'wx' -- 缺少微信小程序类型声明
  - TS2882: CSS side-effect import -- 缺少 CSS 模块类型声明
  - 多类型冲突错误在 admin/ 和 types/ 目录下 -- 与本次修改无关

构建:
- beauty-mini-v1: node_modules 未安装，无法执行 npm run build
- beauty-api-pages: Wrangler Worker，无 TypeScript 编译步骤

---

## 6. 修改文件清单

| 文件 | 变更内容 |
|------|----------|
| beauty-mini-v1/src/services/upload.ts | 替换 wx.chooseImage -> wx.chooseMedia；新增 _logUploadEvent() 开发日志；添加 formData 字段；修复 BeautyImage.imageUrl 类型错误 |
| beauty-mini-v1/src/pages/upload/index.tsx | 替换 wx.chooseImage -> wx.chooseMedia；更新 handleImageSelected 签名接收 fileSize 参数；修复 URL 参数拼接 |

---

## 7. 真机调试建议

1. 在微信开发者工具中选择"不验证合法域名"进行测试
2. 真机调试时打开"调试面板 -> Network"查看上传请求状态
3. 查看控制台日志中 [upload] 前缀的输出定位卡住阶段
4. 若上传持续超时，检查 R2 bucket beauty-images 是否已创建并绑定到 Pages 项目

---
报告生成时间: 2026-08-01
任务: Task-Beauty-Mini-014
"""

with open(r"C:\Users\yao\Documents\Ai美妆\docs\Task-Beauty-Mini-014-upload-report.md", "w", encoding="utf-8") as f:
    f.write(report)
print("Report written successfully")
