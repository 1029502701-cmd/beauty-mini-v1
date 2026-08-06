# Task-Beauty-Admin-003 Report: Admin Service Adapter → Real API Architecture

**日期**: 2026-08-01
**状态**: Completed
**前置任务**: Task-Beauty-Admin-002

---

## 概述

在 Task-Beauty-Admin-002 完成 8 个后台模块骨架的基础上，本次任务将 Service Adapter 层从纯 Mock 数据升级为真实 API 调用结构，建立统一 API Client，补充数据模型，并完善权限系统。

---

## 完成内容

### 1. 统一 API Client (`admin/src/services/apiClient.ts`)

新增 `apiClient.ts`，核心能力：

| 能力 | 说明 |
|------|------|
| `baseUrl` 配置 | 支持 `VITE_BACKEND_URL` 环境变量 / `window.__ADMIN_BACKEND_URL` / 默认值 |
| 请求封装 | 统一 `GET/POST/PUT/PATCH/DELETE` 方法，含 `AbortController` 超时控制（默认 10s） |
| Error 处理 | 抛出 `ApiError`（含 `status`/`code`/`details`），区分超时、网络错误、HTTP 错误 |
| Token/Session | 自动注入 `X-Admin-Session-Id` / `Authorization: Bearer` 请求头 |
| Fallback 工具 | 导出 `callOrFallback(fn, fallback)` 供 Service 层优雅降级 |

### 2. Service Adapter 改造（8 个文件全部更新）

所有 Service 统一改为以下结构：

```
API call (apiClient) → try → 返回 API 数据
                            ↓ catch
                      fallback → Mock 数据
```

| 文件 | API 路径 | Fallback |
|------|----------|----------|
| `userService.ts` | `GET /api/admin/users` | 5 条 mock 用户 |
| `reportService.ts` | `GET /api/admin/reports` | 5 条 mock 报告 |
| `taskService.ts` | `GET /api/admin/tasks` | 5 条 mock 任务 |
| `creatorService.ts` | `GET /api/admin/creators` | 4 条 mock 达人 |
| `productService.ts` | `GET /api/admin/products` | 4 条 mock 商品 |
| `contentService.ts` | `GET /api/admin/content` | 5 条 mock 内容 |
| `tokenService.ts` | `GET /api/admin/tokens/*` | 4 套餐 + 4 订单 |
| `settingsService.ts` | `GET/PATCH /api/admin/settings` | 默认配置 |

**保证**: 页面组件不变，接口契约不变，仅 Service 内部实现切换。

### 3. 数据模型扩展 (`types/admin.ts`)

新增 6 个 D1 原始记录类型（用于对接后端表结构）：

- `BeautyReportRecord` — beauty_reports 表原始行
- `AITaskRecord` — beauty_tasks 表原始行
- `CreatorRecord` — beauty_creators 表原始行
- `OrderRecord` — beauty_orders 表原始行
- `ProductRecord` — 管理端商品实体
- `TokenPackageRecord` — 管理端 Token 套餐实体

### 4. Dashboard 数据接口化 (`dashboardService.ts`)

- `fetchDashboardStats()` → `getStats()`
- 调用 `GET /api/admin/dashboard/stats`
- 失败时返回 `MOCK_STATS` 并保留 300ms 延迟模拟（UX 一致性）

### 5. 权限系统增强 (`usePermission.ts`)

在原有 `can()` / `hasRole()` 基础上新增：

| 方法 | 用途 |
|------|------|
| `canAny(resource, actions[])` | 判断是否有任一权限（用于整块 UI 显隐） |
| `require(resource, action)` | 抛错守卫（用于事件处理器前置校验） |

### 6. 后端 Admin API 路由 (`cloudflare-worker/functions/api/admin/`)

新增 9 个后端路由处理器（含 D1 查询 + 降级 Mock）：

```
functions/api/admin/
├── dashboard.ts   → GET  /api/admin/dashboard/stats
├── users.ts       → GET  /api/admin/users
│                    → PATCH /api/admin/users/:id/status
├── reports.ts     → GET  /api/admin/reports
│                    → DELETE /api/admin/reports/:id
├── tasks.ts       → GET  /api/admin/tasks
│                    → POST /api/admin/tasks/:id/retry
├── creators.ts    → GET  /api/admin/creators
│                    → PATCH /api/admin/creators/:id
├── products.ts    → GET  /api/admin/products
│                    → PATCH /api/admin/products/:id
├── content.ts     → GET  /api/admin/content
│                    → PATCH /api/admin/content/:id/status
├── tokens.ts      → GET  /api/admin/tokens/packages
│                    → GET  /api/admin/tokens/orders
│                    → PATCH /api/admin/tokens/packages/:id/status
└── settings.ts    → GET  /api/admin/settings
                     → PATCH /api/admin/settings
```

`functions/index.ts` 已更新，在路由表末尾追加 `/api/admin` 前缀匹配块。

---

## 验证结果

| 检查项 | 结果 |
|--------|------|
| `npx tsc --noEmit` | ✅ 通过（0 错误） |
| `npm run build` | ✅ 通过（64 modules, 214 kB JS） |
| beauty-mini-v1 未修改 | ✅ 确认未触碰 |

---

## 文件变更清单

| 文件 | 变更 |
|------|------|
| `admin/src/services/apiClient.ts` | **新增** 统一 API Client |
| `admin/src/services/userService.ts` | 改造为 API + fallback |
| `admin/src/services/reportService.ts` | 改造为 API + fallback |
| `admin/src/services/taskService.ts` | 改造为 API + fallback |
| `admin/src/services/creatorService.ts` | 改造为 API + fallback |
| `admin/src/services/productService.ts` | 改造为 API + fallback |
| `admin/src/services/contentService.ts` | 改造为 API + fallback |
| `admin/src/services/tokenService.ts` | 改造为 API + fallback |
| `admin/src/services/settingsService.ts` | 改造为 API + fallback |
| `admin/src/services/dashboardService.ts` | 改为 `getStats()` + API 调用 |
| `admin/src/guard/usePermission.ts` | 新增 `canAny` / `require` |
| `admin/src/types/admin.ts` | 新增 6 个 Record 类型 |
| `admin/src/pages/dashboard/Dashboard.tsx` | 更新 import |
| `cloudflare-worker/functions/api/admin/*` | **新增** 9 个路由处理器 |
| `cloudflare-worker/functions/index.ts` | 追加 admin 路由块 |

---

## 后续建议

1. **D1 表补充**: `users` 表缺少 `status` 字段，需新增 `beauty_user_profiles` 或扩展 `users` 表
2. **商品/内容/订单表**: 当前为 Mock 降级，待 `beauty_products` / `beauty_content` / `beauty_orders` 建表后启用真实查询
3. **Admin 认证**: 当前无 Session 校验，需增加 admin 登录接口及中间件鉴权
4. **环境变量**: 建议配置 `VITE_BACKEND_URL` 以支持本地开发联调
