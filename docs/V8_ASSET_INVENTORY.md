# V8 Asset Inventory

> 以 V8 产品方案为基准，整理 cloudflare-worker（历史）与 beauty-api-pages（当前生产）之间的能力映射。
> 日期：2026-08-03
> 禁止：删除 V8 功能 / 修改产品逻辑 / 重写业务

---

## 一、AI 分析

| 能力 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|------|------------------|-----------------|------|------|
| `FaceAnalysisEngine` | `functions/api/analyze.ts`（接口定义） | `modules/beauty-ai/face-analysis.ts` | **保留** | 生产版使用 PlaceholderDetector（客户端 MediaPipe 提供真实数据），历史版无实际实现 |
| 人脸存在性检测 | 无（V1简化方案已移除task轮询） | `functions/api/validate-image.ts` + `lib/faceDetection/` | **保留** | beauty-api-pages 实现 HSV 肤色检测，防止无脸图片进入分析流程 |
| AI 报告生成（Rule-based） | `lib/reportGenerator.ts`（596行，完整 rule engine） | `modules/beauty-ai/report-engine/`（generator + style-engine + makeup-engine） | **保留** | 两套实现并行；cloudflare-worker 版本有完整 FACE_SHAPE_RULES 知识库，beauty-api-pages 版本为精简版 |
| AI（Workers AI 绑定） | `wrangler.toml` 有 `[ai] binding = "AI"` | 无 AI 绑定 | **迁移** | cloudflare-worker 已配置 AI binding，beauty-api-pages 尚未接入，V8 需考虑引入 |
| AnalysisTaskWorker（异步任务） | `services/tasks/AnalysisTaskWorker.ts` + queue handler | 无 | **废弃** | V1简化方案已移除 task 系统，改为同步流程（createAndQueryReport） |

## 二、FaceAnalysisEngine

| 能力 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|------|------------------|-----------------|------|------|
| 接口定义 | `functions/api/analyze.ts` 中的 `AnalyzeRequest` 接口 | `modules/beauty-ai/face-analysis.ts` | **保留** | 生产版已实现完整引擎 |
| PlaceholderDetector | 无 | `modules/beauty-ai/face-analysis.ts` | **保留** | 默认 detector，等待客户端 MediaPipe 注入 |

## 三、推荐系统

| 能力 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|------|------------------|-----------------|------|------|
| `RankingService` | 无（`functions/api/products.ts` 使用 Mock 数据） | `modules/beauty-ai/recommendation/ranking.ts` | **保留** | 生产版有完整推荐引擎 |
| 推荐 API | `GET /api/products?reportId=xxx`（Mock） | `GET /api/beauty/recommend` | **保留** | 生产版接收 faceType/skinType/makeupStyle 参数 |

## 四、达人匹配

| 能力 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|------|------------------|-----------------|------|------|
| `CreatorMatcher` | `functions/api/creators.ts`（从 D1 beauty_creators 表查询） | `modules/beauty-ai/recommendation/creator-matcher.ts`（从 datasets/creators.json 加载） | **保留** | 两套数据来源不同：cloudflare-worker 用 D1，beauty-api-pages 用静态 JSON；Admin 后端（cloudflare-worker）有 creator 审批流程 |
| Creator 审批 API | `functions/api/admin/creators.ts` | 无（Admin 后台在 beauty-admin 前端） | **保留** | cloudflare-worker 有完整 creator 管理 API |
| `applyCreator` | `functions/api/creator/apply.ts` | 无 | **废弃** | V8 不依赖此接口 |

## 五、产品匹配

| 能力 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|------|------------------|-----------------|------|------|
| `ProductMatcher` | `functions/api/products.ts`（Mock 数据） | `modules/beauty-ai/recommendation/product-matcher.ts`（从 datasets/products.json 加载） | **保留** | 生产版有完整评分规则 |
| Admin 产品管理 | `functions/api/admin/products.ts` | 无（在 beauty-admin 前端） | **保留** | cloudflare-worker 有 admin CRUD API |

## 六、Prompt 配置

| 能力 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|------|------------------|-----------------|------|------|
| Prompt/规则配置 | `lib/reportGenerator.ts` 中的 FACE_SHAPE_RULES（规则硬编码） | `modules/beauty-ai/report-engine/`（规则硬编码） | **保留** | 两套均有完整规则库，cloudflare-worker 版更详尽 |
| AI Prompt 模板 | 无（AI 未接入） | 无 | **废弃** | 当前无 AI 生成内容，全靠规则引擎 |

## 七、数据库迁移

| 迁移文件 | cloudflare-worker | beauty-api-pages | 状态 | 说明 |
|---------|------------------|-----------------|------|------|
| `001_create_beauty_reports_table.sql` | ✅ | ✅ | **保留** | 两份均有 |
| `002_add_image_url_columns.sql` | ✅ | - | **迁移** | 仅 cloudflare-worker 有，beauty-api-pages 无 |
| `003_create_beauty_tasks_table.sql` | ✅ | - | **废弃** | V1简化方案已移除 task 系统 |
| `004_add_sessions_table.sql` | ✅ | - | **迁移** | session 表，beauty-api-pages 用 KV 替代 |
| `005_add_report_session_tracking.sql` | ✅ | - | **迁移** | wechat_open_id / session_id 追踪 |
| `006_add_admin_tables.sql` | ✅ | - | **保留** | users/beauty_creators/admin_products/token_packages/beauty_orders/admin_operation_logs 表 |
| `007_create_analysis_tasks_table.sql` | ✅ | - | **废弃** | analysis_tasks 表，V1已移除异步任务 |
| `001_token_system.sql` | - | ✅ | **保留** | user_tokens / token_transactions 表，仅 beauty-api-pages 有 |

## 八、生产 API 路由确认

| API | cloudflare-worker | beauty-api-pages | 状态 |
|-----|------------------|-----------------|------|
| `POST /api/wechat-login` | ✅ | ✅ | **保留** |
| `POST /api/wechat-bind` | ✅ | ✅ | **保留** |
| `GET /api/profile` | ✅（Mock） | ✅（有 D1 查询） | **保留** |
| `POST /api/beauty/upload` | ✅ | ✅ | **保留** |
| `POST /api/beauty/analyze` | ❌（无此路由） | ✅ | **保留** |
| `POST /api/beauty/report` | ❌（无此路由） | ✅ | **保留** |
| `GET /api/beauty/report/query` | ❌ | ✅ | **保留** |
| `GET /api/beauty/recommend` | ❌（只有 /api/products Mock） | ✅ | **保留** |
| `GET /api/beauty/access` | ❌ | ✅ | **保留** |
| `GET/POST /api/token/*` | ❌ | ✅（balance + consume） | **保留** |

## 九、总结

### 保留（beauty-api-pages 已有，cloudflare-worker 无或更弱）
- FaceAnalysisEngine（modules/beauty-ai/face-analysis.ts）
- ReportGenerator（modules/beauty-ai/report-engine/）
- RankingService + ProductMatcher + CreatorMatcher
- 完整生产 API 路由（beauty/upload, analyze, report, recommend, access, token）
- Token 系统（user_tokens / token_transactions）
- Session KV 服务（lib/session.ts）

### 迁移（从 cloudflare-worker 引入到 V8）
- `002_add_image_url_columns.sql`（image_url/thumbnail_url 字段）
- `004_add_sessions_table.sql`（备选 D1 session 表，当前用 KV）
- `005_add_report_session_tracking.sql`（wechat_open_id/session_id 审计字段）
- `006_add_admin_tables.sql`（Admin 运营所需表）
- Workers AI 绑定（`[ai] binding = "AI"`）—— V8 需评估是否接入

### 废弃（V8 不再需要）
- `003_create_beauty_tasks_table.sql`（异步 task 系统已移除）
- `007_create_analysis_tasks_table.sql`（同上）
- `services/tasks/AnalysisTaskWorker.ts`（Queue/Scheduled handler）
- `functions/api/creator/apply.ts`（达人申请，Admin 后台处理）
- `functions/api/products.ts`（Mock 产品，被 beauty-api-pages 完整推荐系统替代）
- `lib/reportGenerator.ts`（cloudflare-worker 版，被 modules/beauty-ai/report-engine/ 替代）
