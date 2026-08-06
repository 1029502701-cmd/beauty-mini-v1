# Task-BeautyMini-044

## 修复内容

修复 Task-BeautyMini-043 审计发现的三个 P0 上线阻断问题。

### P0-1 报告越权访问修复
- **问题**：GET /api/reports/:id 仅按 reportId 查询，未校验报告归属，任何有效 Session 可读取他人报告
- **修复**：在 findById 后增加 report.userId !== userId 校验，不一致时返回 403 Forbidden
- **影响**：防止用户遍历 reportId 获取其他用户面部分析数据和照片 URL

### P0-2 imageUrl 闭包修复
- **问题**：upload/index.tsx useEffect 中引用了 result.imageUrl，但 result 仅在 handleConfirmUpload 闭包内定义，useEffect 中为 undefined
- **修复**：新增 imageUrlForNavigate state 变量，在 handleConfirmUpload 中保存 imageUrl，useEffect 中读取该 state；增加 imageUrl 为空时的用户提示
- **影响**：确保 analyzing 页面能接收到正确的 imageUrl，触发真实 MediaPipe 人脸分析而非 fallback

### P0-3 首页审核文案修复
- **问题**：首页 footer 包含演示文案，会导致微信小程序审核拒绝
- **修复**：替换为正式产品描述文案
- **影响**：消除小程序审核风险

## 修改文件

1. cloudflare-worker/functions/index.ts - P0-1 owner 校验
2. beauty-mini-v1/src/pages/upload/index.tsx - P0-2 imageUrl 闭包修复
3. beauty-mini-v1/src/pages/home/index.tsx - P0-3 审核文案替换

## 验证结果

| 检查项 | 结果 |
|--------|------|
| P0-1：report.userId !== userId 校验存在 | PASS |
| P0-1：403 status 返回 | PASS |
| P0-1：无权限访问错误消息 | PASS |
| P0-2：imageUrlForNavigate state 变量 | PASS |
| P0-2：setImageUrlForNavigate 在 upload 成功后调用 | PASS |
| P0-2：useEffect 使用 state 而非闭包变量 | PASS |
| P0-2：imageUrl 为空时提示重新上传 | PASS |
| P0-3：demo/V1 文案已删除 | PASS |
| P0-3：新文案为正式产品描述 | PASS |
| P0-2：analyzing 页面正确接收 imageUrl query 参数 | PASS |

## 是否解除上线阻断

是，三个 P0 阻断问题已全部修复。

修复后代码状态：
- 报告访问路径：Session userId -> 查询报告 -> owner 校验 -> 403/200
- 上传路径：uploadService.uploadImage() -> imageUrl state -> useEffect 读取 state -> navigate 携带正确 imageUrl
- 首页：无审核风险文案，文案为正式产品描述
