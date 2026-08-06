# AI Beauty Mini — TypeScript `any` 风险统计

> 生成时间：2026-07-31
> 范围：cloudflare-worker/ + beauty-mini-v1/src/（不含 node_modules）

## Cloudflare Worker（后端）

| 文件 | 数量 | 风险等级 | 后续建议 |
|------|------|---------|---------|
| `functions/index.ts` | 1 | 🟡 中 | `env: any` → 定义 WorkerEnv 接口 |
| `lib/reportRepository.ts` | 6 | 🟡 中 | 定义 `D1PreparedStatement` 类型；`params: any[]` 改为联合类型 |
| `lib/session.ts` | 1 | 🟢 低 | `crypto` 在 Worker 环境可用，TS 类型缺失属环境问题 |
| `functions/api/creator/apply.ts` | 2 | 🟡 中 | `env: any` → WorkerEnv |
| `functions/api/products.ts` | 1 | 🟡 中 | `env: any` → WorkerEnv |
| `functions/api/creators.ts` | 2 | 🟡 中 | `env: any` + `row: any` → 定义行类型 |
| `functions/api/profile.ts` | 1 | 🟡 中 | `env: any` → WorkerEnv |
| `functions/api/wechat-bind.ts` | 1 | 🟡 中 | `env: any` → WorkerEnv |
| `functions/api/wechat-login.ts` | 1 | 🟡 中 | `env: any` → WorkerEnv |
| `test-minimal.ts` | 1 | 🟢 低 | 测试文件，可忽略 |
| **合计** | **17** | | |

## 小程序前端

| 文件 | 数量 | 风险等级 | 后续建议 |
|------|------|---------|---------|
| `services/report.ts` | 7 | 🟡 中 | `d1Report: any` → 定义 D1Report 接口 |
| `services/api-client.ts` | 5 | 🟢 低 | `body: any` 在通用请求中可接受 |
| `services/beauty-token-service.ts` | 8 | 🟢 低 | 本地存储操作，any 在类型不明确时合理 |
| `services/order.ts` | 6 | 🟢 低 | 同上 |
| `services/token.ts` | 6 | 🟢 低 | 同上 |
| `recommendation/MatchingScore.ts` | 5 | 🟡 中 | 参数应定义接口 |
| `services/recommendation-service.ts` | 2 | 🟡 低 | 权重配置类型可扩展 |
| `services/face-analysis/FaceAnalysisEngine.ts` | 1 | 🟢 低 | 转换函数参数 |
| `pages/upload/index.tsx` | 1 | 🟢 低 | 事件参数，可选 |
| `services/content-permission.ts` | 1 | 🟢 低 | 泛型约束已使用 |
| **合计** | **42** | | |

## 总体统计

| 区域 | any 使用数 | 风险等级 |
|------|-----------|---------|
| Cloudflare Worker | 17 | 中等 |
| 小程序前端 | 42 | 中低 |
| **总计** | **59** | |

## 优先修复建议

1. **P0**：定义 `WorkerEnv` 接口替代所有 `env: any`（共 8 处）
2. **P1**：`reportRepository.ts` 中 `db: any` 改为 D1 数据库类型（共 6 处）
3. **P2**：前端 `report.ts` 中 D1 报告适配函数定义类型（共 7 处）

> 注：本次 Task-049 不修改任何代码，仅统计。
