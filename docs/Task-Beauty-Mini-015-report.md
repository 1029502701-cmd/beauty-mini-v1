# Task-Beauty-Mini-015 报告

## 1. 目标回顾

在 Task-Beauty-Mini-014 上传链路基础上，完善上传后的真实业务流程：
- 上传成功 → 创建分析任务 → 等待 AI 分析 → 进入结果页面
- 禁止使用固定 setTimeout 模拟完成，必须基于 API Promise + taskId 驱动

---

## 2. 修改文件清单

### 2.1 `src/types/beauty.ts`
- **变更**：更新 `AnalysisTask.status` 枚举值
- **旧值**：`"pending" | "analyzing" | "completed" | "failed"`
- **新值**：`"pending" | "processing" | "success" | "failed"`
- **影响**：与任务要求的状态规范对齐

### 2.2 `src/pages/upload/index.tsx`
- **变更**：重写状态管理，引入统一 `UploadPhase` 状态机
- **新增类型**：`type UploadPhase = "idle" | "preview" | "uploading" | "analyzing" | "failed"`
- **移除**：`confirmState` / `uploadIdForNavigate` / `imageUrlForNavigate` 分散状态
- **新增状态**：
  - `phase: UploadPhase` - 单一状态源
  - `uploadId` / `imageUrl` - 传输到分析页
- **三态 UI**：
  - `uploading`：显示上传中动画（"上传图片中..."）
  - `analyzing`：显示确认态 + 800ms 后跳转 analyzing 页
  - `failed`：显示错误信息 + 重新上传/返回首页入口
- **路由逻辑**：analyzing 阶段通过 useEffect 自动跳转至 `/pages/analyzing?uploadId=xxx&imageUrl=xxx`

### 2.3 `src/pages/analyzing/index.tsx`
- **变更**：移除固定 `setTimeout` 循环模拟，改为真实 API Promise 驱动
- **移除**：`for (let i=0; i<STAGES.length; i++) { await new Promise(r => setTimeout(r, 600)) }`
- **保留**：视觉阶段动画（每阶段约350ms过渡），仅作为进度展示
- **新增**：
  - `taskStatus: TaskStatus` 状态（pending/processing/success/failed）
  - `taskId` 生成与展示（便于调试）
  - `hasStartedRef` 防止重复触发
  - 错误时显示 taskId + 分析失败原因
- **流程**：
  1. `useEffect` 检测到 `uploadId` 后自动启动分析
  2. 先动画展示 stages 0-3（验证/检测阶段）
  3. 调用 `analyzeService.analyzeImage()`（真实 API）
  4. 动画展示 stage 4（妆容匹配）
  5. 调用 `reportService.createAndQueryReport()`（真实 API）
  6. 动画展示 stage 5（生成报告）
  7. 成功后 600ms 跳转 `/pages/result?reportId=xxx`

### 2.4 `src/pages/result/index.tsx`
- **变更**：去除 `any` 类型，使用 `BeautyReport` 类型
- **`report` state**：`any` → `BeautyReport | null`
- **`recommendProducts`**：`any[]` → 具名类型数组
- **`recommendCreators`**：`any[]` → 具名类型数组
- **`products`/`bloggers`**：从 `report.analysis` 或推荐接口获取，类型明确

---

## 3. 功能说明

### 3.1 上传状态机
```
idle → preview → uploading → analyzing → (navigate to analyzing page)
                                  ↘ failed → retry → preview
```

### 3.2 分析任务状态
```
pending → processing (API调用中) → success (跳转结果页)
                       ↘ failed (显示错误 + 重试入口)
```

### 3.3 用户体验优化
- 上传中：显示"上传图片中..."loading 动画
- 分析中：6阶段进度条 + 旋转扫描动画
- 失败：显示具体错误信息 + taskId + 重试/返回首页按钮
- 所有状态基于真实 API 调用，无固定定时模拟

---

## 4. 验证结果

### TypeScript 类型检查
```
npm run typecheck
```
- **新增错误**：0
- **预存错误**：保持原样（`node_modules` 未安装导致的 `react`/`@taro/router`/`wx` 类型缺失，以及 `admin/` 目录的已有问题）
- **修改文件**：`upload/index.tsx`、`analyzing/index.tsx`、`result/index.tsx`、`types/beauty.ts` 均无新增错误

### 构建
```
npm run build
```
- 环境限制：`taro` CLI 未安装（`node_modules` 缺失），无法执行构建
- 记录原因：依赖未安装，非代码问题

---

## 5. 后续建议

1. **安装依赖**：执行 `npm install` 后可运行完整 typecheck 和 build
2. **后端 API 联调**：`/api/beauty/analyze` 和 `/api/beauty/report` 需确认响应格式与前端 `AnalyzeResult`/`ReportResult` 类型匹配
3. **长任务支持**：当前为同步调用（analyze→report），若后端分析耗时较长，可考虑改为异步任务轮询模式
4. **Analyzing 页面进度条**：当前进度为动画驱动，后续可接入真实 progress 字段（如 `AnalysisTask.progress`）

---

报告生成时间：2026-08-01
任务：Task-Beauty-Mini-015
