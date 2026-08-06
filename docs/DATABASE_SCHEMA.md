# AI Beauty Mini - Database Schema

> 本文档记录生产环境数据库当前字段，以 `cloudflare-worker/migrations/` 为唯一来源。
> 所有 `id`、`user_id`、`report_id` 字段统一使用 `TEXT` 类型。

## 迁移文件

| 文件 | 描述 |
|------|------|
| `001_create_beauty_reports_table.sql` | 创建 beauty_reports 表 |
| `002_add_image_url_columns.sql` | 为 beauty_reports 添加 image_url / thumbnail_url |
| `003_create_beauty_tasks_table.sql` | 创建 beauty_tasks 表 |
| `004_add_sessions_table.sql` | 创建 user_sessions 表 |
| `005_add_report_session_tracking.sql` | 为 beauty_reports 添加 wechat_open_id / session_id |

## 表结构

### users

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，与 D1 写入一致 |
| `open_id` | TEXT UNIQUE NOT NULL | 微信 openid |
| `nickname` | TEXT | |
| `avatar_url` | TEXT | |
| `created_at` | TEXT | |

### beauty_reports

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT | 主键，格式：`report_<timestamp>_<random>` |
| `user_id` | TEXT NOT NULL | 关联 users.id |
| `image_id` | TEXT | R2 图片 ID（legacy） |
| `image_url` | TEXT | 原图 URL |
| `thumbnail_url` | TEXT | 缩略图 URL |
| `level` | TEXT NOT NULL | 报告等级：first-look / style-upgrade / beauty-pro |
| `status` | TEXT NOT NULL | pending / processing / completed / failed |
| `face_metrics_json` | TEXT NOT NULL | MediaPipe 面部特征 JSON |
| `analysis_json` | TEXT NOT NULL | AI 分析结果 JSON |
| `analysis_version` | TEXT DEFAULT 'v1' | |
| `created_at` | TEXT NOT NULL | |
| `expire_at` | TEXT | 报告过期时间 |
| `wechat_open_id` | TEXT | 微信 openid（审计用） |
| `session_id` | TEXT | 创建时的 session ID（追溯用） |

### beauty_tasks

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PRIMARY KEY | 格式：`report_<timestamp>_<random>` |
| `user_id` | TEXT NOT NULL | |
| `report_id` | TEXT | 关联 beauty_reports.id |
| `status` | TEXT NOT NULL | pending / analyzing / completed / failed |
| `result_json` | TEXT | 任务结果 |
| `created_at` | TEXT NOT NULL | |
| `updated_at` | TEXT | |

### user_sessions

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PRIMARY KEY | 会话 ID |
| `user_id` | TEXT NOT NULL | |
| `session_token` | TEXT UNIQUE NOT NULL | KV 中使用的 token |
| `guest_id` | TEXT | 游客 ID |
| `wechat_open_id` | TEXT | 微信 openid |
| `is_guest` | INTEGER NOT NULL DEFAULT 1 | |
| `created_at` | DATETIME | |
| `expires_at` | DATETIME NOT NULL | 30 天有效期 |
| `last_active_at` | DATETIME | |

## 类型统一说明

所有涉及用户关联的 ID 字段（`id`、`user_id`、`report_id`）在生产迁移中统一使用 `TEXT` 类型，
与 `d1-schema.sql` 原始设计中 `INTEGER` 类型存在冲突，已在此修正。
