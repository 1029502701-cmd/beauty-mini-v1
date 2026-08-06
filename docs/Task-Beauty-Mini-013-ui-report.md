# Task-Beauty-Mini-013 UI 重构报告

**任务类型**：前端 UI/UX 重构（V8 产品定位调整）
**执行日期**：2026-08-01
**执行范围**：纯前端页面（tsx + css + 文案），不涉及后端接口

---

## 一、修改文件列表

### 已修改文件

| 文件 | 类型 | 变更说明 |
|------|------|---------|
| beauty-mini-v1/src/pages/home/index.tsx | TSX | 首页 V8 重构 |
| beauty-mini-v1/src/pages/home/index.css | CSS | 首页 V8 样式重写 |
| beauty-mini-v1/src/pages/upload/index.tsx | TSX | 上传页 V8 重构 |
| beauty-mini-v1/src/pages/upload/index.css | CSS | 上传页 V8 样式重写 |
| beauty-mini-v1/src/app.tsx | TSX | V1 to V8 文案更新 |
| beauty-mini-v1/app.json | JSON | 导航栏背景色更新为奶油白 |

### 未修改文件（保持原有逻辑）

- src/services/upload.ts  上传逻辑不变
- src/services/analyze.ts  分析逻辑不变
- src/services/report.ts  报告服务不变
- src/services/user-service.ts  用户会话不变
- src/services/api-client.ts  API_BASE 不变
- pages/analyzing/  分析页不变
- pages/result/  结果页不变
- 后端 Cloudflare Functions / D1 结构不变
---

## 二、UI 调整内容

### 2.1 首页 V8 重构（home/index.tsx + CSS）

#### Hero 区
- 标题：发现属于你的美（之前为 AI 美妆分析）
- 副标题：AI分析你的：脸型 · 五官 · 肤色 · 风格
- 主按钮：✨ 开始AI美学分析（之前为 开始分析）
- 新增 AI 美学顾问 徽章标签
- 背景渐变：#FFF5F0 → #FFFAF7（奶油白）
- 按钮渐变：#F4A0B8 → #E8899E（柔和粉色）

#### AI 能力展示区（新增）
- 三个能力卡片并排布局：
  - 🪞 AI 脸型分析 — 识别脸型比例 / 分析五官特点
  - 🎨 色彩分析 — 匹配适合你的色彩方向
  - 💄 风格推荐 — 找到你的专属妆容风格
- 卡片样式：白色背景 + 大圆角(20px) + 轻阴影

#### 上传引导区（新增）
- 三步引导卡片：上传照片 → AI 分析 → 获得报告
- 隐私承诺徽章：✓ 不公开展示 / ✓ 仅用于AI分析 / ✓ 可随时删除
- 浅绿色 badge 样式（#F0F7F2 背景 + #5DA87A 文字）

#### 报告等级展示区（重构）
- 三个等级水平排列：初见妆容（免费体验）/ 风格进阶（探索风格）/ 专属美学（私人定制）
- 不再设计成商城商品，改为水平步骤条样式
- 去掉了商业化商品卡片设计

#### 底部导航（新增）
- 固定底部导航栏：Token / 开始分析（高亮）/ 我的
- 替换原有的分散按钮布局

#### 导航栏更新（app.json）
- 背景色：#1a1a2e → #FFFAF7（奶油白）
- 文字色：white → black
---

## 三、设计系统更新

### 颜色体系
| 用途 | 颜色值 |
|------|--------|
| 页面背景 | #FFFAF7（奶油白） |
| Hero 渐变 | #FFF5F0 → #FFFAF7 |
| 主按钮渐变 | #F4A0B8 → #E8899E（柔和粉） |
| 次要按钮 | 白色 + rgba(232,160,184,0.4) 边框 |
| 隐私成功色 | #5DA87A（浅绿） |
| 警告避免色 | #D4787A（浅红） |
| 文字主色 | #2D2D2D |
| 文字次色 | #6B6B6B / #999 |

### 圆角统一
- 卡片：24px
- 按钮：16px（主）/ 30px（胶囊）
- 输入区域：24px

### 阴影
- 轻阴影：0 2px 8px rgba(200,160,170,0.08)
- 中阴影：0 4px 16px rgba(232,137,158,0.2)
- 主按钮：0 6px 24px rgba(232,137,158,0.35)
---

## 四、兼容性验证

| 项目 | 状态 |
|------|------|
| navigate 路由不变 | ✅ /pages/upload、/pages/analyzing、/pages/result |
| uploadService 调用不变 | ✅ uploadImage() 接口不变 |
| analyzeService 调用不变 | ✅ analyzeImage() 接口不变 |
| reportService 调用不变 | ✅ createAndQueryReport() 接口不变 |
| API_BASE 不变 | ✅ https://beauty-api-pages.pages.dev |
| uploadId/imageUrl 参数传递不变 | ✅ 通过 query params 传递 |
| 微信小程序 wx.chooseImage API | ✅ 未修改 |
| 微信小程序 wx.uploadFile API | ✅ 未修改 |
| Session 逻辑 | ✅ 未修改 |

---

## 五、截图建议

建议在以下设备上截图：
1. iPhone 14/15（390x844）— 主流 iPhone 尺寸
2. 小米 14（393x852）— 主流 Android 尺寸
3. 微信小程序开发者工具 — 预览模式

### 截图位置
1. 首页 — Hero 区 + 三个能力卡片 + 底部导航
2. 首页滚动 — 上传引导区 + 报告等级区
3. 上传页（空状态）— 大卡片 + 照片规范 + 隐私提示
4. 上传页（预览状态）— 照片预览 + 开始AI分析按钮

---

## 六、后续优化建议

1. 首页增加欢迎动效 — Hero 区加入淡入动画，增强首次进入体验
2. 上传页增加拖拽上传（H5环境）— 移动端暂不支持，H5可考虑
3. 首页报告等级可点击 — 点击等级展开详细说明，增加探索感
4. 上传页增加相机水印 — 拍照时显示请拍摄正脸照提示
5. 底部导航增加消息角标 — Token 不足时显示红色提示
6. 首次使用引导 — 用户首次进入时弹出简短引导浮层

---

## 七、注意事项

- 本任务未修改任何后端接口、Cloudflare Functions、D1 数据库结构
- 本任务未修改 AI 分析逻辑、Token 逻辑、报告生成逻辑
- 本任务未修改任何 service 文件的业务逻辑
- 所有修改均为 tsx、css、app.json 层面的 UI 重构