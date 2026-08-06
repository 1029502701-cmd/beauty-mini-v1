-- Up
CREATE TABLE IF NOT EXISTS beauty_reports (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  image_id TEXT,
  level TEXT NOT NULL, -- e.g., 'basic', 'standard', 'pro'
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed'
  face_metrics_json TEXT NOT NULL,
  analysis_json TEXT NOT NULL,
  analysis_version TEXT DEFAULT 'v1',
  created_at TEXT NOT NULL,
  expire_at TEXT
);

-- Index for user lookups
CREATE INDEX IF NOT EXISTS idx_beauty_reports_user_id ON beauty_reports(user_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_beauty_reports_status ON beauty_reports(status);

-- Down
DROP INDEX IF EXISTS idx_beauty_reports_status;
DROP INDEX IF EXISTS idx_beauty_reports_user_id;
DROP TABLE IF EXISTS beauty_reports;
