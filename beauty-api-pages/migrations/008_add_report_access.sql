-- MIGRATION 008: report_access table — 服务端报告权限记录
-- UNIQUE(user_id, report_id, level) 保证幂等，防止重复扣款

CREATE TABLE IF NOT EXISTS report_access (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  report_id   TEXT NOT NULL,
  level       TEXT NOT NULL CHECK(level IN ('first-look', 'style-upgrade', 'beauty-pro')),
  unlock_type TEXT NOT NULL CHECK(unlock_type IN ('free', 'token')),
  token_cost  INTEGER NOT NULL DEFAULT 0,
  unlocked_at TEXT NOT NULL DEFAULT (datetime('now')),
  expire_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_report_access_user_id ON report_access(user_id);
CREATE INDEX IF NOT EXISTS idx_report_access_report_id ON report_access(report_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_report_access_user_report_level
  ON report_access(user_id, report_id, level);
